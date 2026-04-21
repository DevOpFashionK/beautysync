// app/api/services/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

// ─── Schemas ──────────────────────────────────────────────────────────────────
const ServiceSchema = z.object({
  salon_id: z.string().uuid(),
  name: z.string().min(2, "Nombre muy corto").max(80, "Nombre muy largo"),
  duration_minutes: z
    .number()
    .int()
    .min(15, "Mínimo 15 minutos")
    .max(480, "Máximo 8 horas"),
  price: z.number().min(0, "Precio inválido").max(99999),
  description: z.string().max(300).optional().or(z.literal("")),
  is_active: z.boolean().optional().default(true),
});

const UpdateServiceSchema = ServiceSchema.partial().extend({
  id: z.string().uuid(),
});

// ─── POST — crear servicio ────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // Cliente que lee cookies del request HTTP — propaga la sesión correctamente
    const supabase = createRouteSupabaseClient(request);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const result = ServiceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: result.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    // Verificar que el salón pertenece al usuario autenticado
    const { data: salon } = await supabase
      .from("salons")
      .select("id")
      .eq("id", result.data.salon_id)
      .eq("owner_id", user.id)
      .single();

    if (!salon) {
      return NextResponse.json({ error: "Salón no encontrado" }, { status: 404 });
    }

    // Insertar — RLS lo permite porque el usuario está autenticado y es owner
    const { data, error } = await supabase
      .from("services")
      .insert({
        salon_id: result.data.salon_id,
        name: result.data.name.trim(),
        duration_minutes: result.data.duration_minutes,
        price: result.data.price,
        description: result.data.description?.trim() || null,
        is_active: result.data.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/services]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ service: data }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/services] Unexpected:", e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// ─── PATCH — actualizar servicio ──────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteSupabaseClient(request);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const result = UpdateServiceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: result.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { id, ...updateData } = result.data;

    // Verificar que el servicio pertenece a un salón del usuario
    const { data: existing } = await supabase
      .from("services")
      .select("id, salons!inner(owner_id)")
      .eq("id", id)
      .single();

    const salonData = existing?.salons as { owner_id: string } | null;
    if (!existing || salonData?.owner_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("services")
      .update({
        ...updateData,
        name: updateData.name?.trim(),
        description: updateData.description?.trim() || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[PATCH /api/services]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ service: data });
  } catch (e) {
    console.error("[PATCH /api/services] Unexpected:", e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// ─── DELETE — soft delete (desactivar) ───────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteSupabaseClient(request);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    // Verificar ownership antes de modificar
    const { data: existing } = await supabase
      .from("services")
      .select("id, salons!inner(owner_id)")
      .eq("id", id)
      .single();

    const salonData = existing?.salons as { owner_id: string } | null;
    if (!existing || salonData?.owner_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Soft delete — mantiene integridad del historial de citas
    const { error } = await supabase
      .from("services")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("[DELETE /api/services]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[DELETE /api/services] Unexpected:", e);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}