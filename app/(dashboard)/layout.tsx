/**
 * app/(dashboard)/layout.tsx
 * BeautySync — Fase 4
 *
 * REGLA: NO agregar padding aquí. Cada página maneja su propio layout interno.
 * FIX: Mapear primary_color → primaryColor y logo_url → logoUrl antes de
 *      pasarlo a SalonProvider (que espera camelCase).
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SalonProvider } from "@/context/SalonContext";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { SubscriptionGate } from "@/components/dashboard/SubscriptionGate";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
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

  // Calcular estado efectivo de suscripción
  let effectiveStatus = subscription?.status ?? null;
  if (
    effectiveStatus === "trialing" &&
    subscription?.trial_ends_at &&
    new Date(subscription.trial_ends_at) < new Date()
  ) {
    effectiveStatus = "expired";
  }

  let trialDaysRemaining: number | null = null;
  if (effectiveStatus === "trialing" && subscription?.trial_ends_at) {
    const trialEnd = new Date(subscription.trial_ends_at);
    trialDaysRemaining = Math.max(
      0,
      Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );
  }

  const primaryColor = salon.primary_color ?? "#D4375F";

  // MAPEO CRÍTICO: Supabase devuelve snake_case, SalonContext espera camelCase
  const initialSalon = {
    id: salon.id,
    name: salon.name,
    primaryColor,          // primary_color  → primaryColor
    logoUrl: salon.logo_url, // logo_url     → logoUrl
  };

  return (
    <SalonProvider initialSalon={initialSalon}>
      <SubscriptionGate
        status={effectiveStatus}
        trialDaysRemaining={trialDaysRemaining}
        primaryColor={primaryColor}
        salonName={salon.name}
      >
        {/* Estructura idéntica a Fase 3 — sin padding aquí */}
        <div className="flex h-screen bg-[#FAF8F5] overflow-hidden">
          <DashboardSidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </SubscriptionGate>
    </SalonProvider>
  );
}