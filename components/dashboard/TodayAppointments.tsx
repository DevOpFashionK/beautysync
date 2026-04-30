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

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AppointmentCard from "./AppointmentCard";
import type { Database } from "@/types/database.types";

type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];
type Appointment = AppointmentRow & {
  services?: { name: string; duration_minutes: number; price: number } | null;
};

// ─── Rango del día en timezone LOCAL del cliente ──────────────────────────────
function getTodayLocalRange(): { startOfDay: string; endOfDay: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const startOfDay = new Date(
    Date.UTC(year, month, day, 0, 0, 0, 0),
  ).toISOString();
  const endOfDay = new Date(
    Date.UTC(year, month, day + 1, 0, 0, 0, 0),
  ).toISOString();
  return { startOfDay, endOfDay };
}

// ─── Empty State Dark Atelier ─────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 0",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "10px",
          border: "1px solid rgba(255,255,255,0.055)", // ✅ fix: 0.06 → border 0.055
          background: "rgba(255,255,255,0.02)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "18px",
        }}
      >
        <CalendarDays
          size={20}
          strokeWidth={1.25}
          style={{ color: "rgba(245,242,238,0.18)" }} // ✅ fix: 0.15 → textDim 0.18
        />
      </div>
      <p
        style={{
          fontFamily:
            "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
          fontSize: "1.25rem",
          fontWeight: 300,
          color: "rgba(245,242,238,0.45)", // ✅ fix: 0.35 → textMid 0.45
          letterSpacing: "-0.01em",
          marginBottom: "6px",
        }}
      >
        Sin citas para hoy
      </p>
      <p
        style={{
          fontSize: "12px",
          color: "rgba(245,242,238,0.18)", // ✅ fix: 0.15 → textDim 0.18
          maxWidth: "22rem",
          lineHeight: 1.65,
          letterSpacing: "0.02em",
        }}
      >
        Cuando tus clientas agenden, aparecerán aquí en tiempo real.
      </p>
    </motion.div>
  );
}

// ─── Skeleton Dark Atelier ────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="animate-pulse"
      style={{
        borderRadius: "10px",
        padding: "18px",
        background: "#0E0C0B",
        border: "1px solid rgba(255,255,255,0.055)", // ✅ fix: 0.05 → border 0.055
      }}
    >
      <div style={{ display: "flex", gap: "14px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.04)",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: "12px",
              borderRadius: "4px",
              width: "45%",
              background: "rgba(255,255,255,0.04)",
              marginBottom: "8px",
            }}
          />
          <div
            style={{
              height: "10px",
              borderRadius: "4px",
              width: "30%",
              background: "rgba(255,255,255,0.03)",
              marginBottom: "10px",
            }}
          />
          <div
            style={{
              height: "10px",
              borderRadius: "4px",
              width: "20%",
              background: "rgba(255,255,255,0.03)",
            }}
          />
        </div>
        <div
          style={{
            height: "22px",
            width: "70px",
            borderRadius: "20px",
            background: "rgba(255,255,255,0.04)",
          }}
        />
      </div>
    </div>
  );
}

// ─── Day Summary Dark Atelier ─────────────────────────────────────────────────
function DaySummary({ appointments }: { appointments: Appointment[] }) {
  const total = appointments.length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const pending = appointments.filter(
    (a) => a.status === "pending" || a.status === "confirmed",
  ).length;
  const revenue = appointments
    .filter((a) => a.status === "completed")
    .reduce((sum, a) => sum + (a.services?.price ?? 0), 0);

  const dollars = Math.floor(revenue);
  const cents = Math.round((revenue - dollars) * 100);
  const revenueStr = `$${dollars}.${String(cents).padStart(2, "0")}`;

  const stats = [
    { label: "Total", value: String(total), accent: false },
    { label: "Pendientes", value: String(pending), accent: false },
    { label: "Completadas", value: String(completed), accent: false },
    { label: "Ingresos", value: revenueStr, accent: true },
  ];

  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      style={{ marginBottom: "24px" }}
    >
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          style={{
            borderRadius: "10px",
            padding: "16px",
            background: "#0E0C0B",
            border: "1px solid rgba(255,255,255,0.055)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Línea inferior acento en Ingresos */}
          {stat.accent && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "1px",
                background: "rgba(255,45,85,0.22)", // ✅ fix: 0.35 → roseBorder 0.22
              }}
            />
          )}
          <p
            style={{
              fontSize: "9px",
              fontWeight: 400,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(245,242,238,0.18)", // ✅ fix: 0.2 → textDim 0.18
              marginBottom: "8px",
            }}
          >
            {stat.label}
          </p>
          <p
            style={{
              fontFamily:
                "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "1.6rem",
              fontWeight: 300,
              lineHeight: 1,
              letterSpacing: "-0.03em",
              color: stat.accent
                ? "rgba(255,45,85,0.75)"
                : "rgba(245,242,238,0.75)",
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
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [lastUpdateStr, setLastUpdateStr] = useState<string | null>(null);

  const captureUpdateTime = useCallback(() => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    setLastUpdateStr(`${h}:${m}`);
  }, []);

  const fetchAppointments = useCallback(async () => {
    const supabase = createClient();
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
  }, [salonId, captureUpdateTime]);

  // Ref estable que siempre apunta a la version mas reciente de fetchAppointments.
  // Permite que el useEffect de carga inicial no tenga fetchAppointments en su
  // dependency array, evitando que el React Compiler detecte setState indirecto
  // dentro del cuerpo del efecto.
  const fetchRef = useRef(fetchAppointments);
  useEffect(() => {
    fetchRef.current = fetchAppointments;
  }, [fetchAppointments]);

  useEffect(() => {
    let cancelled = false;
    fetchRef.current().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salonId]);

  // ─── Realtime — lógica intacta ────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    const { startOfDay, endOfDay } = getTodayLocalRange();

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
          if (payload.eventType === "INSERT") {
            const newAppt = payload.new as Appointment;
            const t = newAppt.scheduled_at ?? "";
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salonId, captureUpdateTime]);

  return (
    <div>
      {/* ── Subheader ───────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <p
            style={{
              fontFamily:
                "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "1.3rem",
              fontWeight: 300,
              color: "rgba(245,242,238,0.7)",
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            Agenda del día
          </p>

          {!loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {connected ? (
                <>
                  <motion.div
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [1, 0.5, 1],
                    }}
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
                <span
                  style={{
                    fontSize: "10px",
                    color: "rgba(245,242,238,0.18)", // ✅ fix: 0.2 → textDim 0.18
                    letterSpacing: "0.06em",
                  }}
                >
                  Reconectando…
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {lastUpdateStr && !loading && (
            <span
              className="hidden sm:block"
              style={{
                fontSize: "10px",
                color: "rgba(245,242,238,0.18)",
                letterSpacing: "0.06em",
              }}
            >
              Actualizado {lastUpdateStr}
            </span>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchAppointments}
            aria-label="Actualizar"
            style={{
              padding: "6px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(245,242,238,0.18)",
              display: "flex",
              alignItems: "center",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color =
                "rgba(245,242,238,0.45)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color =
                "rgba(245,242,238,0.18)")
            }
          >
            <RefreshCw size={13} strokeWidth={1.5} />
          </motion.button>
        </div>
      </div>

      {/* ── Stats del día ───────────────────────────────────────────── */}
      {!loading && appointments.length > 0 && (
        <DaySummary appointments={appointments} />
      )}

      {/* ── Lista de citas ──────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
