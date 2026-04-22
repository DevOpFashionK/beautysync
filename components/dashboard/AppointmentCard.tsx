"use client";

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

const statusConfig: Record<string, {
  label: string;
  color: string;
  bg: string;
  dot: string;
  icon: React.ReactNode;
}> = {
  pending: {
    label: "Pendiente",
    color: "#B45309",
    bg: "rgba(217,119,6,0.07)",
    dot: "#F59E0B",
    icon: <AlertCircle size={11} />,
  },
  confirmed: {
    label: "Confirmada",
    color: "#1D4ED8",
    bg: "rgba(59,130,246,0.07)",
    dot: "#3B82F6",
    icon: <CheckCircle2 size={11} />,
  },
  completed: {
    label: "Completada",
    color: "#065F46",
    bg: "rgba(16,185,129,0.07)",
    dot: "#10B981",
    icon: <CheckCircle2 size={11} />,
  },
  cancelled: {
    label: "Cancelada",
    color: "#9CA3AF",
    bg: "rgba(156,163,175,0.07)",
    dot: "#D1D5DB",
    icon: <XCircle size={11} />,
  },
  no_show: {
    label: "No se presentó",
    color: "#DC2626",
    bg: "rgba(239,68,68,0.07)",
    dot: "#EF4444",
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

const avatarPalettes = [
  { bg: "#F3E8E8", text: "#9B2335" },
  { bg: "#E8EDF3", text: "#1E3A5F" },
  { bg: "#E8F3EE", text: "#1A5C3A" },
  { bg: "#F3EDE8", text: "#7C4A1E" },
  { bg: "#EDE8F3", text: "#4A1E7C" },
];

function getAvatarPalette(name: string) {
  return avatarPalettes[name.charCodeAt(0) % avatarPalettes.length];
}

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

  const updateStatus = async (newStatus: AppointmentStatus) => {
    setUpdating(true);
    const supabase = createClient();
    await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointment.id);
    setStatus(newStatus);
    setUpdating(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
      style={{ opacity: isFinished ? 0.55 : 1 }}
    >
      <div
        className="rounded-2xl p-5 transition-all duration-300"
        style={{
          background: "#FFFFFF",
          border: "1px solid #EDE8E3",
          boxShadow: "0 1px 4px rgba(45,36,32,0.04)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(45,36,32,0.08)";
          (e.currentTarget as HTMLElement).style.borderColor = "#DDD5CC";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(45,36,32,0.04)";
          (e.currentTarget as HTMLElement).style.borderColor = "#EDE8E3";
        }}
      >
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0"
            style={{ background: palette.bg, color: palette.text }}
          >
            {getInitials(appointment.client_name)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  className="font-semibold leading-tight truncate"
                  style={{ color: "#2D2420", fontSize: "0.9375rem" }}
                >
                  {appointment.client_name}
                </p>
                <p className="text-sm mt-0.5" style={{ color: "#9C8E85" }}>
                  {appointment.services?.name ?? "Servicio"}
                  {appointment.services?.price != null && (
                    <span style={{ color: "#C4B8B0" }}>
                      {" · "}{formatPrice(appointment.services.price)}
                    </span>
                  )}
                </p>
              </div>

              {/* Status badge */}
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0"
                style={{ background: config.bg, color: config.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: config.dot }} />
                {config.label}
              </span>
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-4 mt-2.5 text-xs" style={{ color: "#B5A99F" }}>
              <span className="flex items-center gap-1.5">
                <Clock size={12} strokeWidth={1.5} />
                {appointment.scheduled_at ? formatTime(appointment.scheduled_at) : "—"}
                {appointment.ends_at && ` — ${formatTime(appointment.ends_at)}`}
              </span>
              {appointment.services?.duration_minutes && (
                <span>{appointment.services.duration_minutes} min</span>
              )}
              {appointment.client_phone && (
                <a
                  href={`tel:${appointment.client_phone}`}
                  className="flex items-center gap-1 transition-colors"
                  style={{ color: "#B5A99F" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#D4375F")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#B5A99F")}
                >
                  <Phone size={11} strokeWidth={1.5} />
                  {appointment.client_phone}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Acciones */}
        {!isFinished && (
          <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: "1px solid #F0EBE6" }}>
            {status === "pending" && (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={updating}
                onClick={() => updateStatus("confirmed")}
                className="flex-1 text-xs font-medium py-2 px-3 rounded-xl transition-all disabled:opacity-40"
                style={{
                  background: "rgba(59,130,246,0.07)",
                  color: "#1D4ED8",
                  border: "1px solid rgba(59,130,246,0.15)",
                }}
              >
                Confirmar
              </motion.button>
            )}
            {(status === "confirmed" || status === "pending") && (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={updating}
                onClick={() => updateStatus("completed")}
                className="flex-1 text-xs font-medium py-2 px-3 rounded-xl transition-all disabled:opacity-40"
                style={{
                  background: "rgba(16,185,129,0.07)",
                  color: "#065F46",
                  border: "1px solid rgba(16,185,129,0.15)",
                }}
              >
                Completar
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={updating}
              onClick={() => updateStatus("cancelled")}
              className="text-xs font-medium py-2 px-3 rounded-xl transition-all disabled:opacity-40"
              style={{
                background: "rgba(156,163,175,0.07)",
                color: "#9CA3AF",
                border: "1px solid rgba(156,163,175,0.15)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.07)";
                (e.currentTarget as HTMLElement).style.color = "#DC2626";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(156,163,175,0.07)";
                (e.currentTarget as HTMLElement).style.color = "#9CA3AF";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(156,163,175,0.15)";
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