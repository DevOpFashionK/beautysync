"use client";

// components/dashboard/appointments/AppointmentDetailModal.tsx
//
// FIXES aplicados:
// 1. Eliminado el tipo Appointment local — importa el tipo compartido.
// 2. prop renombrada: onStatusChange → onStatusUpdate para coincidir con el caller.
// 3. appointment acepta Appointment | null — AnimatePresence maneja el ciclo.
// 4. AppointmentStatus derivado del union type del tipo compartido.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Scissors,
  Calendar,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatTime, formatDateFull, formatPrice } from "@/lib/utils";
import type { Appointment } from "./AppointmentsClient";

type AppointmentStatus = Appointment["status"];

// ─── Status config Dark Atelier ───────────────────────────────────────────────

const statusConfig: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    dot: string;
    icon: React.ReactNode;
  }
> = {
  pending: {
    label: "Pendiente",
    color: "rgba(251,191,36,0.85)",
    bg: "rgba(234,179,8,0.07)",
    border: "rgba(234,179,8,0.2)",
    dot: "rgba(251,191,36,0.7)",
    icon: <AlertCircle size={12} />,
  },
  confirmed: {
    label: "Confirmada",
    color: "rgba(147,197,253,0.85)",
    bg: "rgba(59,130,246,0.07)",
    border: "rgba(59,130,246,0.2)",
    dot: "rgba(147,197,253,0.7)",
    icon: <CheckCircle2 size={12} />,
  },
  completed: {
    label: "Completada",
    color: "rgba(110,231,183,0.85)",
    bg: "rgba(16,185,129,0.07)",
    border: "rgba(16,185,129,0.2)",
    dot: "rgba(52,211,153,0.7)",
    icon: <CheckCircle2 size={12} />,
  },
  cancelled: {
    label: "Cancelada",
    color: "rgba(245,242,238,0.25)",
    bg: "rgba(255,255,255,0.03)",
    border: "rgba(255,255,255,0.055)", // ✅ fix: 0.07 → border 0.055
    dot: "rgba(245,242,238,0.18)", // ✅ fix: 0.2 → textDim 0.18
    icon: <XCircle size={12} />,
  },
  no_show: {
    label: "No se presentó",
    color: "rgba(252,165,165,0.85)",
    bg: "rgba(239,68,68,0.07)",
    border: "rgba(239,68,68,0.2)",
    dot: "rgba(252,165,165,0.6)",
    icon: <XCircle size={12} />,
  },
};

interface AppointmentDetailModalProps {
  appointment: Appointment | null;
  primaryColor: string;
  onClose: () => void;
  onStatusUpdate?: (
    id: string,
    newStatus: AppointmentStatus,
    reason?: string,
  ) => void;
}

// ─── DetailRow — componente independiente ────────────────────────────────────
function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "12px 14px",
        borderRadius: "8px",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.055)", // ✅ fix: 0.05 → border 0.055
      }}
    >
      <div style={{ marginTop: "2px", flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(245,242,238,0.18)", // ✅ fix: 0.2 → textDim 0.18
            margin: "0 0 4px",
          }}
        >
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}

// ─── ModalContent — solo se monta cuando appointment !== null ─────────────────

