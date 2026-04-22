import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function serviceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const baseRedirect = `${process.env.NEXT_PUBLIC_APP_URL}/confirm/${token}`;

  // 1. Validar formato UUID v4
  if (!UUID_REGEX.test(token)) {
    return NextResponse.redirect(`${baseRedirect}?status=invalid`);
  }

  const supabase = serviceRoleClient();

  // 2. Buscar la cita por token
  const { data: appt, error } = await supabase
    .from("appointments")
    .select("id, status, scheduled_at")
    .eq("confirmation_token", token)
    .maybeSingle();

  if (error) {
    console.error("[confirm] DB error:", error);
    return NextResponse.redirect(`${baseRedirect}?status=error`);
  }

  if (!appt) {
    return NextResponse.redirect(`${baseRedirect}?status=not_found`);
  }

  // 3. Verificar que la cita sea futura
  const now = new Date();
  const scheduledAt = new Date(appt.scheduled_at);
  if (scheduledAt <= now) {
    return NextResponse.redirect(`${baseRedirect}?status=expired`);
  }

  // 4. Si ya está confirmada — idempotente
  if (appt.status !== "pending") {
    return NextResponse.redirect(`${baseRedirect}?status=already_confirmed`);
  }

  // 5. Actualizar a confirmed — anti race-condition
  const { error: updateError } = await supabase
    .from("appointments")
    .update({ status: "confirmed", updated_at: new Date().toISOString() })
    .eq("id", appt.id)
    .eq("status", "pending");

  if (updateError) {
    console.error("[confirm] Update error:", updateError);
    return NextResponse.redirect(`${baseRedirect}?status=error`);
  }

  return NextResponse.redirect(`${baseRedirect}?status=success`);
}
