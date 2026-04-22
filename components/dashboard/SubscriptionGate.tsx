"use client";

/**
 * components/dashboard/SubscriptionGate.tsx
 * Bloqueo elegante cuando la suscripción expira — BeautySync Fase 5
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Lock, Sparkles, Clock, AlertTriangle } from "lucide-react";

interface SubscriptionGateProps {
  children: React.ReactNode;
  status: string | null;
  trialDaysRemaining?: number | null;
  primaryColor?: string;
  salonName?: string;
}

// ← CORREGIDO: past_due ya no bloquea — solo muestra banner
const BLOCKED_STATUSES = ["expired", "canceled"];
const WARNING_DAYS = 3;

export function SubscriptionGate({
  children,
  status,
  trialDaysRemaining,
  primaryColor = "#D4375F",
  salonName,
}: SubscriptionGateProps) {
  const router = useRouter();

  // ── Estado: solo trackea si el usuario cerró el banner ──────────
  const [trialBannerDismissed, setTrialBannerDismissed] = useState(false);
  const [pastDueBannerDismissed, setPastDueBannerDismissed] = useState(false);

  const isBlocked = BLOCKED_STATUSES.includes(status ?? "");

  const isTrialWarning =
    status === "trialing" &&
    trialDaysRemaining !== null &&
    trialDaysRemaining !== undefined &&
    trialDaysRemaining <= WARNING_DAYS;

  const isPastDue = status === "past_due";

  // ── Valores derivados — sin useEffect ───────────────────────────
  const showTrialBanner = isTrialWarning && !trialBannerDismissed;
  const showPastDueBanner = isPastDue && !pastDueBannerDismissed;

  return (
    <>
      {/* Banner trial por expirar */}
      <AnimatePresence>
        {showTrialBanner && !isBlocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 py-2.5 flex items-center justify-between gap-4"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-2 text-white">
                <Clock className="w-4 h-4 shrink-0" />
                <p className="text-sm font-medium">
                  Tu trial gratuito termina en{" "}
                  <strong>
                    {trialDaysRemaining} día
                    {trialDaysRemaining !== 1 ? "s" : ""}
                  </strong>
                  . Activa tu plan para no perder el acceso.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => router.push("/dashboard/billing")}
                  className="bg-white text-sm font-semibold px-3 py-1 rounded-lg
                    transition-opacity hover:opacity-90"
                  style={{ color: primaryColor }}
                >
                  Ver planes
                </button>
                <button
                  onClick={() => setTrialBannerDismissed(true)}
                  className="text-white/70 hover:text-white transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner past_due */}
      <AnimatePresence>
        {showPastDueBanner && !isBlocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-2.5 flex items-center justify-between gap-4 bg-amber-500">
              <div className="flex items-center gap-2 text-white">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p className="text-sm font-medium">
                  Hubo un problema con tu último pago. Actualiza tu método de
                  pago para evitar interrupciones.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => router.push("/dashboard/billing")}
                  className="bg-white text-sm font-semibold px-3 py-1 rounded-lg
                    transition-opacity hover:opacity-90 text-amber-600"
                >
                  Actualizar pago
                </button>
                <button
                  onClick={() => setPastDueBannerDismissed(true)}
                  className="text-white/70 hover:text-white transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenido principal */}
      <div className="relative">
        {children}

        {/* Overlay de bloqueo */}
        <AnimatePresence>
          {isBlocked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: "rgba(15, 10, 30, 0.85)" }}
            >
              <div className="absolute inset-0 backdrop-blur-sm" />

              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{
                  delay: 0.1,
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                className="relative bg-white rounded-3xl p-8 max-w-md w-full
                  shadow-2xl text-center"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center
                    mx-auto mb-5"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Lock className="w-8 h-8" style={{ color: primaryColor }} />
                </div>

                <h2
                  className="text-2xl text-[#2D2420] mb-2"
                  style={{ fontFamily: "Cormorant Garamond, serif" }}
                >
                  {status === "canceled"
                    ? "Suscripción cancelada"
                    : "Tu acceso ha expirado"}
                </h2>

                <p className="text-[#9C8E85] text-sm leading-relaxed mb-6">
                  {status === "canceled" ? (
                    <>
                      Tu suscripción de{" "}
                      <strong className="text-[#2D2420]">
                        {salonName ?? "tu salón"}
                      </strong>{" "}
                      fue cancelada. Reactiva un plan para seguir usando
                      BeautySync.
                    </>
                  ) : (
                    <>
                      El período de acceso de{" "}
                      <strong className="text-[#2D2420]">
                        {salonName ?? "tu salón"}
                      </strong>{" "}
                      ha terminado. Activa un plan para que tu salón siga
                      funcionando en piloto automático.
                    </>
                  )}
                </p>

                <div className="bg-[#FAF8F5] rounded-2xl p-4 mb-6 text-left space-y-2">
                  {[
                    "Widget de reservas activo 24/7",
                    "Recordatorios automáticos a tus clientas",
                    "Gestión completa de citas y servicios",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <Sparkles
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: primaryColor }}
                      />
                      <span className="text-xs text-[#2D2420]">{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => router.push("/dashboard/billing")}
                  className="w-full py-3.5 rounded-xl font-semibold text-white
                    text-sm transition-all duration-200 hover:opacity-90
                    active:scale-[0.98]"
                  style={{ backgroundColor: primaryColor }}
                >
                  Activar mi plan
                </button>

                <p className="text-xs text-[#C4B8B0] mt-4">
                  Desde $19/mes USD · Sin contratos · Cancela cuando quieras
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
