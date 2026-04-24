// app/api/account/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

// supabaseAdmin — bypass RLS, solo en servidor, nunca exponer al cliente
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export async function DELETE(request: NextRequest) {
  try {
    // ── 1. Verificar sesión activa ─────────────────────────────────────
    const supabase = createRouteSupabaseClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // ── 2. Verificar ownership del salón (anti-IDOR) ───────────────────
    const { data: salon, error: salonError } = await supabase
      .from("salons")
      .select("id, name")
      .eq("owner_id", user.id)
      .single();

    if (salonError || !salon) {
      return NextResponse.json(
        { error: "Salón no encontrado" },
        { status: 404 },
      );
    }

    // ── 3. Verificar contraseña actual (re-autenticación) ──────────────
    const body = (await request.json()) as { password: string };

    if (!body.password) {
      return NextResponse.json(
        { error: "Contraseña requerida" },
        { status: 400 },
      );
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: body.password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: "Contraseña incorrecta" },
        { status: 401 },
      );
    }

    // ── 4. Eliminar archivos de Storage ────────────────────────────────
    const { data: storageFiles } = await supabaseAdmin.storage
      .from("salon-assets")
      .list(salon.id);

    if (storageFiles && storageFiles.length > 0) {
      const filePaths = storageFiles.map((file) => `${salon.id}/${file.name}`);
      await supabaseAdmin.storage.from("salon-assets").remove(filePaths);
    }

    // ── 5. Eliminar salón → CASCADE elimina todo lo demás ─────────────
    const { error: salonDeleteError } = await supabaseAdmin
      .from("salons")
      .delete()
      .eq("id", salon.id);

    if (salonDeleteError) throw salonDeleteError;

    // ── 6. Eliminar usuario de auth.users ──────────────────────────────
    const { error: userDeleteError } =
      await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (userDeleteError) throw userDeleteError;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[DELETE /api/account/delete]", error);
    return NextResponse.json(
      { error: "Error interno. Contacta a soporte." },
      { status: 500 },
    );
  }
}
