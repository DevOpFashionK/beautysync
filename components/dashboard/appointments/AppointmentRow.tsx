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
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió",
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
      style={{
        width: "100%",
        textAlign: "left",
        background: "#0E0C0B",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.055)",
        padding: "14px 16px",
        cursor: "pointer",
        opacity: isInactive ? 0.45 : 1,
        transition: "border-color 0.2s, transform 0.15s",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "rgba(255,255,255,0.09)"; // ✅ fix: 0.1 → borderMid 0.09
        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "rgba(255,255,255,0.055)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Línea de estado izquierda */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "20%",
          bottom: "20%",
          width: "2px",
          borderRadius: "0 2px 2px 0",
          background: colors.dotColor,
          opacity: 0.6,
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Bloque de hora */}
        <div
          style={{
            flexShrink: 0,
            width: "52px",
            textAlign: "center",
            padding: "8px 4px",
            borderRadius: "8px",
            background: isInactive
              ? "rgba(255,255,255,0.03)"
              : `${primaryColor}10`,
            border: `1px solid ${
              isInactive
                ? "rgba(255,255,255,0.055)" // ✅ fix: 0.05 → border 0.055
                : `${primaryColor}20`
            }`,
          }}
        >
          <p
            style={{
              fontSize: "12px",
              fontWeight: 400,
              lineHeight: 1,
              color: isInactive
                ? "rgba(245,242,238,0.18)" // ✅ fix: 0.2 → textDim 0.18
                : `${primaryColor}CC`,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatTime(appointment.scheduled_at)}
          </p>
          {appointment.services && (
            <p
              style={{
                fontSize: "9px",
                color: "rgba(245,242,238,0.18)",
                marginTop: "3px",
                letterSpacing: "0.04em",
              }}
            >
              {formatDuration(appointment.services.duration_minutes)}
            </p>
          )}
        </div>

        {/* Info principal */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "4px",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                fontWeight: 400,
                color: "rgba(245,242,238,0.9)", // ✅ fix: 0.85 → textPrimary 0.9
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                margin: 0,
              }}
            >
              {appointment.client_name}
            </p>

            {/* Badge de estado */}
            <span
              style={{
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 8px",
                borderRadius: "20px",
                fontSize: "10px",
                fontWeight: 400,
                letterSpacing: "0.04em",
                background: colors.badgeBg,
                color: colors.badgeText,
                border: `1px solid ${colors.badgeBorder}`,
              }}
            >
              <span
                style={{
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: colors.dotColor,
                  flexShrink: 0,
                }}
              />
              {STATUS_LABELS_ES[appointment.status]}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {appointment.services && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  color: "rgba(245,242,238,0.18)", // ✅ fix: 0.25 → textDim 0.18
                }}
              >
                <Scissors size={10} strokeWidth={1.5} />
                {appointment.services.name}
              </span>
            )}
            {appointment.client_phone && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  color: "rgba(245,242,238,0.18)", // ✅ fix: 0.2 → textDim 0.18
                }}
              >
                <Phone size={10} strokeWidth={1.5} />
                {appointment.client_phone}
              </span>
            )}
          </div>
        </div>

        {/* Chevron */}
        <ChevronRight
          size={14}
          strokeWidth={1.5}
          style={{ color: "rgba(245,242,238,0.18)", flexShrink: 0 }} // ✅ fix: 0.15 → textDim 0.18
        />
      </div>
    </motion.button>
  );
}
