// app/api/billing/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

// Cliente admin para bypass de RLS al actualizar subscriptions
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    // ── 1. Verificar autenticación ──────────────────────────────────
    const supabase = createRouteSupabaseClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // ── 2. Obtener el salón del usuario autenticado ─────────────────
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

    // ── 3. Obtener la suscripción activa del salón ──────────────────
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("id, status, current_period_end")
      .eq("salon_id", salon.id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: "Suscripción no encontrada" },
        { status: 404 },
      );
    }

    // ── 4. Validar que solo se cancelen suscripciones activas ───────
    if (subscription.status !== "active") {
      return NextResponse.json(
        {
          error: `Solo se puede cancelar una suscripción activa. Estado actual: ${subscription.status}`,
        },
        { status: 400 },
      );
    }

    // ── 5. Marcar como cancelada (acceso hasta current_period_end) ──
    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    if (updateError) {
      console.error("[Cancel] Error actualizando suscripción:", updateError);
      return NextResponse.json(
        { error: "Error al cancelar la suscripción" },
        { status: 500 },
      );
    }

    console.log(
      `[Cancel] Suscripción cancelada — salón: ${salon.name}, ` +
        `acceso hasta: ${subscription.current_period_end}`,
    );

    return NextResponse.json({
      ok: true,
      canceledAt: new Date().toISOString(),
      accessUntil: subscription.current_period_end,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[Cancel] Error inesperado:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
