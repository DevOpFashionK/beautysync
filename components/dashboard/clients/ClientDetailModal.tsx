"use client";

// components/dashboard/clients/ClientDetailModal.tsx
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Mail, Scissors, Calendar, DollarSign, Clock, Star } from "lucide-react";
import { formatTime, formatDateMini, formatMonthYear, formatPrice, formatRelativeDate } from "@/lib/utils";
import type { ClientProfile } from "./ClientsClient";

interface ClientDetailModalProps {
  client: ClientProfile | null;
  primaryColor: string;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  pending:   "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show:   "No asistió",
};

const STATUS_COLORS: Record<string, string> = {
  pending:   "text-amber-600 bg-amber-50",
  confirmed: "text-emerald-600 bg-emerald-50",
  completed: "text-blue-600 bg-blue-50",
  cancelled: "text-red-500 bg-red-50",
  no_show:   "text-gray-500 bg-gray-50",
};

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ClientDetailModal({
  client,
  primaryColor,
  onClose,
}: ClientDetailModalProps) {
  if (!client) return null;

  const sortedAppointments = [...client.appointments].sort(
    (a, b) => b.scheduled_at.localeCompare(a.scheduled_at)
  );

  return (
    <AnimatePresence>
      {client && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[#2D2420]/20 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-x-4 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2
                       sm:-translate-x-1/2 sm:-translate-y-1/2
                       z-50 w-full sm:w-[500px] max-h-[92vh] sm:max-h-[85vh]
                       bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl
                       overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div
              className="px-6 pt-6 pb-5 shrink-0"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}08 0%, transparent 100%)`,
                borderBottom: "1px solid #EDE8E3",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center
                               text-white text-lg font-bold shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {getInitials(client.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-[#2D2420]">
                        {client.name}
                      </h2>
                      {client.isFrequent && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full
                                         text-[10px] font-semibold bg-amber-50 text-amber-600">
                          <Star size={9} className="fill-amber-400 text-amber-400" />
                          Frecuente
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#9C8E85] mt-0.5">
                      Clienta desde {formatMonthYear(client.firstVisit)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl flex items-center justify-center
                             text-[#9C8E85] hover:bg-white/80 transition-colors shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    icon: <Calendar size={13} />,
                    label: "Citas",
                    value: client.totalAppointments.toString(),
                  },
                  {
                    icon: <DollarSign size={13} />,
                    label: "Gastado",
                    value: formatPrice(client.totalSpent),
                  },
                  {
                    icon: <Clock size={13} />,
                    label: "Última visita",
                    value: formatRelativeDate(client.lastVisit),
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl p-3 text-center"
                    style={{ backgroundColor: `${primaryColor}08` }}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center mx-auto mb-1.5"
                      style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                    >
                      {m.icon}
                    </div>
                    <p
                      className="font-['Cormorant_Garamond'] text-lg font-bold leading-none"
                      style={{ color: primaryColor }}
                    >
                      {m.value}
                    </p>
                    <p className="text-[10px] text-[#9C8E85] mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Favorite service */}
              {client.favoriteService && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl border border-[#EDE8E3] bg-[#FAF8F5]">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${primaryColor}14` }}
                  >
                    <Scissors size={15} style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <p className="text-xs text-[#9C8E85]">Servicio favorito</p>
                    <p className="text-sm font-semibold text-[#2D2420]">
                      {client.favoriteService}
                    </p>
                  </div>
                </div>
              )}

              {/* Contact */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-[#9C8E85] tracking-wide uppercase">
                  Contacto
                </p>
                <a
                  href={`tel:${client.phone}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#EDE8E3]
                             hover:bg-[#FAF8F5] transition-colors"
                >
                  <Phone size={15} className="text-[#9C8E85]" />
                  <span className="text-sm text-[#2D2420]">{client.phone}</span>
                </a>
                {client.email && (
                  <a
                    href={`mailto:${client.email}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-[#EDE8E3]
                               hover:bg-[#FAF8F5] transition-colors"
                  >
                    <Mail size={15} className="text-[#9C8E85]" />
                    <span className="text-sm text-[#2D2420]">{client.email}</span>
                  </a>
                )}
              </div>

              {/* Appointment history */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-[#9C8E85] tracking-wide uppercase">
                  Historial de citas
                </p>
                <div className="flex flex-col gap-2">
                  {sortedAppointments.map((appt, i) => (
                    <motion.div
                      key={appt.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-[#EDE8E3] bg-white"
                    >
                      {/* Date/time block */}
                      <div
                        className="shrink-0 text-center px-2 py-1.5 rounded-lg min-w-[56px]"
                        style={{ backgroundColor: `${primaryColor}10` }}
                      >
                        <p
                          className="text-xs font-bold leading-none"
                          style={{ color: primaryColor }}
                        >
                          {formatTime(appt.scheduled_at)}
                        </p>
                        <p className="text-[9px] text-[#9C8E85] mt-0.5">
                          {formatDateMini(appt.scheduled_at)}
                        </p>
                      </div>

                      {/* Service */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#2D2420] truncate">
                          {appt.services?.name ?? "Servicio eliminado"}
                        </p>
                        {appt.services && (
                          <p className="text-[11px] text-[#9C8E85]">
                            {formatPrice(appt.services.price)}
                          </p>
                        )}
                      </div>

                      {/* Status */}
                      <span
                        className={`shrink-0 text-[10px] font-semibold px-2 py-0.5
                                    rounded-full ${STATUS_COLORS[appt.status] ?? ""}`}
                      >
                        {STATUS_LABELS[appt.status] ?? appt.status}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}