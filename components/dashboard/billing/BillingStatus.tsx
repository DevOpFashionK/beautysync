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

const STATUS_CONFIG = {
  trialing: {
    icon: Clock,
    label: "Trial gratuito",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    iconColor: "#3B82F6",
  },
  active: {
    icon: CheckCircle2,
    label: "Suscripción activa",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    iconColor: "#10B981",
  },
  past_due: {
    icon: AlertTriangle,
    label: "Pago pendiente",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    iconColor: "#F59E0B",
  },
  canceled: {
    icon: XCircle,
    label: "Cancelada",
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
    iconColor: "#9CA3AF",
  },
  expired: {
    icon: XCircle,
    label: "Expirada",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    iconColor: "#EF4444",
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
  primaryColor = "#D4375F",
}: BillingStatusProps) {
  const statusKey = (effectiveStatus ??
    "expired") as keyof typeof STATUS_CONFIG;
  const config = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.expired;
  const Icon = config.icon;

  const planLabel =
    subscription?.plan === "pro"
      ? "Pro"
      : subscription?.plan === "starter"
        ? "Starter"
        : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`rounded-2xl border p-5 ${config.bg} ${config.border}`}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${config.iconColor}20` }}
        >
          <Icon className="w-5 h-5" style={{ color: config.iconColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold text-sm ${config.text}`}>
              {config.label}
            </span>
            {subscription?.plan && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Plan {planLabel}
              </span>
            )}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
            {effectiveStatus === "trialing" && subscription?.trial_ends_at && (
              <div className="flex items-center gap-1.5 col-span-2">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs text-blue-600">
                  Trial termina:{" "}
                  <strong>
                    {formatDateSimple(subscription.trial_ends_at)}
                  </strong>
                  {daysRemaining !== null && (
                    <span className="ml-1 font-normal">
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
                    <p className="text-xs text-[#9C8E85]">Desde</p>
                    <p className="text-xs font-medium text-[#2D2420]">
                      {formatDateSimple(subscription.current_period_start)}
                    </p>
                  </div>
                )}
                {subscription?.current_period_end && (
                  <div>
                    <p className="text-xs text-[#9C8E85]">Próximo cobro</p>
                    <p className="text-xs font-medium text-[#2D2420]">
                      {formatDateSimple(subscription.current_period_end)}
                      {daysRemaining !== null && (
                        <span className="text-[#9C8E85] font-normal ml-1">
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
                className="text-xs col-span-2"
                style={{ color: config.iconColor }}
              >
                Activa un plan para seguir usando BeautySync sin interrupciones.
              </p>
            )}

            {effectiveStatus === "past_due" && (
              <p className="text-xs text-amber-700 col-span-2">
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
