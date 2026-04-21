/**
 * app/(dashboard)/dashboard/billing/page.tsx
 * Página de facturación y planes — BeautySync Fase 4
 * Server Component — carga datos en servidor
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isSubscriptionActive } from "@/lib/wompi";
import { BillingStatus } from "@/components/dashboard/billing/BillingStatus";
import { PricingPlans } from "@/components/dashboard/billing/PricingPlans";
import { PaymentMethod } from "@/components/dashboard/billing/PaymentMethod";
import { Receipt, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Facturación — BeautySync",
};

// Forzar revalidación en cada visita (importante para ver el pago procesado)
export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_ref?: string; demo?: string; plan?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const params = await searchParams;

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Salón
  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, primary_color")
    .eq("owner_id", user.id)
    .single();

  if (!salon) redirect("/dashboard");

  // Suscripción
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("salon_id", salon.id)
    .maybeSingle();

  const primaryColor = salon.primary_color ?? "#D4375F";

  // Calcular estado efectivo y días restantes
  let effectiveStatus = subscription?.status ?? null;
  let daysRemaining: number | null = null;

  if (
    effectiveStatus === "trialing" &&
    subscription?.trial_ends_at &&
    new Date(subscription.trial_ends_at) < new Date()
  ) {
    effectiveStatus = "expired";
  }

  if (effectiveStatus === "trialing" && subscription?.trial_ends_at) {
    const trialEnd = new Date(subscription.trial_ends_at);
    daysRemaining = Math.max(
      0,
      Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    );
  } else if (effectiveStatus === "active" && subscription?.current_period_end) {
    const periodEnd = new Date(subscription.current_period_end);
    daysRemaining = Math.max(
      0,
      Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    );
  }

  const isActive = isSubscriptionActive(
    effectiveStatus as Parameters<typeof isSubscriptionActive>[0],
  );

  // Detectar retorno de Wompi con referencia de pago
  const paymentRef = params.payment_ref;
  const isDemo = params.demo === "1";

  return (
    <div className="min-h-full bg-[#FAF8F5]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-5 h-5" style={{ color: primaryColor }} />
            <p
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: primaryColor }}
            >
              Facturación
            </p>
          </div>
          <h1 className="font-display text-3xl text-[#2D2420]">
            Tu suscripción
          </h1>
          <p className="text-[#9C8E85] text-sm mt-1">
            Gestiona tu plan y método de pago
          </p>
        </div>

        {/* Banner de pago exitoso */}
        {(paymentRef || isDemo) && (
          <div
            className="rounded-2xl p-4 border flex items-start gap-3"
            style={{
              backgroundColor: `${primaryColor}10`,
              borderColor: `${primaryColor}30`,
            }}
          >
            <Sparkles
              className="w-5 h-5 mt-0.5 shrink-0"
              style={{ color: primaryColor }}
            />
            <div>
              <p
                className="font-semibold text-sm"
                style={{ color: primaryColor }}
              >
                {isDemo ? "Modo demo activado" : "¡Pago recibido!"}
              </p>
              <p className="text-xs text-[#9C8E85] mt-0.5">
                {isDemo
                  ? "Tu suscripción se activará automáticamente cuando configures las credenciales de Wompi."
                  : "Tu suscripción se está procesando. Puede tomar unos minutos en reflejarse. Recarga la página si no ves el cambio."}
              </p>
              {paymentRef && !isDemo && (
                <p className="text-xs text-[#C4B8B0] mt-1 font-mono">
                  Ref: {paymentRef}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Estado actual */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#2D2420] uppercase tracking-wide">
            Estado actual
          </h2>
          <BillingStatus
            subscription={subscription}
            effectiveStatus={effectiveStatus}
            daysRemaining={daysRemaining}
            primaryColor={primaryColor}
          />
        </div>

        {/* Método de pago — solo si tiene suscripción activa */}
        {isActive && subscription?.payment_method_last4 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[#2D2420] uppercase tracking-wide">
              Pago
            </h2>
            <PaymentMethod
              subscription={subscription}
              primaryColor={primaryColor}
            />
          </div>
        )}

        {/* Separador */}
        <div className="border-t border-[#EDE8E3]" />

        {/* Planes — siempre visible para permitir upgrade/cambio */}
        <PricingPlans
          currentPlan={subscription?.plan}
          currentStatus={effectiveStatus}
          primaryColor={primaryColor}
        />

        {/* Nota legal */}
        <div className="text-center space-y-1 pb-4">
          <p className="text-xs text-[#C4B8B0]">
            Al suscribirte aceptas nuestros{" "}
            <span className="underline cursor-pointer">
              Términos de servicio
            </span>{" "}
            y{" "}
            <span className="underline cursor-pointer">
              Política de privacidad
            </span>
            .
          </p>
          <p className="text-xs text-[#C4B8B0]">
            ¿Preguntas? Escríbenos a{" "}
            <a
              href="mailto:soporte@beautysync.co"
              className="underline hover:text-[#9C8E85] transition-colors"
            >
              soporte@beautysync.co
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
