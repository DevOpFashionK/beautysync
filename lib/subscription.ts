import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

// ─── Cliente con service role (bypass RLS para escrituras) ───────────────────
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── Tipos ───────────────────────────────────────────────────────────────────
export type SubscriptionPlan = Database["public"]["Enums"]["subscription_plan"];
export type SubscriptionStatus =
  Database["public"]["Enums"]["subscription_status"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

export type SubscriptionResult =
  | { active: true; subscription: Subscription }
  | {
      active: false;
      subscription: Subscription | null;
      reason: "expired" | "canceled" | "no_subscription";
    };

// ─── Límites por plan ────────────────────────────────────────────────────────
export const PLAN_LIMITS = {
  starter: {
    appointmentsPerMonth: 60,
    services: 5,
    employees: 1,
    customBranding: false,
    prioritySupport: false,
    revenueReports: false,
  },
  pro: {
    appointmentsPerMonth: Infinity,
    services: Infinity,
    employees: 5,
    customBranding: true,
    prioritySupport: true,
    revenueReports: true,
  },
} as const satisfies Record<
  SubscriptionPlan,
  {
    appointmentsPerMonth: number;
    services: number;
    employees: number;
    customBranding: boolean;
    prioritySupport: boolean;
    revenueReports: boolean;
  }
>;

// ─── Obtener suscripción raw ──────────────────────────────────────────────────
export async function getSubscription(
  salonId: string,
): Promise<Subscription | null> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("salon_id", salonId)
    .single();

  if (error || !data) return null;
  return data;
}

// ─── Verificar si la suscripción permite acceso completo ──────────────────────
export async function getSubscriptionStatus(
  salonId: string,
): Promise<SubscriptionResult> {
  const subscription = await getSubscription(salonId);

  if (!subscription) {
    return { active: false, subscription: null, reason: "no_subscription" };
  }

  const status = subscription.status;

  // trialing: verificar que no haya vencido
  if (status === "trialing") {
    const trialEnd = subscription.trial_ends_at
      ? new Date(subscription.trial_ends_at)
      : null;

    if (!trialEnd || trialEnd < new Date()) {
      return { active: false, subscription, reason: "expired" };
    }

    return { active: true, subscription };
  }

  // active: acceso completo
  if (status === "active") {
    const periodEnd = new Date(subscription.current_period_end);
    if (periodEnd < new Date()) {
      return { active: false, subscription, reason: "expired" };
    }
    return { active: true, subscription };
  }

  // past_due: acceso limitado — lo tratamos como activo pero el dashboard
  // mostrará un banner de advertencia (se maneja en el layout del dashboard)
  if (status === "past_due") {
    return { active: true, subscription };
  }

  // canceled / expired: bloqueado
  return {
    active: false,
    subscription,
    reason: status === "canceled" ? "canceled" : "expired",
  };
}

// ─── Shorthand boolean para el middleware ─────────────────────────────────────
export async function isSubscriptionActive(salonId: string): Promise<boolean> {
  const result = await getSubscriptionStatus(salonId);
  return result.active;
}

// ─── Obtener límites del plan actual ─────────────────────────────────────────
export async function getPlanLimits(salonId: string) {
  const subscription = await getSubscription(salonId);
  const plan: SubscriptionPlan = subscription?.plan ?? "starter";
  return PLAN_LIMITS[plan];
}

// ─── Verificar límite de citas del mes actual ─────────────────────────────────
export async function checkAppointmentLimit(salonId: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  plan: SubscriptionPlan;
}> {
  const subscription = await getSubscription(salonId);
  const plan: SubscriptionPlan = subscription?.plan ?? "starter";
  const limit = PLAN_LIMITS[plan].appointmentsPerMonth;

  // Plan pro: ilimitado, no consultamos la DB
  if (limit === Infinity) {
    return { allowed: true, current: 0, limit: Infinity, plan };
  }

  // Contar citas del mes en curso
  const now = new Date();
  const firstOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();
  const firstOfNext = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1,
  ).toISOString();

  const { count, error } = await supabaseAdmin
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("salon_id", salonId)
    .neq("status", "cancelled")
    .gte("scheduled_at", firstOfMonth)
    .lt("scheduled_at", firstOfNext);

  if (error) {
    // En caso de error de DB, permitimos para no bloquear al negocio
    console.error("[checkAppointmentLimit] Error consultando citas:", error);
    return { allowed: true, current: 0, limit, plan };
  }

  const current = count ?? 0;
  return {
    allowed: current < limit,
    current,
    limit,
    plan,
  };
}

// ─── Crear suscripción de prueba al completar onboarding ──────────────────────
export async function createTrialSubscription(
  salonId: string,
): Promise<Subscription | null> {
  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 14);

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .insert({
      salon_id: salonId,
      plan: "starter",
      status: "trialing",
      trial_ends_at: trialEnd.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: trialEnd.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("[createTrialSubscription] Error:", error);
    return null;
  }

  return data;
}
