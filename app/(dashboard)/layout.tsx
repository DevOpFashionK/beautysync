/**
 * app/(dashboard)/layout.tsx
 * BeautySync — Fase 4 → Fase 7.5
 *
 * REGLA: NO agregar padding aquí. Cada página maneja su propio layout interno.
 * FIX: Mapear primary_color → primaryColor y logo_url → logoUrl antes de
 *      pasarlo a SalonProvider (que espera camelCase).
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SalonProvider, type SubscriptionData } from "@/context/SalonContext";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { SubscriptionGate } from "@/components/dashboard/SubscriptionGate";
import SessionTimeout from "@/components/providers/SessionTimeout"; // ← NUEVO Fase 7.5

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, slug, primary_color, logo_url, is_active")
    .eq("owner_id", user.id)
    .single();

  if (!salon) redirect("/login");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, trial_ends_at, current_period_end, plan")
    .eq("salon_id", salon.id)
    .maybeSingle();

  const nowSV = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/El_Salvador" }),
  );

  let effectiveStatus = subscription?.status ?? null;
  if (
    effectiveStatus === "trialing" &&
    subscription?.trial_ends_at &&
    new Date(subscription.trial_ends_at) < nowSV
  ) {
    effectiveStatus = "expired";
  }

  let trialDaysRemaining: number | null = null;
  if (effectiveStatus === "trialing" && subscription?.trial_ends_at) {
    const trialEnd = new Date(
      new Date(subscription.trial_ends_at).toLocaleString("en-US", {
        timeZone: "America/El_Salvador",
      }),
    );
    trialDaysRemaining = Math.max(
      0,
      Math.ceil((trialEnd.getTime() - nowSV.getTime()) / (1000 * 60 * 60 * 24)),
    );
  }

  const primaryColor = salon.primary_color ?? "#D4375F";

  const initialSalon = {
    id: salon.id,
    name: salon.name,
    primaryColor,
    logoUrl: salon.logo_url,
  };

  const initialSubscription: SubscriptionData = {
    plan: subscription?.plan ?? null,
    status: subscription?.status ?? null,
    effectiveStatus,
  };

  return (
    <SalonProvider
      initialSalon={initialSalon}
      initialSubscription={initialSubscription}
    >
      <SessionTimeout /> {/* ← NUEVO Fase 7.5 */}
      <SubscriptionGate
        status={effectiveStatus}
        trialDaysRemaining={trialDaysRemaining}
        primaryColor={primaryColor}
        salonName={salon.name}
      >
        {/* Estructura idéntica a Fase 3 — sin padding aquí */}
        <div className="flex h-screen bg-[#FAF8F5] overflow-hidden">
          <DashboardSidebar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </SubscriptionGate>
    </SalonProvider>
  );
}
