// app/api/billing/expire-subscriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente con Service Role Key — necesario para escribir en subscriptions (bypass RLS)
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

// Protegido con CRON_SECRET — mismo patrón que send-reminders
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("[Cron:expire] CRON_SECRET no está definido");
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const now = new Date().toISOString();
  let expiredTrials = 0;
  let expiredActive = 0;
  const errors: string[] = [];

  // ── 1. Expirar trials vencidos ──────────────────────────────────────
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .update({ status: "expired", updated_at: now })
      .eq("status", "trialing")
      .lt("trial_ends_at", now)
      .select("id");

    if (error) throw error;
    expiredTrials = data?.length ?? 0;
    console.log(`[Cron:expire] Trials expirados: ${expiredTrials}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error expirando trials";
    console.error("[Cron:expire] Error en trials:", msg);
    errors.push(`trials: ${msg}`);
  }

  // ── 2. Expirar suscripciones activas vencidas ───────────────────────
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .update({ status: "expired", updated_at: now })
      .eq("status", "active")
      .lt("current_period_end", now)
      .select("id");

    if (error) throw error;
    expiredActive = data?.length ?? 0;
    console.log(`[Cron:expire] Activas expiradas: ${expiredActive}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error expirando activas";
    console.error("[Cron:expire] Error en activas:", msg);
    errors.push(`active: ${msg}`);
  }

  // ── Respuesta ────────────────────────────────────────────────────────
  const hasErrors = errors.length > 0;
  return NextResponse.json(
    {
      ok: !hasErrors,
      expiredTrials,
      expiredActive,
      total: expiredTrials + expiredActive,
      ...(hasErrors && { errors }),
    },
    { status: hasErrors ? 207 : 200 }, // 207 = partial success
  );
}

// Bloquear otros métodos
export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
