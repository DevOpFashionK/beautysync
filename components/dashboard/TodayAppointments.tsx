"use client";

// components/dashboard/TodayAppointments.tsx
//
// FIX CRÍTICO — Rango del día:
// getTodayUTCRange() usaba getUTC* del servidor, que en UTC-6 a las 9:53pm
// ya retornaba el día siguiente → mostraba citas de mañana como "hoy".
//
// SOLUCIÓN: getTodayLocalRange() usa getFullYear/getMonth/getDate del browser
// (timezone local del usuario) para construir el rango correcto del día actual.
// Luego lo convierte a ISO con Date.UTC() para que el filtro de Supabase
// (que almacena en UTC) funcione correctamente.
//
// EJEMPLO para usuario en UTC-6 el martes 21 a las 9:53pm:
// - Local: 21 de abril
// - UTC:   22 de abril (03:53am)
// - getTodayUTCRange()   → filtra 22 de abril en Supabase ❌
// - getTodayLocalRange() → filtra 21 de abril en Supabase ✅
//
// El componente es "use client" y carga con dynamic+ssr:false en BookingWidget,
// así que new Date() siempre corre en el browser con la timezone correcta.

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AppointmentCard from "./AppointmentCard";
import type { Database } from "@/types/database.types";

type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];
type Appointment    = AppointmentRow & {
  services?: { name: string; duration_minutes: number; price: number } | null;
};

// ─── Rango del día en timezone LOCAL del cliente ──────────────────────────────
// Usa getFullYear/getMonth/getDate (timezone local) para obtener el día
// calendario correcto desde la perspectiva del usuario, luego convierte
// a UTC para filtrar en Supabase (que almacena en UTC).
function getTodayLocalRange(): { startOfDay: string; endOfDay: string } {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const day   = now.getDate();
  // scheduled_at se guarda como "YYYY-MM-DDT HH:MM:00Z" (hora literal del usuario con Z)
  // El rango filtra por la parte de fecha del string — funciona correctamente
  // porque scheduled_at preserva la hora que eligió el usuario, no convierte a UTC
  const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0)).toISOString();
  const endOfDay   = new Date(Date.UTC(year, month, day + 1, 0, 0, 0, 0)).toISOString();
  return { startOfDay, endOfDay };
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "#F3EDE8" }}
      >
        <CalendarDays size={22} style={{ color: "#C4B8B0", strokeWidth: 1.5 }} />
      </div>
      <p
        className="mb-1"
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize:   "1.3rem",
          fontWeight: 500,
          color:      "#9C8E85",
        }}
      >
        Sin citas para hoy
      </p>
      <p className="text-sm" style={{ color: "#C4B8B0", maxWidth: "22rem" }}>
        Cuando tus clientas agenden, aparecerán aquí en tiempo real.
      </p>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-5 animate-pulse"
      style={{ background: "#FFFFFF", border: "1px solid #EDE8E3" }}
    >
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-xl" style={{ background: "#F3EDE8" }} />
        <div className="flex-1">
          <div className="h-4 rounded-lg w-1/2 mb-2" style={{ background: "#F3EDE8" }} />
          <div className="h-3 rounded-lg w-1/3 mb-3" style={{ background: "#F3EDE8" }} />
          <div className="h-3 rounded-lg w-1/4"      style={{ background: "#F3EDE8" }} />
        </div>
        <div className="h-6 w-20 rounded-full" style={{ background: "#F3EDE8" }} />
      </div>
    </div>
  );
}

