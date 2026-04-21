/**
 * app/api/billing/status/route.ts
 * Estado de suscripción del salón — BeautySync Fase 4
 *
 * GET /api/billing/status
 * Returns: { subscription, daysRemaining, isActive }
 */

import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabaseClient } from "@/lib/supabase/server";
import { isSubscriptionActive } from "@/lib/wompi";

export async function GET(request: NextRequest) {
  const supabase = createRouteSupabaseClient(request);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Obtener salón
  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!salon) {
    return NextResponse.json({ error: "Salón no encontrado" }, { status: 404 });
  }

  // Obtener suscripción
  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("salon_id", salon.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Error obteniendo suscripción" },
      { status: 500 },
    );
  }

  // Calcular días restantes
  let daysRemaining: number | null = null;

  if (subscription?.status === "trialing" && subscription.trial_ends_at) {
    const trialEnd = new Date(subscription.trial_ends_at);
    const now = new Date();
    daysRemaining = Math.max(
      0,
      Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );
  } else if (
    subscription?.status === "active" &&
    subscription.current_period_end
  ) {
    const periodEnd = new Date(subscription.current_period_end);
    const now = new Date();
    daysRemaining = Math.max(
      0,
      Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );
  }

  // Detectar trial expirado
  let effectiveStatus = subscription?.status ?? null;
  if (
    effectiveStatus === "trialing" &&
    subscription?.trial_ends_at &&
    new Date(subscription.trial_ends_at) < new Date()
  ) {
    effectiveStatus = "expired";
  }

  return NextResponse.json({
    subscription,
    effectiveStatus,
    daysRemaining,
    isActive: isSubscriptionActive(
      effectiveStatus as Parameters<typeof isSubscriptionActive>[0],
    ),
  });
}
