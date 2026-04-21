"use client";

// components/dashboard/appointments/AppointmentRow.tsx
import { motion } from "framer-motion";
import { Phone, Scissors, ChevronRight } from "lucide-react";
import { formatTime, formatDuration } from "@/lib/utils";
import type { Appointment } from "./AppointmentsClient";
import { STATUS_COLORS } from "./AppointmentsClient";

interface AppointmentRowProps {
  appointment: Appointment;
  primaryColor: string;
  index: number;
  onClick: () => void;
}

const STATUS_LABELS_ES: Record<string, string> = {
  pending:   "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show:   "No asistió",
};

export default function AppointmentRow({
  appointment,
  primaryColor,
  index,
  onClick,
}: AppointmentRowProps) {
  const colors = STATUS_COLORS[appointment.status] || STATUS_COLORS.pending;
  const isInactive =
    appointment.status === "cancelled" || appointment.status === "no_show";

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={onClick}
      className={`
        group w-full text-left bg-white rounded-2xl border border-[#EDE8E3]
        p-4 transition-all duration-200
        hover:shadow-md hover:border-transparent hover:-translate-y-0.5
        ${isInactive ? "opacity-60" : ""}
      `}
    >
      <div className="flex items-center gap-3">
        {/* Time block */}
        <div
          className="shrink-0 w-14 text-center py-2 rounded-xl"
          style={{ backgroundColor: isInactive ? "#FAF8F5" : `${primaryColor}10` }}
        >
          <p
            className="text-sm font-bold leading-none"
            style={{ color: isInactive ? "#C4B8B0" : primaryColor }}
          >
            {formatTime(appointment.scheduled_at)}
          </p>
          {appointment.services && (
            <p className="text-[9px] text-[#C4B8B0] mt-1">
              {formatDuration(appointment.services.duration_minutes)}
            </p>
          )}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-[#2D2420] truncate">
              {appointment.client_name}
            </p>
            <span
              className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5
                          rounded-full text-[10px] font-semibold ${colors.bg} ${colors.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
              {STATUS_LABELS_ES[appointment.status]}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {appointment.services && (
              <span className="flex items-center gap-1 text-xs text-[#9C8E85]">
                <Scissors size={10} />
                {appointment.services.name}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-[#9C8E85]">
              <Phone size={10} />
              {appointment.client_phone}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight
          size={16}
          className="text-[#C4B8B0] shrink-0 group-hover:translate-x-0.5 transition-transform"
        />
      </div>
    </motion.button>
  );
}