"use client";

// components/dashboard/appointments/AppointmentsClient.tsx
//
// Realtime: suscripción INSERT / UPDATE / DELETE en appointments.
// - INSERT: fetch adicional para obtener el JOIN de services.
// - UPDATE: actualiza status en lista y modal si está abierto.
// - DELETE: elimina de la lista y cierra modal si corresponde.
// - Indicador visual "En vivo" con dot animado.
// - Cleanup correcto en unmount.

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { formatGroupDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import AppointmentRow from "./AppointmentRow";
import { AppointmentDetailModal } from "./AppointmentDetailModal";
import AppointmentsEmptyState from "./AppointmentsEmptyState";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface AppointmentService {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

export interface Appointment {
  id: string;
  salon_id: string;
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

type RealtimeAppointment = Partial<Appointment> & { id: string };

type StatusFilter =
  | "all"
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

interface AppointmentsClientProps {
  salonId: string;
  primaryColor: string;
  initialAppointments: Appointment[];
}

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "Todas",
  pending: "Pendientes",
  confirmed: "Confirmadas",
  completed: "Completadas",
  cancelled: "Canceladas",
  no_show: "No asistió",
};

// ─── STATUS_COLORS Dark Atelier ───────────────────────────────────────────────
// Exportado para que AppointmentRow lo importe directamente.

export const STATUS_COLORS: Record<
  string,
  {
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    dotColor: string;
  }
> = {
  pending: {
    badgeBg: "rgba(234,179,8,0.07)",
    badgeText: "rgba(251,191,36,0.85)",
    badgeBorder: "rgba(234,179,8,0.2)",
    dotColor: "rgba(251,191,36,0.7)",
  },
  confirmed: {
    badgeBg: "rgba(59,130,246,0.07)",
    badgeText: "rgba(147,197,253,0.85)",
    badgeBorder: "rgba(59,130,246,0.2)",
    dotColor: "rgba(147,197,253,0.7)",
  },
  completed: {
    badgeBg: "rgba(16,185,129,0.07)",
    badgeText: "rgba(110,231,183,0.85)",
    badgeBorder: "rgba(16,185,129,0.2)",
    dotColor: "rgba(52,211,153,0.7)",
  },
  cancelled: {
    badgeBg: "rgba(255,255,255,0.03)",
    badgeText: "rgba(245,242,238,0.25)",
    badgeBorder: "rgba(255,255,255,0.07)",
    dotColor: "rgba(245,242,238,0.2)",
  },
  no_show: {
    badgeBg: "rgba(239,68,68,0.07)",
    badgeText: "rgba(252,165,165,0.85)",
    badgeBorder: "rgba(239,68,68,0.2)",
    dotColor: "rgba(252,165,165,0.6)",
  },
};

function getThirtyDaysAgoStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  bg: "#080706",
  surface: "#0E0C0B",
  surface2: "#131110",
  border: "rgba(255,255,255,0.055)",
  borderMid: "rgba(255,255,255,0.09)",
  textPrimary: "rgba(245,242,238,0.9)",
  textMid: "rgba(245,242,238,0.45)",
  textDim: "rgba(245,242,238,0.18)",
  roseDim: "rgba(255,45,85,0.55)",
  roseBorder: "rgba(255,45,85,0.22)",
  roseGhost: "rgba(255,45,85,0.08)",
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AppointmentsClient({
  salonId,
  primaryColor,
  initialAppointments,
}: AppointmentsClientProps) {
  const [appointments, setAppointments] =
    useState<Appointment[]>(initialAppointments);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [connected, setConnected] = useState(false);

  // ── Fetch completo con JOIN de services ───────────────────────────────────
  const fetchFullAppointment = useCallback(
    async (id: string): Promise<Appointment | null> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id, client_name, client_email, client_phone, client_notes,
          scheduled_at, ends_at, status, cancellation_reason, cancelled_at, created_at,
          services(id, name, duration_minutes, price)
        `,
        )
        .eq("id", id)
        .single();
      if (error || !data) return null;
      return data as Appointment;
    },
    [],
  );

  // ── Realtime — lógica intacta ─────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    const thirtyDaysAgo = getThirtyDaysAgoStr();

    const channel = supabase
      .channel(`appointments-list-${salonId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `salon_id=eq.${salonId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const raw = payload.new as RealtimeAppointment;
            const dateKey = (raw.scheduled_at ?? "").slice(0, 10);
            if (!raw.id || dateKey < thirtyDaysAgo) return;
            const full = await fetchFullAppointment(raw.id);
            if (!full) return;
            setAppointments((prev) => {
              if (prev.some((a) => a.id === full.id)) return prev;
              return [full, ...prev].sort((a, b) =>
                b.scheduled_at.localeCompare(a.scheduled_at),
              );
            });
          }

          if (payload.eventType === "UPDATE") {
            const updated = payload.new as RealtimeAppointment;
            setAppointments((prev) =>
              prev.map((a) =>
                a.id === updated.id
                  ? {
                      ...a,
                      status: updated.status ?? a.status,
                      cancellation_reason:
                        updated.cancellation_reason ?? a.cancellation_reason,
                      cancelled_at: updated.cancelled_at ?? a.cancelled_at,
                      scheduled_at: updated.scheduled_at ?? a.scheduled_at,
                      ends_at: updated.ends_at ?? a.ends_at,
                    }
                  : a,
              ),
            );
            setSelectedAppointment((prev) =>
              prev?.id === updated.id
                ? {
                    ...prev,
                    status: updated.status ?? prev.status,
                    cancellation_reason:
                      updated.cancellation_reason ?? prev.cancellation_reason,
                    cancelled_at: updated.cancelled_at ?? prev.cancelled_at,
                  }
                : prev,
            );
          }

          if (payload.eventType === "DELETE") {
            const deleted = payload.old as RealtimeAppointment;
            if (!deleted.id) return;
            setAppointments((prev) => prev.filter((a) => a.id !== deleted.id));
            setSelectedAppointment((prev) =>
              prev?.id === deleted.id ? null : prev,
            );
          }
        },
      )
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salonId, fetchFullAppointment]);

  // ── Filtered + grouped ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      const matchesSearch =
        search === "" ||
        a.client_name.toLowerCase().includes(search.toLowerCase()) ||
        a.client_phone.includes(search) ||
        (a.client_email?.toLowerCase().includes(search.toLowerCase()) ??
          false) ||
        (a.services?.name.toLowerCase().includes(search.toLowerCase()) ??
          false);
      return matchesStatus && matchesSearch;
    });
  }, [appointments, statusFilter, search]);

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
    reason?: string,
  ) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: newStatus,
              cancellation_reason: reason ?? a.cancellation_reason,
              cancelled_at:
                newStatus === "cancelled"
                  ? new Date().toISOString()
                  : a.cancelled_at,
            }
          : a,
      ),
    );
    if (selectedAppointment?.id === id) {
      setSelectedAppointment((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              cancellation_reason: reason ?? prev.cancellation_reason,
              cancelled_at:
                newStatus === "cancelled"
                  ? new Date().toISOString()
                  : prev.cancelled_at,
            }
          : null,
      );
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: T.bg }}>
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        {/* ── Header ───────────────────────────────────────────────── */}
        <div style={{ padding: "40px 24px 24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div>
              {/* Eyebrow */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "10px",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "14px",
                    height: "1px",
                    background: T.roseDim,
                  }}
                />
                <span
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: T.roseDim,
                  }}
                >
                  Agenda
                </span>
              </div>
              <h1
                style={{
                  fontFamily:
                    "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
                  fontSize: "clamp(2.5rem, 5vw, 4rem)",
                  fontWeight: 300,
                  color: T.textPrimary,
                  lineHeight: 1.04,
                  letterSpacing: "-0.035em",
                  margin: 0,
                }}
              >
                Citas
              </h1>
              <p
                style={{
                  fontSize: "12px",
                  color: T.textDim,
                  marginTop: "6px",
                  letterSpacing: "0.04em",
                }}
              >
                Últimos 30 días · {appointments.length} citas en total
              </p>
            </div>

            {/* Indicador en vivo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "8px",
                flexShrink: 0,
              }}
            >
              {connected ? (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: "#22c55e",
                    }}
                  />
                  <span
                    className="hidden sm:block"
                    style={{
                      fontSize: "10px",
                      color: "rgba(34,197,94,0.7)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    En vivo
                  </span>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: T.textDim,
                    }}
                  />
                  <span
                    className="hidden sm:block"
                    style={{
                      fontSize: "10px",
                      color: T.textDim,
                      letterSpacing: "0.06em",
                    }}
                  >
                    Reconectando…
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: "12px" }}>
            <Search
              size={14}
              strokeWidth={1.5}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: T.textDim,
              }}
            />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o servicio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                paddingLeft: "36px",
                paddingRight: "14px",
                paddingTop: "10px",
                paddingBottom: "10px",
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: "8px",
                fontSize: "13px",
                color: T.textPrimary,
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = T.roseBorder;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${T.roseGhost}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Filtros de estado */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              overflowX: "auto",
              paddingBottom: "4px",
            }}
          >
            {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((s) => {
              const isActive = statusFilter === s;
              const count = counts[s] || 0;
              if (s !== "all" && count === 0) return null;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "6px 12px",
                    borderRadius: "7px",
                    fontSize: "11px",
                    fontWeight: 400,
                    letterSpacing: "0.04em",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    fontFamily: "inherit",
                    background: isActive ? T.roseGhost : "transparent",
                    color: isActive ? T.roseDim : T.textDim,
                    border: isActive
                      ? `1px solid ${T.roseBorder}`
                      : `1px solid ${T.border}`,
                  }}
                >
                  {STATUS_LABELS[s]}
                  <span style={{ fontSize: "10px", opacity: 0.7 }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────────────── */}
        <div style={{ padding: "0 24px 80px" }}>
          {appointments.length === 0 ? (
            <AppointmentsEmptyState primaryColor={primaryColor} />
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "64px 0",
                textAlign: "center",
              }}
            >
              <Search
                size={24}
                strokeWidth={1.25}
                style={{ color: T.textDim, marginBottom: "12px" }}
              />
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 400,
                  color: T.textMid,
                  margin: "0 0 4px",
                }}
              >
                Sin resultados
              </p>
              <p style={{ fontSize: "12px", color: T.textDim, margin: 0 }}>
                Intenta con otro término
              </p>
            </motion.div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "28px" }}
            >
              {grouped.map(([dateKey, appts]) => (
                <motion.div
                  key={dateKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* Date header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily:
                          "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
                        fontSize: "1.1rem",
                        fontWeight: 300,
                        color: T.textMid,
                        letterSpacing: "-0.01em",
                        textTransform: "capitalize",
                      }}
                    >
                      {formatGroupDate(dateKey)}
                    </span>
                    <div
                      style={{ flex: 1, height: "1px", background: T.border }}
                    />
                    <span
                      style={{
                        fontSize: "10px",
                        color: T.textDim,
                        letterSpacing: "0.06em",
                      }}
                    >
                      {appts.length}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
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

      {/* ── Detail Modal ─────────────────────────────────────────────── */}
      <AppointmentDetailModal
        appointment={selectedAppointment}
        primaryColor={primaryColor}
        onClose={() => setSelectedAppointment(null)}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
}
