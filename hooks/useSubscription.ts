/**
 * hooks/useSubscription.ts
 * Hook cliente para estado de suscripción — BeautySync Fase 5
 * Consume GET /api/billing/status
 */

"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired"
  | null;

type SubscriptionPlan = "starter" | "pro" | null;

interface Subscription {
  id: string;
  salon_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_start: string;
  current_period_end: string;
  external_subscription_id: string | null;
  payment_method_last4: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface UseSubscriptionReturn {
  // Datos
  subscription: Subscription | null;
  effectiveStatus: SubscriptionStatus;
  daysRemaining: number | null;

  // Flags derivados — los más usados en la UI
  isActive: boolean;
  isTrialing: boolean;
  isPastDue: boolean;
  isExpired: boolean;
  isCanceled: boolean;
  isBlocked: boolean; // true cuando el acceso está cortado (expired | canceled)

  // Plan
  plan: SubscriptionPlan;
  isPro: boolean;
  isStarter: boolean;

  // Estado del fetch
  isLoading: boolean;
  error: string | null;

  // Refrescar manualmente (útil post-pago)
  refresh: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [effectiveStatus, setEffectiveStatus] =
    useState<SubscriptionStatus>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchStatus() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/billing/status", {
          // No cachear — siempre queremos el estado más reciente
          cache: "no-store",
        });

        if (!res.ok) {
          // 401 es esperado si no hay sesión — no es un error real
          if (res.status === 401) {
            if (!cancelled) setIsLoading(false);
            return;
          }
          throw new Error(`Error ${res.status}`);
        }

        const data = await res.json();

        if (!cancelled) {
          setSubscription(data.subscription ?? null);
          setEffectiveStatus(data.effectiveStatus ?? null);
          setDaysRemaining(data.daysRemaining ?? null);
          setIsActive(data.isActive ?? false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error desconocido");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchStatus();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // ── Flags derivados ────────────────────────────────────────────────────────
  const status = effectiveStatus;
  const plan = subscription?.plan ?? null;

  return {
    // Datos
    subscription,
    effectiveStatus,
    daysRemaining,

    // Flags de estado
    isActive,
    isTrialing: status === "trialing",
    isPastDue: status === "past_due",
    isExpired: status === "expired",
    isCanceled: status === "canceled",
    isBlocked: status === "expired" || status === "canceled",

    // Plan
    plan,
    isPro: plan === "pro",
    isStarter: plan === "starter",

    // Fetch
    isLoading,
    error,
    refresh,
  };
}
