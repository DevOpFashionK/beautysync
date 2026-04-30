/**
 * app/(dashboard)/dashboard/billing/upgrade/page.tsx
 * Página de upgrade dedicada — BeautySync Fase 6.3
 * Server Component — foco en conversión de trial/expired a pago
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PricingPlans } from "@/components/dashboard/billing/PricingPlans";
import { Sparkles, ArrowLeft, Clock, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Elige tu plan — BeautySync",
};

export const dynamic = "force-dynamic";

// ─── Tokens Dark Atelier ──────────────────────────────────────────────────────
const t = {
  bg: "#080706",
  surface: "#0E0C0B",
  surface2: "#131110",
  border: "rgba(255,255,255,0.055)",
  borderMid: "rgba(255,255,255,0.09)",
  rose: "#FF2D55",
  roseDim: "rgba(255,45,85,0.55)",
  roseGhost: "rgba(255,45,85,0.08)",
  roseBorder: "rgba(255,45,85,0.22)",
  textPrimary: "rgba(245,242,238,0.9)",
  textMid: "rgba(245,242,238,0.45)",
  textDim: "rgba(245,242,238,0.18)",
  // Semánticos
  amber: "rgba(245,158,11,0.80)",
  amberBorder: "rgba(245,158,11,0.22)",
  amberGhost: "rgba(245,158,11,0.08)",
  neutral: "rgba(245,242,238,0.35)",
  neutralBorder: "rgba(255,255,255,0.09)",
  neutralGhost: "rgba(255,255,255,0.03)",
};

// ── Mensajes según el motivo de redirección — tokens Dark Atelier ─────────────
const REASON_CONFIG = {
  expired: {
    icon: Clock,
    title: "Tu período de prueba ha terminado",
    description:
      "Esperamos que hayas disfrutado los 14 días. Elige un plan para seguir gestionando tu salón sin interrupciones.",
    color: t.amber,
    bg: t.amberGhost,
    border: t.amberBorder,
  },
  canceled: {
    icon: XCircle,
    title: "Tu suscripción fue cancelada",
    description:
      "Puedes reactivar tu cuenta en cualquier momento eligiendo el plan que mejor se adapte a tu salón.",
    color: t.neutral,
    bg: t.neutralGhost,
    border: t.neutralBorder,
  },
  no_subscription: {
    icon: AlertCircle,
    title: "Activa tu suscripción",
    description:
      "Elige un plan para comenzar a usar BeautySync y gestionar las citas de tu salón.",
    color: t.roseDim,
    bg: t.roseGhost,
    border: t.roseBorder,
  },
} as const;

type ReasonKey = keyof typeof REASON_CONFIG;

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const params = await searchParams;

  // ── Auth ──────────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // ── Salón ─────────────────────────────────────────────────────────────────
  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, primary_color")
    .eq("owner_id", user.id)
    .single();

  if (!salon) redirect("/dashboard");

  // ── Suscripción actual ────────────────────────────────────────────────────
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("salon_id", salon.id)
    .maybeSingle();

  const primaryColor = salon.primary_color ?? "#FF2D55";

  // ── Razón de la redirección ───────────────────────────────────────────────
  const reason = (params.reason ?? "expired") as ReasonKey;
  const config = REASON_CONFIG[reason] ?? REASON_CONFIG.expired;
  const Icon = config.icon;

  return (
    <div style={{ minHeight: "100vh", background: t.bg }}>
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
            "radial-gradient(circle at top right, rgba(255,45,85,0.05) 0%, transparent 65%)",
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
          gap: "24px",
          zIndex: 1,
        }}
      >
        {/* ── Volver al billing ─────────────────────────────────────── */}
        <Link
          href="/dashboard/billing"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            color: t.textDim,
            textDecoration: "none",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            transition: "color 0.18s",
            width: "fit-content",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = t.textMid)}
          onMouseLeave={(e) => (e.currentTarget.style.color = t.textDim)}
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          Ver facturación
        </Link>

        {/* ── Header ───────────────────────────────────────────────── */}
        <div>
          {/* Eyebrow */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <span
              style={{
                display: "block",
                width: "14px",
                height: "1px",
                background: t.roseDim,
              }}
            />
            <span
              style={{
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: t.roseDim,
              }}
            >
              Elige tu plan
            </span>
          </div>

          <h1
            style={{
              fontFamily:
                "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 300,
              color: t.textPrimary,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              margin: "0 0 8px",
            }}
          >
            Continúa con{" "}
            <em style={{ fontStyle: "normal", color: t.rose }}>BeautySync.</em>
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: t.textMid,
              letterSpacing: "0.02em",
              margin: 0,
              fontWeight: 300,
            }}
          >
            Sin contratos. Cancela cuando quieras.
          </p>
        </div>

        {/* ── Banner de contexto según reason ──────────────────────── */}
        <div
          style={{
            borderRadius: "12px",
            padding: "16px 18px",
            border: `1px solid ${config.border}`,
            background: config.bg,
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: config.bg,
              border: `1px solid ${config.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={16} strokeWidth={1.5} style={{ color: config.color }} />
          </div>
          <div>
            <p
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
                fontSize: "18px",
                fontWeight: 300,
                color: t.textPrimary,
                margin: "0 0 4px",
                letterSpacing: "0.01em",
              }}
            >
              {config.title}
            </p>
            <p
              style={{
                fontSize: "12px",
                color: t.textMid,
                margin: 0,
                lineHeight: 1.65,
              }}
            >
              {config.description}
            </p>
          </div>
        </div>

        {/* Divisor */}
        <div style={{ height: "1px", background: t.border }} />

        {/* ── Cards de planes ───────────────────────────────────────── */}
        <PricingPlans
          currentPlan={subscription?.plan}
          currentStatus={subscription?.status}
          primaryColor={primaryColor}
        />

        {/* ── Nota de soporte ───────────────────────────────────────── */}
        <div style={{ textAlign: "center", paddingBottom: "8px" }}>
          <p
            style={{
              fontSize: "11px",
              color: t.textDim,
              lineHeight: 1.7,
            }}
          >
            ¿Tienes preguntas?{" "}
            <a
              href="mailto:soporte@beautysync.co"
              style={{
                color: t.textMid,
                textDecoration: "underline",
                transition: "color 0.18s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = t.textPrimary)
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color = t.textMid)
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
