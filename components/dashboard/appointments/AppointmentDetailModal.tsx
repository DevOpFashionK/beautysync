"use client";

// components/dashboard/appointments/AppointmentDetailModal.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Calendar, Clock, Phone, Mail, Scissors,
  DollarSign, MessageSquare, CheckCircle, XCircle,
  UserCheck, UserX, Loader2, AlertTriangle,
} from "lucide-react";
import { formatTime, formatDateFull, formatPrice, formatDuration } from "@/lib/utils";
import type { Appointment } from "./AppointmentsClient";
import { STATUS_COLORS } from "./AppointmentsClient";

interface AppointmentDetailModalProps {
  appointment: Appointment | null;
  primaryColor: string;
  onClose: () => void;
  onStatusUpdate: (id: string, status: Appointment["status"], reason?: string) => void;
}

const STATUS_LABELS_ES: Record<string, string> = {
  pending:   "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show:   "No asistió",
};

export default function AppointmentDetailModal({
  appointment,
  primaryColor,
  onClose,
  onStatusUpdate,
}: AppointmentDetailModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (
    newStatus: Appointment["status"],
    reason?: string
  ) => {
    if (!appointment) return;
    setLoading(newStatus);
    setError(null);

    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          cancellation_reason: reason || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Error al actualizar");
      }

      onStatusUpdate(appointment.id, newStatus, reason);
      setShowCancelConfirm(false);
      setCancelReason("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al actualizar la cita");
    } finally {
      setLoading(null);
    }
  };

  const handleClose = () => {
    setShowCancelConfirm(false);
    setCancelReason("");
    setError(null);
    onClose();
  };

  if (!appointment) return null;

  const colors = STATUS_COLORS[appointment.status] || STATUS_COLORS.pending;
  const isModifiable =
    appointment.status !== "cancelled" && appointment.status !== "completed";

  return (
    <AnimatePresence>
      {appointment && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[#2D2420]/20 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-x-4 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2
                       sm:-translate-x-1/2 sm:-translate-y-1/2
                       z-50 w-full sm:w-[480px] max-h-[92vh] sm:max-h-[85vh]
                       bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl
                       overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1
                                rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                    {STATUS_LABELS_ES[appointment.status]}
                  </span>
                </div>
                <h2 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-[#2D2420]">
                  {appointment.client_name}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center
                           text-[#9C8E85] hover:bg-[#FAF8F5] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-6 pb-6 flex flex-col gap-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                >
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              {/* Appointment info */}
              <div className="bg-[#FAF8F5] rounded-2xl p-4 flex flex-col gap-3">
                {appointment.services && (
                  <>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${primaryColor}14` }}
                      >
                        <Scissors size={15} style={{ color: primaryColor }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-[#9C8E85]">Servicio</p>
                        <p className="text-sm font-semibold text-[#2D2420]">
                          {appointment.services.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#9C8E85]">
                          {formatDuration(appointment.services.duration_minutes)}
                        </p>
                        <p className="text-sm font-bold" style={{ color: primaryColor }}>
                          {formatPrice(appointment.services.price)}
                        </p>
                      </div>
                    </div>
                    <div className="h-px bg-[#EDE8E3]" />
                  </>
                )}

                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${primaryColor}14` }}
                  >
                    <Calendar size={15} style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <p className="text-xs text-[#9C8E85]">Fecha</p>
                    <p className="text-sm font-semibold text-[#2D2420] capitalize">
                      {formatDateFull(appointment.scheduled_at)}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-[#EDE8E3]" />

                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${primaryColor}14` }}
                  >
                    <Clock size={15} style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <p className="text-xs text-[#9C8E85]">Horario</p>
                    <p className="text-sm font-semibold text-[#2D2420]">
                      {formatTime(appointment.scheduled_at)} – {formatTime(appointment.ends_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-[#9C8E85] tracking-wide uppercase">
                  Contacto
                </p>
                <a
                  href={`tel:${appointment.client_phone}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#EDE8E3]
                             hover:bg-[#FAF8F5] transition-colors"
                >
                  <Phone size={15} className="text-[#9C8E85]" />
                  <span className="text-sm text-[#2D2420]">{appointment.client_phone}</span>
                </a>
                {appointment.client_email && (
                  <a
                    href={`mailto:${appointment.client_email}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-[#EDE8E3]
                               hover:bg-[#FAF8F5] transition-colors"
                  >
                    <Mail size={15} className="text-[#9C8E85]" />
                    <span className="text-sm text-[#2D2420]">{appointment.client_email}</span>
                  </a>
                )}
              </div>

              {/* Notes */}
              {appointment.client_notes && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-[#9C8E85] tracking-wide uppercase">
                    Notas
                  </p>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF8F5] border border-[#EDE8E3]">
                    <MessageSquare size={15} className="text-[#9C8E85] mt-0.5 shrink-0" />
                    <p className="text-sm text-[#9C8E85] leading-relaxed">
                      {appointment.client_notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Cancellation reason */}
              {appointment.status === "cancelled" && appointment.cancellation_reason && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
                  <AlertTriangle size={15} className="text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-red-500 mb-0.5">
                      Motivo de cancelación
                    </p>
                    <p className="text-sm text-red-600">{appointment.cancellation_reason}</p>
                  </div>
                </div>
              )}

              {/* Cancel confirm */}
              <AnimatePresence>
                {showCancelConfirm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex flex-col gap-3">
                      <p className="text-sm font-medium text-red-700">¿Cancelar esta cita?</p>
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Motivo de cancelación (opcional)"
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl border border-red-200
                                   text-sm text-[#2D2420] bg-white outline-none resize-none
                                   placeholder:text-[#C4B8B0]"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowCancelConfirm(false)}
                          className="flex-1 py-2 rounded-xl border border-[#EDE8E3]
                                     text-sm font-medium text-[#9C8E85] hover:bg-white transition-colors"
                        >
                          Volver
                        </button>
                        <button
                          onClick={() => handleStatusChange("cancelled", cancelReason)}
                          disabled={!!loading}
                          className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm
                                     font-semibold flex items-center justify-center gap-2
                                     hover:bg-red-600 transition-colors disabled:opacity-60"
                        >
                          {loading === "cancelled" ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            "Confirmar cancelación"
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              {isModifiable && !showCancelConfirm && (
                <div className="flex flex-col gap-2 mt-1">
                  <p className="text-xs font-semibold text-[#9C8E85] tracking-wide uppercase">
                    Acciones
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {appointment.status === "pending" && (
                      <button
                        onClick={() => handleStatusChange("confirmed")}
                        disabled={!!loading}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl
                                   text-sm font-semibold text-white transition-all disabled:opacity-60"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {loading === "confirmed" ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <><CheckCircle size={14} /> Confirmar</>
                        )}
                      </button>
                    )}

                    {(appointment.status === "pending" ||
                      appointment.status === "confirmed") && (
                      <button
                        onClick={() => handleStatusChange("completed")}
                        disabled={!!loading}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl
                                   text-sm font-semibold text-white bg-emerald-500
                                   hover:bg-emerald-600 transition-colors disabled:opacity-60"
                      >
                        {loading === "completed" ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <><UserCheck size={14} /> Completada</>
                        )}
                      </button>
                    )}

                    {(appointment.status === "pending" ||
                      appointment.status === "confirmed") && (
                      <button
                        onClick={() => handleStatusChange("no_show")}
                        disabled={!!loading}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl
                                   text-sm font-semibold text-[#9C8E85] border border-[#EDE8E3]
                                   hover:bg-[#FAF8F5] transition-colors disabled:opacity-60"
                      >
                        {loading === "no_show" ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <><UserX size={14} /> No asistió</>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      disabled={!!loading}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl
                                 text-sm font-semibold text-red-500 border border-red-100
                                 hover:bg-red-50 transition-colors disabled:opacity-60"
                    >
                      <XCircle size={14} /> Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}