"use client";

/**
 * components/dashboard/billing/BillingStatus.tsx
 * Estado actual de la suscripción — BeautySync Fase 4
 */

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Calendar,
} from "lucide-react";
import type { Database } from "@/types/database.types";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

interface BillingStatusProps {
  subscription: Subscription | null;
  effectiveStatus: string | null;
  daysRemaining: number | null;
  primaryColor?: string;
}

// ─── Config de estados — Dark Atelier ────────────────────────────────────────

const STATUS_CONFIG = {
  trialing: {
    icon: Clock,
    label: "Trial gratuito",
    bg: "rgba(59,130,246,0.07)",
    border: "rgba(59,130,246,0.18)",
    iconBg: "rgba(59,130,246,0.1)",
    iconColor: "rgba(147,197,253,0.85)",
    textColor: "rgba(147,197,253,0.85)",
    subColor: "rgba(147,197,253,0.6)",
    metaColor: "rgba(245,242,238,0.35)",
    metaStrong: "rgba(245,242,238,0.7)",
  },
  active: {
    icon: CheckCircle2,
    label: "Suscripción activa",
    bg: "rgba(16,185,129,0.07)",
    border: "rgba(16,185,129,0.18)",
    iconBg: "rgba(16,185,129,0.1)",
    iconColor: "rgba(52,211,153,0.85)",
    textColor: "rgba(52,211,153,0.85)",
    subColor: "rgba(52,211,153,0.5)",
    metaColor: "rgba(245,242,238,0.35)",
    metaStrong: "rgba(245,242,238,0.7)",
  },
  past_due: {
    icon: AlertTriangle,
    label: "Pago pendiente",
    bg: "rgba(234,179,8,0.07)",
    border: "rgba(234,179,8,0.18)",
    iconBg: "rgba(234,179,8,0.1)",
    iconColor: "rgba(251,191,36,0.85)",
    textColor: "rgba(251,191,36,0.85)",
    subColor: "rgba(251,191,36,0.6)",
    metaColor: "rgba(245,242,238,0.35)",
    metaStrong: "rgba(245,242,238,0.7)",
  },
  canceled: {
    icon: XCircle,
    label: "Cancelada",
    bg: "rgba(255,255,255,0.03)",
    border: "rgba(255,255,255,0.07)",
    iconBg: "rgba(255,255,255,0.04)",
    iconColor: "rgba(245,242,238,0.25)",
    textColor: "rgba(245,242,238,0.35)",
    subColor: "rgba(245,242,238,0.2)",
    metaColor: "rgba(245,242,238,0.25)",
    metaStrong: "rgba(245,242,238,0.5)",
  },
  expired: {
    icon: XCircle,
    label: "Expirada",
    bg: "rgba(239,68,68,0.07)",
    border: "rgba(239,68,68,0.18)",
    iconBg: "rgba(239,68,68,0.1)",
    iconColor: "rgba(252,165,165,0.85)",
    textColor: "rgba(252,165,165,0.85)",
    subColor: "rgba(252,165,165,0.5)",
    metaColor: "rgba(245,242,238,0.35)",
    metaStrong: "rgba(245,242,238,0.7)",
  },
};

function formatDateSimple(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function BillingStatus({
  subscription,
  effectiveStatus,
  daysRemaining,
  primaryColor = "#FF2D55",
}: BillingStatusProps) {
  const statusKey = (effectiveStatus ??
    "expired") as keyof typeof STATUS_CONFIG;
  const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.expired;
  const Icon = cfg.icon;

  const planLabel =
    subscription?.plan === "pro"
      ? "Pro"
      : subscription?.plan === "starter"
        ? "Starter"
        : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        borderRadius: "10px",
        border: `1px solid ${cfg.border}`,
        background: cfg.bg,
        padding: "18px 20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
        {/* Ícono */}
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: cfg.iconBg,
          }}
        >
          <Icon size={16} strokeWidth={1.75} style={{ color: cfg.iconColor }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Label + badge de plan */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "10px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: 400,
                color: cfg.textColor,
              }}
            >
              {cfg.label}
            </span>
            {subscription?.plan && (
              <span
                style={{
                  fontSize: "10px",
                  padding: "2px 9px",
                  borderRadius: "20px",
                  color: "rgba(245,242,238,0.85)",
                  background: `${primaryColor}22`,
                  border: `1px solid ${primaryColor}30`,
                  letterSpacing: "0.05em",
                }}
              >
                Plan {planLabel}
              </span>
            )}
          </div>

          {/* Detalle según estado */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px 24px",
            }}
          >
            {effectiveStatus === "trialing" && subscription?.trial_ends_at && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Calendar
                  size={12}
                  strokeWidth={1.5}
                  style={{ color: cfg.subColor, flexShrink: 0 }}
                />
                <span style={{ fontSize: "12px", color: cfg.subColor }}>
                  Trial termina:{" "}
                  <strong style={{ color: cfg.metaStrong, fontWeight: 400 }}>
                    {formatDateSimple(subscription.trial_ends_at)}
                  </strong>
                  {daysRemaining !== null && (
                    <span style={{ color: cfg.metaColor }}>
                      {" "}
                      ({daysRemaining} día{daysRemaining !== 1 ? "s" : ""}{" "}
                      restante{daysRemaining !== 1 ? "s" : ""})
                    </span>
                  )}
                </span>
              </div>
            )}

            {effectiveStatus === "active" && (
              <>
                {subscription?.current_period_start && (
                  <div>
                    <p
                      style={{
                        fontSize: "10px",
                        color: cfg.metaColor,
                        marginBottom: "2px",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Desde
                    </p>
                    <p style={{ fontSize: "12px", color: cfg.metaStrong }}>
                      {formatDateSimple(subscription.current_period_start)}
                    </p>
                  </div>
                )}
                {subscription?.current_period_end && (
                  <div>
                    <p
                      style={{
                        fontSize: "10px",
                        color: cfg.metaColor,
                        marginBottom: "2px",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Próximo cobro
                    </p>
                    <p style={{ fontSize: "12px", color: cfg.metaStrong }}>
                      {formatDateSimple(subscription.current_period_end)}
                      {daysRemaining !== null && (
                        <span style={{ color: cfg.metaColor }}>
                          {" "}
                          ({daysRemaining}d)
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </>
            )}

            {(effectiveStatus === "expired" ||
              effectiveStatus === "canceled") && (
              <p
                style={{
                  fontSize: "12px",
                  color: cfg.subColor,
                  gridColumn: "1 / -1",
                }}
              >
                Activa un plan para seguir usando BeautySync sin interrupciones.
              </p>
            )}

            {effectiveStatus === "past_due" && (
              <p
                style={{
                  fontSize: "12px",
                  color: cfg.subColor,
                  gridColumn: "1 / -1",
                }}
              >
                Hay un problema con tu pago. Por favor actualiza tu método de
                pago.
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
