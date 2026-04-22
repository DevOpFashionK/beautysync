"use client";

// components/dashboard/appointments/AppointmentDetailModal.tsx
//
// FIXES aplicados:
// 1. Eliminado el tipo Appointment local que difería del exportado en AppointmentsClient.
//    Ahora importa el tipo compartido desde AppointmentsClient para tener una sola fuente de verdad.
// 2. prop renombrada: onStatusChange → onStatusUpdate para coincidir con el caller.
// 3. prop appointment ahora acepta Appointment | null y el modal se monta/desmonta
//    con AnimatePresence según si hay selección — eliminando el error TS2322.
// 4. AppointmentStatus ya no viene del enum de Supabase sino del union type del
//    tipo compartido, eliminando la dependencia cruzada de tipos.

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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatTime, formatDateFull, formatPrice } from "@/lib/utils";
import type { Appointment } from "./AppointmentsClient";

// Derivado del union type del tipo compartido — no depende del enum de Supabase
type AppointmentStatus = Appointment["status"];

// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    dot: string;
    icon: React.ReactNode;
  }
> = {
  pending: {
    label: "Pendiente",
    color: "#B45309",
    bg: "rgba(217,119,6,0.07)",
    dot: "#F59E0B",
    icon: <AlertCircle size={12} />,
  },
  confirmed: {
    label: "Confirmada",
    color: "#1D4ED8",
    bg: "rgba(59,130,246,0.07)",
    dot: "#3B82F6",
    icon: <CheckCircle2 size={12} />,
  },
  completed: {
    label: "Completada",
    color: "#065F46",
    bg: "rgba(16,185,129,0.07)",
    dot: "#10B981",
    icon: <CheckCircle2 size={12} />,
  },
  cancelled: {
    label: "Cancelada",
    color: "#9CA3AF",
    bg: "rgba(156,163,175,0.07)",
    dot: "#D1D5DB",
    icon: <XCircle size={12} />,
  },
  no_show: {
    label: "No se presentó",
    color: "#DC2626",
    bg: "rgba(239,68,68,0.07)",
    dot: "#EF4444",
    icon: <XCircle size={12} />,
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface AppointmentDetailModalProps {
  // null = modal cerrado. AnimatePresence maneja la animación de entrada/salida.
  appointment: Appointment | null;
  primaryColor: string;
  onClose: () => void;
  // Nombre alineado con AppointmentsClient.handleStatusUpdate
  onStatusUpdate?: (
    id: string,
    newStatus: AppointmentStatus,
    reason?: string,
  ) => void;
}

// ─── Inner modal (solo se monta cuando appointment !== null) ──────────────────

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
      .eq("id", appointment.id);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(45,36,32,0.4)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "#FFFFFF",
          boxShadow: "0 24px 64px rgba(45,36,32,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent */}
        <div className="h-1 w-full" style={{ background: primaryColor }} />

        {/* Header */}
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-2"
                style={{ background: config.bg, color: config.color }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: config.dot }}
                />
                {config.label}
              </span>
              <h2
                className="text-xl font-semibold"
                style={{
                  color: "#2D2420",
                  fontFamily: "'Cormorant Garamond', serif",
                }}
              >
                {appointment.client_name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "#C4B8B0" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#FAF8F5";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="px-6 pb-4 space-y-3">
          {/* Servicio */}
          <div
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{ background: "#FAF8F5" }}
          >
            <Scissors size={15} style={{ color: primaryColor, marginTop: 1 }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium" style={{ color: "#9C8E85" }}>
                Servicio
              </p>
              <p className="text-sm font-semibold" style={{ color: "#2D2420" }}>
                {appointment.services?.name ?? "—"}
              </p>
            </div>
            <div className="text-right shrink-0">
              {appointment.services?.duration_minutes != null && (
                <p className="text-xs" style={{ color: "#9C8E85" }}>
                  {appointment.services.duration_minutes} min
                </p>
              )}
              {appointment.services?.price != null && (
                <p
                  className="text-sm font-semibold"
                  style={{ color: primaryColor }}
                >
                  {formatPrice(appointment.services.price)}
                </p>
              )}
            </div>
          </div>

          {/* Fecha */}
          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "#FAF8F5" }}
          >
            <Calendar size={15} style={{ color: primaryColor }} />
            <div>
              <p className="text-xs font-medium" style={{ color: "#9C8E85" }}>
                Fecha
              </p>
              <p className="text-sm font-semibold" style={{ color: "#2D2420" }}>
                {formatDateFull(appointment.scheduled_at)}
              </p>
            </div>
          </div>

          {/* Horario */}
          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "#FAF8F5" }}
          >
            <Clock size={15} style={{ color: primaryColor }} />
            <div>
              <p className="text-xs font-medium" style={{ color: "#9C8E85" }}>
                Horario
              </p>
              <p className="text-sm font-semibold" style={{ color: "#2D2420" }}>
                {formatTime(appointment.scheduled_at)}
                {appointment.ends_at && ` – ${formatTime(appointment.ends_at)}`}
              </p>
            </div>
          </div>

          {/* Contacto */}
          {(appointment.client_phone || appointment.client_email) && (
            <div
              className="p-3 rounded-xl space-y-2"
              style={{ background: "#FAF8F5", border: "1px solid #EDE8E3" }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#C4B8B0" }}
              >
                Contacto
              </p>
              {appointment.client_phone && (
                <a
                  href={`tel:${appointment.client_phone}`}
                  className="flex items-center gap-2.5"
                >
                  <Phone size={13} style={{ color: "#9C8E85" }} />
                  <span className="text-sm" style={{ color: "#2D2420" }}>
                    {appointment.client_phone}
                  </span>
                </a>
              )}
              {appointment.client_email && (
                <a
                  href={`mailto:${appointment.client_email}`}
                  className="flex items-center gap-2.5"
                >
                  <Mail size={13} style={{ color: "#9C8E85" }} />
                  <span className="text-sm" style={{ color: "#2D2420" }}>
                    {appointment.client_email}
                  </span>
                </a>
              )}
            </div>
          )}

          {/* Notas */}
          {appointment.client_notes && (
            <div
              className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: "#FAF8F5" }}
            >
              <MessageSquare
                size={15}
                style={{ color: "#9C8E85", marginTop: 1 }}
              />
              <div>
                <p className="text-xs font-medium" style={{ color: "#9C8E85" }}>
                  Notas
                </p>
                <p className="text-sm" style={{ color: "#2D2420" }}>
                  {appointment.client_notes}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        {!isFinished && (
          <div className="px-6 pb-6 space-y-2">
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "#C4B8B0" }}
            >
              Acciones
            </p>

            {confirmAction ? (
              <div className="space-y-2">
                <p className="text-sm text-center" style={{ color: "#9C8E85" }}>
                  ¿Confirmar acción?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                    style={{
                      background: "#FAF8F5",
                      color: "#9C8E85",
                      border: "1px solid #EDE8E3",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => updateStatus(confirmAction)}
                    disabled={updating}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
                    style={{ background: primaryColor, color: "#fff" }}
                  >
                    {updating ? "..." : "Confirmar"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {status === "pending" && (
                  <button
                    onClick={() => setConfirmAction("confirmed")}
                    className="py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: "rgba(59,130,246,0.07)",
                      color: "#1D4ED8",
                      border: "1px solid rgba(59,130,246,0.15)",
                    }}
                  >
                    ✓ Confirmar
                  </button>
                )}
                {(status === "confirmed" || status === "pending") && (
                  <button
                    onClick={() => setConfirmAction("completed")}
                    className="py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: "rgba(16,185,129,0.07)",
                      color: "#065F46",
                      border: "1px solid rgba(16,185,129,0.15)",
                    }}
                  >
                    ✓ Completada
                  </button>
                )}
                {(status === "confirmed" || status === "pending") && (
                  <button
                    onClick={() => setConfirmAction("no_show")}
                    className="py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: "rgba(239,68,68,0.07)",
                      color: "#DC2626",
                      border: "1px solid rgba(239,68,68,0.15)",
                    }}
                  >
                    ✗ No asistió
                  </button>
                )}
                <button
                  onClick={() => setConfirmAction("cancelled")}
                  className="py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: "rgba(156,163,175,0.07)",
                    color: "#9CA3AF",
                    border: "1px solid rgba(156,163,175,0.15)",
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
// Recibe appointment | null y deja que AnimatePresence maneje el ciclo de vida.
// Así el modal tiene animación de salida correcta y no hay error de tipo.

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
