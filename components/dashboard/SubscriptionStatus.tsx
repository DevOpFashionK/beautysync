"use client";

// components/dashboard/SubscriptionStatus.tsx
import { motion } from "framer-motion";
import { Clock, AlertTriangle, XCircle, CheckCircle } from "lucide-react";

type SubscriptionStatusType =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

interface SubscriptionStatusProps {
  status: string;
  trialEndsAt: string | null;
  periodEnd: string | null;
}

function daysRemaining(dateStr: string | null): number {
  if (!dateStr) return 0;
  const end = new Date(dateStr);
  const now = new Date();
  return Math.max(
    0,
    Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

// ── Banner base Dark Atelier ──────────────────────────────────────────────────
function StatusBanner({
  icon: Icon,
  children,
  variant,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
  variant: "amber" | "red" | "blue" | "rose";
}) {
  const styles = {
    amber: {
      background: "rgba(234,179,8,0.07)",
      border: "1px solid rgba(234,179,8,0.22)", // ✅ fix: 0.18 → 0.22
      color: "rgba(251,191,36,0.85)",
      iconColor: "rgba(251,191,36,0.7)",
    },
    red: {
      background: "rgba(239,68,68,0.07)",
      border: "1px solid rgba(239,68,68,0.22)", // ✅ fix: 0.18 → 0.22
      color: "rgba(252,165,165,0.85)",
      iconColor: "rgba(252,165,165,0.7)",
    },
    blue: {
      background: "rgba(59,130,246,0.07)",
      border: "1px solid rgba(99,179,237,0.22)", // ✅ fix: 0.18 → 0.22 + token info exacto
      color: "rgba(147,197,253,0.85)",
      iconColor: "rgba(147,197,253,0.7)",
    },
    rose: {
      background: "rgba(255,45,85,0.08)", // ✅ fix: 0.07 → roseGhost 0.08
      border: "1px solid rgba(255,45,85,0.22)", // ✅ fix: 0.2 → roseBorder 0.22
      color: "rgba(255,120,120,0.85)",
      iconColor: "rgba(255,45,85,0.6)",
    },
  };

  const s = styles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 16px",
        borderRadius: "10px",
        fontSize: "13px",
        lineHeight: 1.55,
        background: s.background,
        border: s.border,
        color: s.color,
      }}
    >
      <Icon
        size={15}
        strokeWidth={1.5}
        style={{ color: s.iconColor, flexShrink: 0 }}
      />
      <span>{children}</span>
    </motion.div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function SubscriptionStatus({
  status,
  trialEndsAt,
  periodEnd,
}: SubscriptionStatusProps) {
  const typedStatus = status as SubscriptionStatusType;

  // Active con bastante tiempo — no mostrar nada
  if (typedStatus === "active") {
    const days = daysRemaining(periodEnd);
    if (days > 7) return null;
  }

  if (typedStatus === "trialing") {
    const days = daysRemaining(trialEndsAt);
    if (days > 10) return null; // Solo mostrar si quedan ≤10 días

    return (
      <StatusBanner icon={Clock} variant="amber">
        Tu prueba gratuita termina en{" "}
        <strong style={{ color: "rgba(251,191,36,0.95)" }}>{days} días</strong>.
        Activa tu suscripción para continuar sin interrupciones.
      </StatusBanner>
    );
  }

  if (typedStatus === "past_due") {
    return (
      <StatusBanner icon={AlertTriangle} variant="amber">
        Tu pago está pendiente. Actualiza tu método de pago para mantener acceso
        completo.
      </StatusBanner>
    );
  }

  if (typedStatus === "expired" || typedStatus === "canceled") {
    return (
      <StatusBanner icon={XCircle} variant="red">
        Tu suscripción ha expirado. Reactiva tu plan para acceder a todas las
        funciones.
      </StatusBanner>
    );
  }

  // Active con pocos días
  if (typedStatus === "active") {
    const days = daysRemaining(periodEnd);
    return (
      <StatusBanner icon={CheckCircle} variant="blue">
        Tu suscripción renueva en{" "}
        <strong style={{ color: "rgba(147,197,253,0.95)" }}>{days} días</strong>
        .
      </StatusBanner>
    );
  }

  return null;
}