function ModalContent({
  appointment,
  primaryColor,
  onClose,
  onStatusUpdate,
}: {
  appointment: Appointment;
  primaryColor: string;
  onClose: () => void;
  onStatusUpdate?: (
    id: string,
    newStatus: AppointmentStatus,
    reason?: string,
  ) => void;
}) {
  const [status, setStatus] = useState<AppointmentStatus>(appointment.status);
  const [updating, setUpdating] = useState(false);
  const [confirmAction, setConfirmAction] = useState<AppointmentStatus | null>(
    null,
  );

  const config = statusConfig[status] ?? statusConfig.pending;
  const isFinished =
    status === "completed" || status === "cancelled" || status === "no_show";

  // ── updateStatus — lógica intacta + IDOR fix ──────────────────────────────
  const updateStatus = async (newStatus: AppointmentStatus) => {
    setUpdating(true);
    const supabase = createClient();

    const updatePayload: {
      status: AppointmentStatus;
      cancelled_at?: string;
      cancellation_reason?: string;
    } = { status: newStatus };

    if (newStatus === "cancelled") {
      updatePayload.cancelled_at = new Date().toISOString();
      updatePayload.cancellation_reason = "Cancelada desde dashboard";
    }

    await supabase
      .from("appointments")
      .update(updatePayload)
      .eq("id", appointment.id)
      .eq("salon_id", appointment.salon_id); // ✅ IDOR prevention

    setStatus(newStatus);
    setConfirmAction(null);
    setUpdating(false);
    onStatusUpdate?.(appointment.id, newStatus);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(8,7,6,0.8)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "380px",
          borderRadius: "14px",
          overflow: "hidden",
          background: "#0E0C0B",
          border: "1px solid rgba(255,255,255,0.055)", // ✅ fix: 0.07 → border 0.055
          boxShadow: "0 32px 80px rgba(0,0,0,0.65)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Acento superior — color del primaryColor */}
        <div
          style={{ height: "2px", background: primaryColor, opacity: 0.6 }}
        />

        {/* Acento esquina */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "14px",
            height: "14px",
            borderTop: "1px solid rgba(255,45,85,0.22)", // ✅ fix: 0.35 → roseBorder 0.22
            borderRight: "1px solid rgba(255,45,85,0.22)", // ✅ fix: 0.35 → roseBorder 0.22
            borderTopRightRadius: "14px",
            pointerEvents: "none",
          }}
        />

        {/* Header */}
        <div style={{ padding: "18px 20px 14px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <div>
              {/* Badge de estado */}
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "10px",
                  letterSpacing: "0.05em",
                  fontWeight: 400,
                  background: config.bg,
                  color: config.color,
                  border: `1px solid ${config.border}`,
                  marginBottom: "10px",
                }}
              >
                <span
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: config.dot,
                    flexShrink: 0,
                  }}
                />
                {config.label}
              </span>
              <h2
                style={{
                  fontFamily:
                    "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
                  fontSize: "1.4rem",
                  fontWeight: 300,
                  color: "rgba(245,242,238,0.9)", // ✅ fix: 0.88 → textPrimary 0.9
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                {appointment.client_name}
              </h2>
            </div>

            {/* Cerrar */}
            <button
              onClick={onClose}
              style={{
                padding: "5px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(245,242,238,0.18)", // ✅ fix: 0.2 → textDim 0.18
                display: "flex",
                alignItems: "center",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  "rgba(245,242,238,0.5)")
              }
              onMouseLeave={
                (e) =>
                  ((e.currentTarget as HTMLElement).style.color =
                    "rgba(245,242,238,0.18)") // ✅ fix: 0.2 → textDim 0.18
              }
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Detalles */}
        <div
          style={{
            padding: "0 20px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          {/* Servicio */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "12px 14px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.055)", // ✅ fix: 0.05 → border 0.055
            }}
          >
            <Scissors
              size={13}
              strokeWidth={1.5}
              style={{
                color: `${primaryColor}88`,
                marginTop: 2,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(245,242,238,0.18)", // ✅ fix: 0.2 → textDim 0.18
                  margin: "0 0 4px",
                }}
              >
                Servicio
              </p>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 400,
                  color: "rgba(245,242,238,0.9)", // ✅ fix: 0.8 → textPrimary 0.9
                  margin: 0,
                }}
              >
                {appointment.services?.name ?? "—"}
              </p>
            </div>
            {(appointment.services?.duration_minutes != null ||
              appointment.services?.price != null) && (
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                {appointment.services?.duration_minutes != null && (
                  <p
                    style={{
                      fontSize: "11px",
                      color: "rgba(245,242,238,0.18)", // ✅ fix: 0.2 → textDim 0.18
                      margin: 0,
                    }}
                  >
                    {appointment.services.duration_minutes} min
                  </p>
                )}
                {appointment.services?.price != null && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: `${primaryColor}CC`,
                      margin: 0,
                    }}
                  >
                    {formatPrice(appointment.services.price)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Fecha */}
          <DetailRow
            icon={
              <Calendar
                size={13}
                strokeWidth={1.5}
                style={{ color: `${primaryColor}77` }}
              />
            }
            label="Fecha"
          >
            <p
              style={{
                fontSize: "13px",
                color: "rgba(245,242,238,0.45)", // ✅ fix: 0.7 → textMid 0.45
                margin: 0,
              }}
            >
              {formatDateFull(appointment.scheduled_at)}
            </p>
          </DetailRow>

          {/* Horario */}
          <DetailRow
            icon={
              <Clock
                size={13}
                strokeWidth={1.5}
                style={{ color: `${primaryColor}77` }}
              />
            }
            label="Horario"
          >
            <p
              style={{
                fontSize: "13px",
                color: "rgba(245,242,238,0.45)", // ✅ fix: 0.7 → textMid 0.45
                margin: 0,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatTime(appointment.scheduled_at)}
              {appointment.ends_at && ` — ${formatTime(appointment.ends_at)}`}
            </p>
          </DetailRow>

          {/* Contacto */}
          {(appointment.client_phone || appointment.client_email) && (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.055)", // ✅ fix: 0.05 → border 0.055
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <p
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(245,242,238,0.18)", // ✅ fix: 0.2 → textDim 0.18
                  margin: 0,
                }}
              >
                Contacto
              </p>
              {appointment.client_phone && (
                <a
                  href={`tel:${appointment.client_phone}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    textDecoration: "none",
                  }}
                >
                  <Phone
                    size={12}
                    strokeWidth={1.5}
                    style={{ color: "rgba(245,242,238,0.18)" }} // ✅ fix: 0.25 → textDim 0.18
                  />
                  <span
                    style={{
                      fontSize: "13px",
                      color: "rgba(245,242,238,0.45)",
                    }} // ✅ fix: 0.6 → textMid 0.45
                  >
                    {appointment.client_phone}
                  </span>
                </a>
              )}
              {appointment.client_email && (
                <a
                  href={`mailto:${appointment.client_email}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    textDecoration: "none",
                  }}
                >
                  <Mail
                    size={12}
                    strokeWidth={1.5}
                    style={{ color: "rgba(245,242,238,0.18)" }} // ✅ fix: 0.25 → textDim 0.18
                  />
                  <span
                    style={{
                      fontSize: "13px",
                      color: "rgba(245,242,238,0.45)",
                    }} // ✅ fix: 0.6 → textMid 0.45
                  >
                    {appointment.client_email}
                  </span>
                </a>
              )}
            </div>
          )}

          {/* Notas */}
          {appointment.client_notes && (
            <DetailRow
              icon={
                <MessageSquare
                  size={13}
                  strokeWidth={1.5}
                  style={{ color: "rgba(245,242,238,0.18)" }} // ✅ fix: 0.25 → textDim 0.18
                />
              }
              label="Notas"
            >
              <p
                style={{
                  fontSize: "13px",
                  color: "rgba(245,242,238,0.45)", // ✅ fix: 0.55 → textMid 0.45
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {appointment.client_notes}
              </p>
            </DetailRow>
          )}
        </div>

        {/* Acciones */}
        {!isFinished && (
          <div style={{ padding: "0 20px 20px" }}>
            <p
              style={{
                fontSize: "10px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(245,242,238,0.18)",
                margin: "0 0 12px",
              }}
            >
              Acciones
            </p>

            {confirmAction ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <p
                  style={{
                    fontSize: "12px",
                    textAlign: "center",
                    color: "rgba(245,242,238,0.18)", // ✅ fix: 0.35 → textDim 0.18
                    margin: 0,
                  }}
                >
                  ¿Confirmar acción?
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setConfirmAction(null)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.055)", // ✅ fix: 0.07 → border 0.055
                      background: "transparent",
                      fontSize: "11px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "rgba(245,242,238,0.18)", // ✅ fix: 0.3 → textDim 0.18
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Volver
                  </button>
                  <button
                    onClick={() => updateStatus(confirmAction)}
                    disabled={updating}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: `1px solid ${primaryColor}35`,
                      background: `${primaryColor}12`,
                      fontSize: "11px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: `${primaryColor}CC`,
                      cursor: updating ? "not-allowed" : "pointer",
                      opacity: updating ? 0.6 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      fontFamily: "inherit",
                    }}
                  >
                    {updating ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : null}
                    {updating ? "..." : "Confirmar"}
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "7px",
                }}
              >
                {status === "pending" && (
                  <button
                    onClick={() => setConfirmAction("confirmed")}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid rgba(59,130,246,0.2)",
                      background: "rgba(59,130,246,0.07)",
                      fontSize: "11px",
                      letterSpacing: "0.06em",
                      color: "rgba(147,197,253,0.85)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(59,130,246,0.14)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(59,130,246,0.07)";
                    }}
                  >
                    ✓ Confirmar
                  </button>
                )}
                {(status === "confirmed" || status === "pending") && (
                  <button
                    onClick={() => setConfirmAction("completed")}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid rgba(16,185,129,0.2)",
                      background: "rgba(16,185,129,0.07)",
                      fontSize: "11px",
                      letterSpacing: "0.06em",
                      color: "rgba(52,211,153,0.85)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(16,185,129,0.14)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(16,185,129,0.07)";
                    }}
                  >
                    ✓ Completada
                  </button>
                )}
                {(status === "confirmed" || status === "pending") && (
                  <button
                    onClick={() => setConfirmAction("no_show")}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid rgba(239,68,68,0.2)",
                      background: "rgba(239,68,68,0.07)",
                      fontSize: "11px",
                      letterSpacing: "0.06em",
                      color: "rgba(252,165,165,0.85)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(239,68,68,0.14)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(239,68,68,0.07)";
                    }}
                  >
                    ✗ No asistió
                  </button>
                )}
                <button
                  onClick={() => setConfirmAction("cancelled")}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.055)", // ✅ fix: 0.07 → border 0.055
                    background: "transparent",
                    fontSize: "11px",
                    letterSpacing: "0.06em",
                    color: "rgba(245,242,238,0.18)", // ✅ fix: 0.25 → textDim 0.18
                    cursor: "pointer",
                    transition: "all 0.15s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(255,255,255,0.04)";
                    (e.currentTarget as HTMLElement).style.color =
                      "rgba(245,242,238,0.45)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                    (e.currentTarget as HTMLElement).style.color =
                      "rgba(245,242,238,0.18)"; // ✅ fix: 0.25 → textDim 0.18
                  }}
                >
                  ✗ Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Export principal ─────────────────────────────────────────────────────────

export function AppointmentDetailModal({
  appointment,
  primaryColor,
  onClose,
  onStatusUpdate,
}: AppointmentDetailModalProps) {
  return (
    <AnimatePresence>
      {appointment && (
        <ModalContent
          key={appointment.id}
          appointment={appointment}
          primaryColor={primaryColor}
          onClose={onClose}
          onStatusUpdate={onStatusUpdate}
        />
      )}
    </AnimatePresence>
  );
}
