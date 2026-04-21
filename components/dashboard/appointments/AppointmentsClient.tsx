"use client";

// components/dashboard/appointments/AppointmentsClient.tsx
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { formatGroupDate } from "@/lib/utils";
import AppointmentRow from "./AppointmentRow";
import AppointmentDetailModal from "./AppointmentDetailModal";
import AppointmentsEmptyState from "./AppointmentsEmptyState";

export interface AppointmentService {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

export interface Appointment {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string;
  client_notes: string | null;
  scheduled_at: string;
  ends_at: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  cancellation_reason: string | null;
  cancelled_at: string | null;
  created_at: string | null;
  services: AppointmentService | null;
}

type StatusFilter = "all" | "pending" | "confirmed" | "cancelled" | "completed" | "no_show";

interface AppointmentsClientProps {
  salonId: string;
  primaryColor: string;
  initialAppointments: Appointment[];
}

const STATUS_LABELS: Record<StatusFilter, string> = {
  all:       "Todas",
  pending:   "Pendientes",
  confirmed: "Confirmadas",
  completed: "Completadas",
  cancelled: "Canceladas",
  no_show:   "No asistió",
};

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending:   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400" },
  confirmed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  completed: { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400" },
  cancelled: { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-400" },
  no_show:   { bg: "bg-gray-50",    text: "text-gray-500",    dot: "bg-gray-400" },
};

export default function AppointmentsClient({
  salonId,
  primaryColor,
  initialAppointments,
}: AppointmentsClientProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      const matchesSearch =
        search === "" ||
        a.client_name.toLowerCase().includes(search.toLowerCase()) ||
        a.client_phone.includes(search) ||
        (a.client_email?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (a.services?.name.toLowerCase().includes(search.toLowerCase()) ?? false);
      return matchesStatus && matchesSearch;
    });
  }, [appointments, statusFilter, search]);

  // Agrupar por fecha (YYYY-MM-DD) — determinístico, no usa toLocaleDateString
  const grouped = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    for (const appt of filtered) {
      const dateKey = appt.scheduled_at.slice(0, 10);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(appt);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: appointments.length };
    for (const a of appointments) {
      c[a.status] = (c[a.status] || 0) + 1;
    }
    return c;
  }, [appointments]);

  const handleStatusUpdate = (
    id: string,
    newStatus: Appointment["status"],
    reason?: string
  ) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: newStatus,
              cancellation_reason: reason || a.cancellation_reason,
              cancelled_at:
                newStatus === "cancelled" ? new Date().toISOString() : a.cancelled_at,
            }
          : a
      )
    );
    if (selectedAppointment?.id === id) {
      setSelectedAppointment((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              cancellation_reason: reason || prev.cancellation_reason,
              cancelled_at:
                newStatus === "cancelled" ? new Date().toISOString() : prev.cancelled_at,
            }
          : null
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <div className="max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="px-6 pt-8 pb-6 md:px-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-5 h-[2px] rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
              <span
                className="text-xs font-semibold tracking-[0.15em] uppercase"
                style={{ color: primaryColor }}
              >
                Agenda
              </span>
            </div>
            <h1 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl font-semibold text-[#2D2420] leading-none">
              Citas
            </h1>
            <p className="text-[#9C8E85] text-sm mt-2">
              Últimos 30 días · {appointments.length} citas en total
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C4B8B0]"
          />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EDE8E3]
                       rounded-xl text-sm text-[#2D2420] placeholder:text-[#C4B8B0]
                       outline-none transition-all"
            onFocus={(e) => {
              e.currentTarget.style.borderColor = primaryColor;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}15`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#EDE8E3";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((s) => {
            const isActive = statusFilter === s;
            const count = counts[s] || 0;
            if (s !== "all" && count === 0) return null;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs
                           font-medium whitespace-nowrap transition-all duration-150 shrink-0"
                style={
                  isActive
                    ? { backgroundColor: primaryColor, color: "#fff" }
                    : { backgroundColor: "#fff", color: "#9C8E85", border: "1px solid #EDE8E3" }
                }
              >
                {STATUS_LABELS[s]}
                <span className="text-[10px] font-bold" style={{ opacity: isActive ? 0.7 : 1 }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-6 md:px-10 pb-16">
        {appointments.length === 0 ? (
          <AppointmentsEmptyState primaryColor={primaryColor} />
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-20 text-center"
          >
            <Search size={28} className="text-[#C4B8B0] mb-3" />
            <p className="text-[#2D2420] font-medium text-sm">Sin resultados</p>
            <p className="text-[#9C8E85] text-xs mt-1">Intenta con otro término</p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-6">
            {grouped.map(([dateKey, appts]) => (
              <motion.div
                key={dateKey}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-['Cormorant_Garamond'] text-lg font-semibold text-[#2D2420] capitalize">
                    {formatGroupDate(dateKey)}
                  </span>
                  <div className="h-px flex-1 bg-[#EDE8E3]" />
                  <span className="text-xs text-[#C4B8B0]">{appts.length}</span>
                </div>

                <div className="flex flex-col gap-2">
                  {appts.map((appt, i) => (
                    <AppointmentRow
                      key={appt.id}
                      appointment={appt}
                      primaryColor={primaryColor}
                      index={i}
                      onClick={() => setSelectedAppointment(appt)}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      </div>

      {/* ── Detail Modal ── */}
      <AppointmentDetailModal
        appointment={selectedAppointment}
        primaryColor={primaryColor}
        onClose={() => setSelectedAppointment(null)}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
}