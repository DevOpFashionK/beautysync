"use client";

// components/dashboard/AppointmentCard.tsx
import { motion } from "framer-motion";
import { Clock, Phone, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatTime, formatPrice } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];
type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

type Appointment = AppointmentRow & {
  services?: { name: string; duration_minutes: number; price: number } | null;
};

// ── Status config Dark Atelier ────────────────────────────────────────────────
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
    icon: <AlertCircle size={11} />,
  },
  confirmed: {
    label: "Confirmada",
    color: "rgba(147,197,253,0.85)",
    bg: "rgba(59,130,246,0.07)",
    border: "rgba(59,130,246,0.2)",
    dot: "rgba(147,197,253,0.7)",
    icon: <CheckCircle2 size={11} />,
  },
  completed: {
    label: "Completada",
    color: "rgba(110,231,183,0.85)",
    bg: "rgba(16,185,129,0.07)",
    border: "rgba(16,185,129,0.2)",
    dot: "rgba(52,211,153,0.7)",
    icon: <CheckCircle2 size={11} />,
  },
  cancelled: {
    label: "Cancelada",
    color: "rgba(245,242,238,0.25)",
    bg: "rgba(255,255,255,0.03)",
    border: "rgba(255,255,255,0.09)",
    dot: "rgba(245,242,238,0.2)",
    icon: <XCircle size={11} />,
  },
  no_show: {
    label: "No se presentó",
    color: "rgba(252,165,165,0.85)",
    bg: "rgba(239,68,68,0.07)",
    border: "rgba(239,68,68,0.2)",
    dot: "rgba(252,165,165,0.6)",
    icon: <XCircle size={11} />,
  },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

// Paletas para el avatar — todas sobre fondo dark
const avatarPalettes = [
  { bg: "rgba(255,45,85,0.1)", text: "rgba(255,45,85,0.7)" },
  { bg: "rgba(59,130,246,0.1)", text: "rgba(147,197,253,0.7)" },
  { bg: "rgba(16,185,129,0.1)", text: "rgba(52,211,153,0.7)" },
  { bg: "rgba(234,179,8,0.1)", text: "rgba(251,191,36,0.7)" },
  { bg: "rgba(168,85,247,0.1)", text: "rgba(216,180,254,0.7)" },
];

