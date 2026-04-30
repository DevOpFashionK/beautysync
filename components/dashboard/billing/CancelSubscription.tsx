"use client";

/**
 * components/dashboard/billing/CancelSubscription.tsx
 * Modal de confirmación para cancelar suscripción — BeautySync Fase 6.9
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XCircle, AlertTriangle, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CancelSubscriptionProps {
  primaryColor?: string;
  accessUntil: string | null;
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
  primaryColor = "#FF2D55",
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
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al cancelar. Intenta de nuevo.");
        return;
      }
      setCanceled(true);
      setShowModal(false);
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  // ── Estado post-cancelación ────────────────────────────────────────────────
  if (canceled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          borderRadius: "10px",
          border: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.03)",
          padding: "18px 20px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <XCircle
          size={16}
          strokeWidth={1.5}
          style={{
            color: "rgba(245,242,238,0.22)",
            flexShrink: 0,
            marginTop: 2,
          }}
        />
        <div>
          <p
            style={{
              fontSize: "13px",
              fontWeight: 400,
              color: "rgba(245,242,238,0.45)",
              margin: "0 0 4px",
            }}
          >
            Suscripción cancelada
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "rgba(245,242,238,0.22)",
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            Tu acceso se mantiene activo hasta el{" "}
            <strong
              style={{ color: "rgba(245,242,238,0.55)", fontWeight: 400 }}
            >
              {formatDateSimple(accessUntil)}
            </strong>
            . Después de esa fecha tu cuenta pasará a modo gratuito.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      {/* Trigger */}
      <div style={{ textAlign: "center", paddingTop: "4px" }}>
        <button
          onClick={() => setShowModal(true)}
          style={{
            fontSize: "11px",
            color: "rgba(245,242,238,0.18)",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
            transition: "color 0.2s",
            fontFamily: "inherit",
            letterSpacing: "0.03em",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color =
              "rgba(245,242,238,0.35)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color =
              "rgba(245,242,238,0.18)")
          }
        >
          Cancelar suscripción
        </button>
      </div>

      {/* Modal */}
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
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(8,7,6,0.8)",
                backdropFilter: "blur(6px)",
                zIndex: 50,
              }}
            />

            {/* Modal */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 51,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
              }}
            >
              <div
                style={{
                  background: "#0E0C0B",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "14px",
                  width: "100%",
                  maxWidth: "420px",
                  padding: "28px 24px",
                  position: "relative",
                  boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
                }}
              >
                {/* Acento esquina */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "14px",
                    height: "14px",
                    borderTop: "1px solid rgba(234,179,8,0.3)",
                    borderRight: "1px solid rgba(234,179,8,0.3)",
                    borderTopRightRadius: "14px",
                    pointerEvents: "none",
                  }}
                />

                {/* Cerrar */}
                <button
                  onClick={() => !loading && setShowModal(false)}
                  disabled={loading}
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(245,242,238,0.2)",
                    display: "flex",
                    alignItems: "center",
                    opacity: loading ? 0.4 : 1,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color =
                      "rgba(245,242,238,0.5)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color =
                      "rgba(245,242,238,0.2)")
                  }
                >
                  <X size={15} strokeWidth={1.5} />
                </button>

                {/* Ícono */}
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "rgba(234,179,8,0.08)",
                    border: "1px solid rgba(234,179,8,0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "18px",
                  }}
                >
                  <AlertTriangle
                    size={18}
                    strokeWidth={1.75}
                    style={{ color: "rgba(251,191,36,0.75)" }}
                  />
                </div>

                {/* Título */}
                <h3
                  style={{
                    fontFamily:
                      "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
                    fontSize: "1.5rem",
                    fontWeight: 300,
                    color: "rgba(245,242,238,0.88)",
                    letterSpacing: "-0.02em",
                    margin: "0 0 10px",
                  }}
                >
                  ¿Cancelar suscripción?
                </h3>

                {/* Descripción */}
                <p
                  style={{
                    fontSize: "13px",
                    color: "rgba(245,242,238,0.35)",
                    lineHeight: 1.7,
                    margin: "0 0 16px",
                  }}
                >
                  Tu plan seguirá activo hasta el{" "}
                  <strong
                    style={{ color: "rgba(245,242,238,0.65)", fontWeight: 400 }}
                  >
                    {formatDateSimple(accessUntil)}
                  </strong>
                  . Después de esa fecha tu widget de reservas se pausará y las
                  clientas no podrán agendar en línea.
                </p>

                {/* Consecuencias */}
                <ul
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "7px",
                    margin: "0 0 20px",
                    padding: 0,
                    listStyle: "none",
                  }}
                >
                  {[
                    "El widget de reservas dejará de aceptar citas",
                    "Los emails automáticos se pausarán",
                    "Podrás reactivar tu plan en cualquier momento",
                  ].map((item, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          color: "rgba(251,191,36,0.5)",
                          fontSize: "12px",
                          marginTop: "1px",
                          flexShrink: 0,
                        }}
                      >
                        —
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "rgba(245,242,238,0.28)",
                          lineHeight: 1.5,
                        }}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Error */}
                {error && (
                  <div
                    style={{
                      background: "rgba(239,68,68,0.07)",
                      border: "1px solid rgba(239,68,68,0.18)",
                      borderRadius: "7px",
                      padding: "10px 12px",
                      fontSize: "12px",
                      color: "rgba(252,165,165,0.85)",
                      marginBottom: "14px",
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Botones */}
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: "11px",
                      borderRadius: "8px",
                      border: `1px solid ${primaryColor}30`,
                      background: `${primaryColor}08`,
                      color: `${primaryColor}99`,
                      fontSize: "12px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.5 : 1,
                      transition: "all 0.2s",
                      fontFamily: "inherit",
                    }}
                  >
                    Mantener plan
                  </button>
                  <button
                    onClick={handleConfirmCancel}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: "11px",
                      borderRadius: "8px",
                      border: "1px solid rgba(239,68,68,0.25)",
                      background: "rgba(239,68,68,0.1)",
                      color: "rgba(252,165,165,0.85)",
                      fontSize: "12px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.7 : 1,
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        (e.currentTarget as HTMLElement).style.background =
                          "rgba(239,68,68,0.18)";
                        (e.currentTarget as HTMLElement).style.borderColor =
                          "rgba(239,68,68,0.35)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(239,68,68,0.1)";
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "rgba(239,68,68,0.25)";
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2
                          size={13}
                          strokeWidth={1.75}
                          className="animate-spin"
                        />{" "}
                        Cancelando…
                      </>
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
