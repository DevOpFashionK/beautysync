// app/api/appointments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const UpdateAppointmentSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]),
  cancellation_reason: z.string().max(300).optional().or(z.literal("")),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const supabase = createRouteSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
    }

    const result = UpdateAppointmentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: result.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { status, cancellation_reason } = result.data;

    const { data: existing, error: fetchError } = await supabase
      .from("appointments")
      .select("id, status, salon_id, salons!inner(owner_id)")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    const salonData = existing.salons as { owner_id: string } | null;
    if (salonData?.owner_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (existing.status === "cancelled" || existing.status === "completed") {
      return NextResponse.json(
        { error: `No se puede modificar una cita ${existing.status === "cancelled" ? "cancelada" : "completada"}` },
        { status: 409 }
      );
    }

    // Tipado explícito compatible con Supabase
    const updatePayload: {
      status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
      cancellation_reason?: string | null;
      cancelled_at?: string | null;
    } = { status };

    if (status === "cancelled") {
      updatePayload.cancellation_reason = cancellation_reason || null;
      updatePayload.cancelled_at = new Date().toISOString();
    }

    const { data: updated, error: updateError } = await supabase
      .from("appointments")
      .update(updatePayload)
      .eq("id", id)
      .select("id, status, cancellation_reason, cancelled_at, updated_at")
      .single();

    if (updateError) {
      console.error("[PATCH /api/appointments/[id]]", updateError);
      return NextResponse.json({ error: "Error al actualizar la cita" }, { status: 500 });
    }

    return NextResponse.json({ appointment: updated });
  } catch (error) {
    console.error("[PATCH /api/appointments/[id]] Unexpected:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const supabase = createRouteSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: appointment, error } = await supabase
      .from("appointments")
      .select(`
        id, salon_id, service_id, client_name, client_email,
        client_phone, client_notes, scheduled_at, ends_at,
        status, cancellation_reason, cancelled_at, created_at,
        services(name, duration_minutes, price)
      `)
      .eq("id", id)
      .single();

    if (error || !appointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("[GET /api/appointments/[id]] Unexpected:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}