function getAvatarPalette(name: string) {
  return avatarPalettes[name.charCodeAt(0) % avatarPalettes.length];
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function AppointmentCard({
  appointment,
  index = 0,
}: {
  appointment: Appointment;
  index?: number;
}) {
  const [status, setStatus] = useState<string>(appointment.status ?? "pending");
  const [updating, setUpdating] = useState(false);

  const config = statusConfig[status] ?? statusConfig.pending;
  const isFinished =
    status === "completed" || status === "cancelled" || status === "no_show";
  const palette = getAvatarPalette(appointment.client_name);

  // ✅ IDOR fix: filtrar siempre por salon_id además del id de la cita
  const updateStatus = async (newStatus: AppointmentStatus) => {
    setUpdating(true);
    const supabase = createClient();
    await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointment.id)
      .eq("salon_id", appointment.salon_id); // ✅ IDOR prevention
    setStatus(newStatus);
    setUpdating(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative"
      style={{ opacity: isFinished ? 0.45 : 1 }}
    >
      <div
        style={{
          borderRadius: "10px",
          padding: "16px 18px",
          background: "#0E0C0B",
          border: "1px solid rgba(255,255,255,0.055)",
          transition: "border-color 0.2s",
          position: "relative",
          overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor =
            "rgba(255,255,255,0.09)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor =
            "rgba(255,255,255,0.055)";
        }}
      >
        {/* Acento de estado — línea izquierda */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "20%",
            bottom: "20%",
            width: "2px",
            borderRadius: "0 2px 2px 0",
            background: config.dot,
            opacity: 0.6,
          }}
        />

        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          {/* Avatar */}
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: 400, // ✅ fix: 600 → 400
              flexShrink: 0,
              background: palette.bg,
              color: palette.text,
              letterSpacing: "0.03em",
            }}
          >
            {getInitials(appointment.client_name)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Nombre + badge */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontWeight: 400,
                    fontSize: "14px",
                    color: "rgba(245,242,238,0.9)", // ✅ fix: 0.85 → textPrimary 0.9
                    lineHeight: 1.3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    margin: 0,
                  }}
                >
                  {appointment.client_name}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "rgba(245,242,238,0.45)", // ✅ fix: 0.35 → textMid 0.45
                    margin: "3px 0 0",
                  }}
                >
                  {appointment.services?.name ?? "Servicio"}
                  {appointment.services?.price != null && (
                    <span style={{ color: "rgba(245,242,238,0.18)" }}>
                      {" "}
                      {/* ✅ fix: 0.2 → textDim 0.18 */}
                      {" · "}
                      {formatPrice(appointment.services.price)}
                    </span>
                  )}
                </p>
              </div>

              {/* Status badge */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "10px",
                  fontWeight: 400,
                  letterSpacing: "0.05em",
                  flexShrink: 0,
                  background: config.bg,
                  color: config.color,
                  border: `1px solid ${config.border}`,
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
            </div>

            {/* Meta info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginTop: "10px",
                fontSize: "11px",
                color: "rgba(245,242,238,0.18)", // ✅ fix: 0.22 → textDim 0.18
              }}
            >
              <span
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <Clock size={11} strokeWidth={1.5} />
                {appointment.scheduled_at
                  ? formatTime(appointment.scheduled_at)
                  : "—"}
                {appointment.ends_at && ` — ${formatTime(appointment.ends_at)}`}
              </span>
              {appointment.services?.duration_minutes && (
                <span>{appointment.services.duration_minutes} min</span>
              )}
              {appointment.client_phone && (
                <a
                  href={`tel:${appointment.client_phone}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "rgba(245,242,238,0.18)", // ✅ fix: 0.22 → textDim 0.18
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color =
                      "rgba(255,45,85,0.6)")
                  }
                  onMouseLeave={
                    (e) =>
                      ((e.currentTarget as HTMLElement).style.color =
                        "rgba(245,242,238,0.18)") // ✅ fix: 0.22 → textDim 0.18
                  }
                >
                  <Phone size={10} strokeWidth={1.5} />
                  {appointment.client_phone}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Acciones ─────────────────────────────────────────────── */}
        {!isFinished && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "14px",
              paddingTop: "14px",
              borderTop: "1px solid rgba(255,255,255,0.055)", // ✅ fix: 0.04 → border 0.055
            }}
          >
            {/* Confirmar — solo si pending */}
            {status === "pending" && (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={updating}
                onClick={() => updateStatus("confirmed")}
                style={{
                  flex: 1,
                  fontSize: "11px",
                  fontWeight: 400,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "8px 12px",
                  borderRadius: "7px",
                  border: "1px solid rgba(59,130,246,0.2)",
                  background: "rgba(59,130,246,0.07)",
                  color: "rgba(147,197,253,0.85)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  opacity: updating ? 0.4 : 1,
                }}
              >
                Confirmar
              </motion.button>
            )}

            {/* Completar */}
            {(status === "confirmed" || status === "pending") && (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={updating}
                onClick={() => updateStatus("completed")}
                style={{
                  flex: 1,
                  fontSize: "11px",
                  fontWeight: 400,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "8px 12px",
                  borderRadius: "7px",
                  border: "1px solid rgba(16,185,129,0.2)",
                  background: "rgba(16,185,129,0.07)",
                  color: "rgba(52,211,153,0.85)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  opacity: updating ? 0.4 : 1,
                }}
              >
                Completar
              </motion.button>
            )}

            {/* Cancelar */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={updating}
              onClick={() => updateStatus("cancelled")}
              style={{
                fontSize: "11px",
                fontWeight: 400,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "8px 12px",
                borderRadius: "7px",
                border: "1px solid rgba(255,255,255,0.055)", // ✅ fix: 0.07 → border 0.055
                background: "transparent",
                color: "rgba(245,242,238,0.18)", // ✅ fix: 0.22 → textDim 0.18
                cursor: "pointer",
                transition: "all 0.15s",
                opacity: updating ? 0.4 : 1,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(239,68,68,0.07)";
                (e.currentTarget as HTMLElement).style.color =
                  "rgba(252,165,165,0.8)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(239,68,68,0.2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
                (e.currentTarget as HTMLElement).style.color =
                  "rgba(245,242,238,0.18)"; // ✅ fix: 0.22 → textDim 0.18
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(255,255,255,0.055)"; // ✅ fix: 0.07 → border 0.055
              }}
            >
              Cancelar
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
