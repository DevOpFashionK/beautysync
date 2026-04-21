"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AppointmentCard from "./AppointmentCard";
import type { Database } from "@/types/database.types";

type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];
type Appointment = AppointmentRow & {
  services?: { name: string; duration_minutes: number; price: number } | null;
};

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
          fontSize: "1.3rem",
          fontWeight: 500,
          color: "#9C8E85",
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
          <div className="h-3 rounded-lg w-1/4" style={{ background: "#F3EDE8" }} />
        </div>
        <div className="h-6 w-20 rounded-full" style={{ background: "#F3EDE8" }} />
      </div>
    </div>
  );
}

function DaySummary({ appointments }: { appointments: Appointment[] }) {
  const total = appointments.length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const pending = appointments.filter(
    (a) => a.status === "pending" || a.status === "confirmed"
  ).length;
  const revenue = appointments
    .filter((a) => a.status === "completed")
    .reduce((sum, a) => sum + (a.services?.price ?? 0), 0);

  const stats = [
    { label: "Total",      value: String(total),     color: "#2D2420" },
    { label: "Pendientes", value: String(pending),   color: "#B45309" },
    { label: "Completadas",value: String(completed), color: "#065F46" },
    {
      label: "Ingresos",
      value: new Intl.NumberFormat("es-SV", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
      }).format(revenue),
      color: "#D4375F",
    },
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
              color: stat.color,
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "1.6rem",
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

export default function TodayAppointments({ salonId }: { salonId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchAppointments = useCallback(async () => {
    const supabase = createClient();
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(), today.getMonth(), today.getDate()
    ).toISOString();
    const endOfDay = new Date(
      today.getFullYear(), today.getMonth(), today.getDate() + 1
    ).toISOString();

    const { data, error } = await supabase
      .from("appointments")
      .select("*, services(name, duration_minutes, price)")
      .eq("salon_id", salonId)
      .gte("scheduled_at", startOfDay)
      .lt("scheduled_at", endOfDay)
      .order("scheduled_at", { ascending: true });

    if (!error && data) {
      setAppointments(data as Appointment[]);
      setLastUpdate(new Date());
    }
    setLoading(false);
  }, [salonId]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Realtime — escucha cambios en DB (incluyendo no_show marcados por el servidor)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`today-appointments-${salonId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `salon_id=eq.${salonId}`,
        },
        (payload) => {
          const today = new Date();
          const startOfDay = new Date(
            today.getFullYear(), today.getMonth(), today.getDate()
          ).toISOString();
          const endOfDay = new Date(
            today.getFullYear(), today.getMonth(), today.getDate() + 1
          ).toISOString();

          if (payload.eventType === "INSERT") {
            const newAppt = payload.new as Appointment;
            const t = newAppt.scheduled_at ?? "";
            if (t >= startOfDay && t < endOfDay) {
              setAppointments((prev) =>
                [...prev, newAppt].sort(
                  (a, b) =>
                    new Date(a.scheduled_at ?? "").getTime() -
                    new Date(b.scheduled_at ?? "").getTime()
                )
              );
              setLastUpdate(new Date());
            }
          } else if (payload.eventType === "UPDATE") {
            setAppointments((prev) =>
              prev.map((a) =>
                a.id === payload.new.id ? { ...a, ...payload.new } : a
              )
            );
            setLastUpdate(new Date());
          } else if (payload.eventType === "DELETE") {
            setAppointments((prev) =>
              prev.filter((a) => a.id !== payload.old.id)
            );
            setLastUpdate(new Date());
          }
        }
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
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "1.35rem",
              fontWeight: 500,
              color: "#5C4F48",
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
          {lastUpdate && !loading && (
            <span className="text-xs hidden sm:block" style={{ color: "#C4B8B0" }}>
              Actualizado{" "}
              {lastUpdate.toLocaleTimeString("es-SV", {
                hour: "2-digit",
                minute: "2-digit",
              })}
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