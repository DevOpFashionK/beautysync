"use client";

import { motion } from "framer-motion";
import { Clock, AlertTriangle, XCircle, CheckCircle } from "lucide-react";

type SubscriptionStatusType = "trialing" | "active" | "past_due" | "canceled" | "expired";

interface SubscriptionStatusProps {
  status: string;
  trialEndsAt: string | null;
  periodEnd: string | null;
}

function daysRemaining(dateStr: string | null): number {
  if (!dateStr) return 0;
  const end = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function SubscriptionStatus({
  status,
  trialEndsAt,
  periodEnd,
}: SubscriptionStatusProps) {
  const typedStatus = status as SubscriptionStatusType;

  // No mostrar nada si está active con bastante tiempo restante
  if (typedStatus === "active") {
    const days = daysRemaining(periodEnd);
    if (days > 7) return null;
  }

  if (typedStatus === "trialing") {
    const days = daysRemaining(trialEndsAt);
    if (days > 10) return null; // Solo mostrar si quedan ≤10 días de trial

    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-sm"
      >
        <Clock size={16} className="shrink-0" />
        <span>
          Tu prueba gratuita termina en <strong>{days} días</strong>. Activa tu suscripción para continuar sin interrupciones.
        </span>
      </motion.div>
    );
  }

  if (typedStatus === "past_due") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-orange-50 border border-orange-200 text-orange-700 text-sm"
      >
        <AlertTriangle size={16} className="shrink-0" />
        <span>
          Tu pago está pendiente. Actualiza tu método de pago para mantener acceso completo.
        </span>
      </motion.div>
    );
  }

  if (typedStatus === "expired" || typedStatus === "canceled") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm"
      >
        <XCircle size={16} className="shrink-0" />
        <span>
          Tu suscripción ha expirado. Reactiva tu plan para acceder a todas las funciones.
        </span>
      </motion.div>
    );
  }

  // Active con pocos días
  if (typedStatus === "active") {
    const days = daysRemaining(periodEnd);
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 text-sm"
      >
        <CheckCircle size={16} className="shrink-0" />
        <span>
          Tu suscripción renueva en <strong>{days} días</strong>.
        </span>
      </motion.div>
    );
  }

  return null;
}