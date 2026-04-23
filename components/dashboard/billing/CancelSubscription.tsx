"use client";

/**
 * components/dashboard/billing/CancelSubscription.tsx
 * Modal de confirmación para cancelar suscripción — BeautySync Fase 6.9
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XCircle, AlertTriangle, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface CancelSubscriptionProps {
  primaryColor?: string;
  accessUntil: string | null; // current_period_end
}

function formatDateSimple(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-SV", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function CancelSubscription({
  primaryColor = "#D4375F",
  accessUntil,
}: CancelSubscriptionProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canceled, setCanceled] = useState(false);

  async function handleConfirmCancel() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al cancelar. Intenta de nuevo.");
        return;
      }

      setCanceled(true);
      setShowModal(false);

      // Refrescar la página para que el Server Component refleje el nuevo status
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  // Una vez cancelada, mostrar confirmación en lugar del botón
  if (canceled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
      >
        <div className="flex items-start gap-3">
          <XCircle className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-600">
              Suscripción cancelada
            </p>
            <p className="text-xs text-[#9C8E85] mt-1">
              Tu acceso se mantiene activo hasta el{" "}
              <strong className="text-[#2D2420]">
                {formatDateSimple(accessUntil)}
              </strong>
              . Después de esa fecha tu cuenta pasará a modo gratuito.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      {/* Botón para abrir modal */}
      <div className="text-center pt-2">
        <button
          onClick={() => setShowModal(true)}
          className="text-xs text-[#C4B8B0] hover:text-[#9C8E85] underline
            underline-offset-2 transition-colors cursor-pointer"
        >
          Cancelar suscripción
        </button>
      </div>

      {/* Modal de confirmación */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !loading && setShowModal(false)}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
                {/* Cerrar */}
                <button
                  onClick={() => !loading && setShowModal(false)}
                  disabled={loading}
                  className="absolute top-4 right-4 text-[#C4B8B0] hover:text-[#9C8E85]
                    transition-colors disabled:opacity-40"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Ícono */}
                <div
                  className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center
                  justify-center mb-4"
                >
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                </div>

                {/* Texto */}
                <h3 className="font-display text-xl text-[#2D2420] mb-2">
                  ¿Cancelar suscripción?
                </h3>
                <p className="text-sm text-[#9C8E85] mb-4 leading-relaxed">
                  Tu plan seguirá activo hasta el{" "}
                  <strong className="text-[#2D2420]">
                    {formatDateSimple(accessUntil)}
                  </strong>
                  . Después de esa fecha tu widget de reservas se pausará y las
                  clientas no podrán agendar en línea.
                </p>

                {/* Lista de consecuencias */}
                <ul className="space-y-2 mb-6">
                  {[
                    "El widget de reservas dejará de aceptar citas",
                    "Los emails automáticos se pausarán",
                    "Podrás reactivar tu plan en cualquier momento",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold text-xs mt-0.5">
                        —
                      </span>
                      <span className="text-xs text-[#9C8E85]">{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Error */}
                {error && (
                  <p
                    className="text-xs text-red-500 bg-red-50 rounded-xl
                    py-2 px-3 mb-4"
                  >
                    {error}
                  </p>
                )}

                {/* Botones */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium
                      border transition-colors disabled:opacity-40"
                      style={{
                        borderColor : primaryColor,
                        color : primaryColor,
                      }}
                  >
                    Mantener plan
                  </button>
                  <button
                    onClick={handleConfirmCancel}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold
                      bg-red-500 text-white hover:bg-red-600 transition-colors
                      disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span
                          className="w-4 h-4 border-2 border-white
                          border-t-transparent rounded-full animate-spin"
                        />
                        Cancelando…
                      </span>
                    ) : (
                      "Sí, cancelar"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
