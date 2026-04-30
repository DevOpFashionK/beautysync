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
import { CancelSubscription } from "@/components/dashboard/billing/CancelSubscription";
import { Receipt } from "lucide-react";
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

  const primaryColor = salon.primary_color ?? "#FF2D55";

  // Calcular estado efectivo y días restantes (hora El Salvador UTC-6)
  const nowSV = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/El_Salvador" }),
  );
  let effectiveStatus = subscription?.status ?? null;
  let daysRemaining: number | null = null;

  if (
    effectiveStatus === "trialing" &&
    subscription?.trial_ends_at &&
    new Date(subscription.trial_ends_at) < nowSV
  ) {
    effectiveStatus = "expired";
  }

  if (effectiveStatus === "trialing" && subscription?.trial_ends_at) {
    const trialEnd = new Date(
      new Date(subscription.trial_ends_at).toLocaleString("en-US", {
        timeZone: "America/El_Salvador",
      }),
    );
    daysRemaining = Math.max(
      0,
      Math.ceil((trialEnd.getTime() - nowSV.getTime()) / (1000 * 60 * 60 * 24)),
    );
  } else if (effectiveStatus === "active" && subscription?.current_period_end) {
    const periodEnd = new Date(
      new Date(subscription.current_period_end).toLocaleString("en-US", {
        timeZone: "America/El_Salvador",
      }),
    );
    daysRemaining = Math.max(
      0,
      Math.ceil(
        (periodEnd.getTime() - nowSV.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
  }

  const isActive = isSubscriptionActive(
    effectiveStatus as Parameters<typeof isSubscriptionActive>[0],
  );

  // Detectar retorno de Wompi
  const paymentRef = params.payment_ref;
  const isDemo = params.demo === "1";

  return (
    <div style={{ minHeight: "100vh", background: "#080706" }}>
      {/* Radial sutil */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(circle at top right, rgba(255,45,85,0.04) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        className="relative"
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "40px 24px 80px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          zIndex: 1,
        }}
      >
        {/* ── Header ───────────────────────────────────────────────── */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "10px",
            }}
          >
            <Receipt size={14} style={{ color: "rgba(255,45,85,0.5)" }} />
            <span
              style={{
                fontSize: "10px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,45,85,0.5)",
              }}
            >
              Facturación
            </span>
          </div>
          <h1
            style={{
              fontFamily:
                "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 300,
              color: "rgba(245,242,238,0.9)",
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            Tu suscripción
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "rgba(245,242,238,0.2)",
              marginTop: "6px",
              letterSpacing: "0.02em",
            }}
          >
            Gestiona tu plan y método de pago
          </p>
        </div>

        {/* ── Banner pago exitoso / demo ────────────────────────────── */}
        {(paymentRef || isDemo) && (
          <div
            style={{
              borderRadius: "10px",
              padding: "16px 18px",
              border: "1px solid rgba(52,211,153,0.2)",
              background: "rgba(16,185,129,0.07)",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "rgba(52,211,153,0.7)",
                flexShrink: 0,
                marginTop: "5px",
              }}
            />
            <div>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 400,
                  color: "rgba(52,211,153,0.85)",
                  margin: "0 0 4px",
                }}
              >
                {isDemo ? "Modo demo activado" : "¡Pago recibido!"}
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "rgba(245,242,238,0.3)",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {isDemo
                  ? "Tu suscripción se activará automáticamente cuando configures las credenciales de Wompi."
                  : "Tu suscripción se está procesando. Puede tomar unos minutos en reflejarse. Recarga la página si no ves el cambio."}
              </p>
              {paymentRef && !isDemo && (
                <p
                  style={{
                    fontSize: "10px",
                    color: "rgba(245,242,238,0.18)",
                    marginTop: "6px",
                    fontFamily: "monospace",
                  }}
                >
                  Ref: {paymentRef}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Estado actual ─────────────────────────────────────────── */}
        <div>
          <p
            style={{
              fontSize: "10px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(245,242,238,0.2)",
              marginBottom: "10px",
            }}
          >
            Estado actual
          </p>
          <BillingStatus
            subscription={subscription}
            effectiveStatus={effectiveStatus}
            daysRemaining={daysRemaining}
            primaryColor={primaryColor}
          />
        </div>

        {/* ── Método de pago — solo si activo con last4 ─────────────── */}
        {isActive && subscription?.payment_method_last4 && (
          <div>
            <p
              style={{
                fontSize: "10px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(245,242,238,0.2)",
                marginBottom: "10px",
              }}
            >
              Pago
            </p>
            <PaymentMethod
              subscription={subscription}
              primaryColor={primaryColor}
            />
          </div>
        )}

        {/* ── Cancelar — solo si activo ─────────────────────────────── */}
        {isActive && subscription?.status === "active" && (
          <CancelSubscription
            primaryColor={primaryColor}
            accessUntil={subscription.current_period_end ?? null}
          />
        )}

        {/* ── Divider ───────────────────────────────────────────────── */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />

        {/* ── Planes ───────────────────────────────────────────────── */}
        <PricingPlans
          currentPlan={subscription?.plan}
          currentStatus={effectiveStatus}
          primaryColor={primaryColor}
        />

        {/* ── Nota legal ───────────────────────────────────────────── */}
        <div style={{ textAlign: "center", paddingBottom: "8px" }}>
          <p
            style={{
              fontSize: "11px",
              color: "rgba(245,242,238,0.15)",
              lineHeight: 1.7,
            }}
          >
            Al suscribirte aceptas nuestros{" "}
            <span style={{ textDecoration: "underline", cursor: "pointer" }}>
              Términos de servicio
            </span>{" "}
            y{" "}
            <span style={{ textDecoration: "underline", cursor: "pointer" }}>
              Política de privacidad
            </span>
            .
          </p>
          <p
            style={{
              fontSize: "11px",
              color: "rgba(245,242,238,0.12)",
              marginTop: "4px",
            }}
          >
            ¿Preguntas? Escríbenos a{" "}
            <a
              href="mailto:soporte@beautysync.co"
              style={{
                color: "rgba(245,242,238,0.2)",
                textDecoration: "underline",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  "rgba(245,242,238,0.45)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  "rgba(245,242,238,0.2)")
              }
            >
              soporte@beautysync.co
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