function DaySummary({ appointments }: { appointments: Appointment[] }) {
  const total     = appointments.length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const pending   = appointments.filter(
    (a) => a.status === "pending" || a.status === "confirmed",
  ).length;
  const revenue = appointments
    .filter((a) => a.status === "completed")
    .reduce((sum, a) => sum + (a.services?.price ?? 0), 0);

  const dollars    = Math.floor(revenue);
  const cents      = Math.round((revenue - dollars) * 100);
  const revenueStr = `$${dollars}.${String(cents).padStart(2, "0")}`;

  const stats = [
    { label: "Total",       value: String(total),     color: "#2D2420" },
    { label: "Pendientes",  value: String(pending),   color: "#B45309" },
    { label: "Completadas", value: String(completed), color: "#065F46" },
    { label: "Ingresos",    value: revenueStr,         color: "#D4375F" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-2xl p-4"
          style={{ background: "#FFFFFF", border: "1px solid #EDE8E3" }}
        >
          <p className="text-xs font-medium mb-1.5" style={{ color: "#B5A99F" }}>
            {stat.label}
          </p>
          <p
            style={{
              color:      stat.color,
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize:   "1.6rem",
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            {stat.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function TodayAppointments({ salonId }: { salonId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [connected, setConnected]       = useState(false);
  const [lastUpdateStr, setLastUpdateStr] = useState<string | null>(null);

  const captureUpdateTime = () => {
    const now = new Date();
    const h   = String(now.getHours()).padStart(2, "0");
    const m   = String(now.getMinutes()).padStart(2, "0");
    setLastUpdateStr(`${h}:${m}`);
  };

  const fetchAppointments = useCallback(async () => {
    const supabase = createClient();
    // FIX: usar timezone local del cliente para calcular "hoy"
    const { startOfDay, endOfDay } = getTodayLocalRange();

    const { data, error } = await supabase
      .from("appointments")
      .select("*, services(name, duration_minutes, price)")
      .eq("salon_id", salonId)
      .gte("scheduled_at", startOfDay)
      .lt("scheduled_at", endOfDay)
      .order("scheduled_at", { ascending: true });

    if (!error && data) {
      setAppointments(data as Appointment[]);
      captureUpdateTime();
    }
    setLoading(false);
  }, [salonId]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Realtime
  useEffect(() => {
    const supabase = createClient();
    const { startOfDay, endOfDay } = getTodayLocalRange();

    const channel = supabase
      .channel(`today-appointments-${salonId}`)
      .on(
        "postgres_changes",
        {
          event:  "*",
          schema: "public",
          table:  "appointments",
          filter: `salon_id=eq.${salonId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newAppt = payload.new as Appointment;
            const t       = newAppt.scheduled_at ?? "";
            if (t >= startOfDay && t < endOfDay) {
              setAppointments((prev) =>
                [...prev, newAppt].sort((a, b) => {
                  const sa = a.scheduled_at ?? "";
                  const sb = b.scheduled_at ?? "";
                  return sa < sb ? -1 : sa > sb ? 1 : 0;
                }),
              );
              captureUpdateTime();
            }
          } else if (payload.eventType === "UPDATE") {
            setAppointments((prev) =>
              prev.map((a) =>
                a.id === payload.new.id ? { ...a, ...payload.new } : a,
              ),
            );
            captureUpdateTime();
          } else if (payload.eventType === "DELETE") {
            setAppointments((prev) =>
              prev.filter((a) => a.id !== payload.old.id),
            );
            captureUpdateTime();
          }
        },
      )
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => { supabase.removeChannel(channel); };
  }, [salonId]);

  return (
    <div>
      {/* Subheader */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <p
            style={{
              fontFamily:    "'Cormorant Garamond', Georgia, serif",
              fontSize:      "1.35rem",
              fontWeight:    500,
              color:         "#5C4F48",
              letterSpacing: "-0.01em",
            }}
          >
            Agenda del día
          </p>

          {!loading && (
            <div className="flex items-center gap-1.5">
              {connected ? (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "#10B981" }}
                  />
                  <span className="text-xs hidden sm:block" style={{ color: "#10B981" }}>
                    En vivo
                  </span>
                </>
              ) : (
                <span className="text-xs" style={{ color: "#C4B8B0" }}>
                  Reconectando…
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {lastUpdateStr && !loading && (
            <span className="text-xs hidden sm:block" style={{ color: "#C4B8B0" }}>
              Actualizado {lastUpdateStr}
            </span>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchAppointments}
            aria-label="Actualizar"
            className="p-2 rounded-xl transition-colors"
            style={{ color: "#C4B8B0" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "#9C8E85")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "#C4B8B0")
            }
          >
            <RefreshCw size={14} strokeWidth={1.5} />
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      {!loading && appointments.length > 0 && (
        <DaySummary appointments={appointments} />
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {appointments.map((appt, i) => (
              <AppointmentCard key={appt.id} appointment={appt} index={i} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}