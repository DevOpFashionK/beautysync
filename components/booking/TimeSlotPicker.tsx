"use client";

// components/booking/TimeSlotPicker.tsx
// Fase 8.1 — Calendario más pulido, slots con mejor jerarquía visual
//
// FIXES preservados del original:
// 1. GET /api/appointments incluye service_id y offset en la query string.
// 2. La API GET retorna slots con disponibilidad calculada server-side.
// 3. handleSlotSelect construye el ISO con sufijo "Z" para Zod en route.ts.
// 4. dynamic() en BookingWidget evita hydration mismatch (ssr: false).

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  CalendarX,
} from "lucide-react";
import type { SelectedService } from "@/types/booking.types";

interface TimeSlotPickerProps {
  salonId: string;
  service: SelectedService;
  primaryColor: string;
  onSelect: (
    datetime: string,
    timeDisplay: string,
    dateDisplay: string,
  ) => void;
}

interface Slot {
  time: string;
  available: boolean;
  datetime: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const DAYS_FULL_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTimeDisplay(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatDateDisplay(date: Date): string {
  return `${DAYS_FULL_ES[date.getDay()]} ${date.getDate()} de ${MONTHS_ES[date.getMonth()]}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

// Skeleton de carga para los días del calendario
function CalendarSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "4px",
      }}
    >
      {Array.from({ length: 35 }).map((_, i) => (
        <div
          key={i}
          style={{
            aspectRatio: "1",
            borderRadius: "50%",
            backgroundColor: "#EDE8E3",
            opacity: 0.4 + (i % 3) * 0.2,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      ))}
    </div>
  );
}

// Estado vacío de slots
function NoSlotsState({
  isClosed,
  primaryColor,
}: {
  isClosed: boolean;
  primaryColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        padding: "24px 0",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          backgroundColor: `${primaryColor}12`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CalendarX size={18} style={{ color: primaryColor, opacity: 0.6 }} />
      </div>
      <p style={{ fontSize: "0.8125rem", color: "#9C8E85", lineHeight: 1.5 }}>
        {isClosed
          ? "El salón no atiende este día."
          : "No hay horarios disponibles.\nPrueba con otro día."}
      </p>
    </motion.div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function TimeSlotPicker({
  salonId,
  service,
  primaryColor,
  onSelect,
}: TimeSlotPickerProps) {
  // Timezone offset del browser — se envía al servidor para calcular "hoy" correctamente
  const [timezoneOffset] = useState<number>(() =>
    new Date().getTimezoneOffset(),
  );

  const [today] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [currentMonth, setCurrentMonth] = useState<Date>(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isClosed, setIsClosed] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableDays, setAvailableDays] = useState<Set<number>>(new Set());
  const [loadingDays, setLoadingDays] = useState(true);

  // ── Precargar días disponibles del mes visible ──────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoadingDays(true);

    fetch(`/api/business-hours?salon_id=${salonId}`)
      .then((r) => r.json())
      .then((data: { hours?: { day_of_week: number; is_open: boolean }[] }) => {
        if (cancelled) return;
        const openDays = new Set(
          (data.hours || []).filter((h) => h.is_open).map((h) => h.day_of_week),
        );
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const days = getDaysInMonth(year, month);
        const valid = new Set<number>();
        for (let d = 1; d <= days; d++) {
          const date = new Date(year, month, d);
          if (date >= today && openDays.has(date.getDay())) {
            valid.add(d);
          }
        }
        setAvailableDays(valid);
      })
      .catch(() => {
        if (!cancelled) setAvailableDays(new Set());
      })
      .finally(() => {
        if (!cancelled) setLoadingDays(false);
      });

    return () => {
      cancelled = true;
    };
  }, [salonId, currentMonth, today]);

  // ── Cargar slots al seleccionar fecha ───────────────────────────────────────
  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;
    const dateStr = formatDateKey(selectedDate);

    const load = async () => {
      setLoadingSlots(true);
      setIsClosed(false);
      try {
        const res = await fetch(
          `/api/appointments?salon_id=${salonId}&date=${dateStr}&service_id=${service.id}&offset=${timezoneOffset}`,
        );
        const data = await res.json();
        if (cancelled) return;

        if (data.closed) {
          setIsClosed(true);
          setSlots([]);
        } else {
          setSlots(data.slots || []);
        }
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, salonId, service.id, timezoneOffset]);

  // ── Selección de slot ───────────────────────────────────────────────────────
  function handleSlotSelect(slot: Slot) {
    if (!selectedDate || !slot.available) return;

    const y = selectedDate.getFullYear();
    const mo = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedDate.getDate()).padStart(2, "0");
    const [h, m] = slot.time.split(":").map(Number);
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");

    onSelect(
      `${y}-${mo}-${d}T${hh}:${mm}:00Z`,
      formatTimeDisplay(slot.time),
      formatDateDisplay(selectedDate),
    );
  }

  // ── Navegación de mes ───────────────────────────────────────────────────────
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const prevMonth = () => {
    setSelectedDate(null);
    setCurrentMonth(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setSelectedDate(null);
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const isPrevDisabled =
    currentMonth <= new Date(today.getFullYear(), today.getMonth(), 1);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Slots disponibles vs ocupados (para el contador)
  const availableSlots = slots.filter((s) => s.available).length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 20 }}
      >
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "1.625rem",
            fontWeight: 600,
            color: "#2D2420",
            lineHeight: 1.2,
            marginBottom: 4,
          }}
        >
          Elige fecha y hora
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "#9C8E85" }}>
          Los días disponibles están resaltados
        </p>
      </motion.div>

      {/* ── Calendario ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{
          borderRadius: 18,
          border: "1.5px solid #EDE8E3",
          backgroundColor: "#fff",
          padding: "18px 16px",
          marginBottom: 16,
        }}
      >
        {/* Navegación de mes */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <button
            onClick={prevMonth}
            disabled={isPrevDisabled}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              border: "1.5px solid #EDE8E3",
              backgroundColor: isPrevDisabled ? "transparent" : "#FAF8F5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isPrevDisabled ? "not-allowed" : "pointer",
              opacity: isPrevDisabled ? 0.3 : 1,
              transition: "all 0.15s",
            }}
          >
            <ChevronLeft size={15} style={{ color: "#9C8E85" }} />
          </button>

          {/* Mes y año */}
          <div style={{ textAlign: "center" }}>
            <span
              style={{
                fontSize: "0.9375rem",
                fontWeight: 700,
                color: "#2D2420",
              }}
            >
              {MONTHS_ES[month]}
            </span>
            <span
              style={{
                fontSize: "0.8125rem",
                fontWeight: 400,
                color: "#9C8E85",
                marginLeft: 6,
              }}
            >
              {year}
            </span>
          </div>

          <button
            onClick={nextMonth}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              border: "1.5px solid #EDE8E3",
              backgroundColor: "#FAF8F5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <ChevronRight size={15} style={{ color: "#9C8E85" }} />
          </button>
        </div>

        {/* Etiquetas de días de la semana */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            marginBottom: 8,
          }}
        >
          {DAYS_ES.map((d) => (
            <div
              key={d}
              style={{
                textAlign: "center",
                fontSize: "10px",
                fontWeight: 600,
                color: "#C4B8B0",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                padding: "4px 0",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid de días */}
        {loadingDays ? (
          <CalendarSkeleton />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "4px 0",
            }}
          >
            {/* Celdas vacías antes del primer día */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Días del mes */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const date = new Date(year, month, dayNum);
              const available = availableDays.has(dayNum);
              const isSelected =
                selectedDate?.getFullYear() === year &&
                selectedDate?.getMonth() === month &&
                selectedDate?.getDate() === dayNum;
              const isToday =
                date.getFullYear() === today.getFullYear() &&
                date.getMonth() === today.getMonth() &&
                date.getDate() === today.getDate();

              return (
                <button
                  key={dayNum}
                  onClick={() => available && setSelectedDate(date)}
                  disabled={!available}
                  style={{
                    aspectRatio: "1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    fontSize: "13px",
                    fontWeight: isSelected
                      ? 700
                      : isToday
                        ? 700
                        : available
                          ? 500
                          : 400,
                    cursor: available ? "pointer" : "not-allowed",
                    border:
                      isToday && !isSelected
                        ? `1.5px solid ${primaryColor}50`
                        : "1.5px solid transparent",
                    backgroundColor: isSelected ? primaryColor : "transparent",
                    color: isSelected
                      ? "#fff"
                      : available
                        ? "#2D2420"
                        : "#D4CFC9",
                    opacity: available ? 1 : 0.45,
                    transition: "all 0.15s",
                    position: "relative",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    if (available && !isSelected) {
                      e.currentTarget.style.backgroundColor = `${primaryColor}14`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  {dayNum}
                  {/* Punto indicador de disponibilidad */}
                  {available && !isSelected && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: 3,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        backgroundColor: primaryColor,
                        opacity: 0.5,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── Slots de hora ── */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={formatDateKey(selectedDate)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {/* Header de slots */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={13} style={{ color: "#9C8E85" }} />
                <span
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "#2D2420",
                    textTransform: "capitalize",
                  }}
                >
                  {formatDateDisplay(selectedDate)}
                </span>
              </div>

              {/* Contador de slots disponibles */}
              {!loadingSlots && !isClosed && slots.length > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    color: primaryColor,
                    backgroundColor: `${primaryColor}12`,
                    padding: "3px 10px",
                    borderRadius: 100,
                  }}
                >
                  {availableSlots}{" "}
                  {availableSlots === 1 ? "horario libre" : "horarios libres"}
                </motion.span>
              )}
            </div>

            {/* Contenido de slots */}
            {loadingSlots ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "24px 0",
                }}
              >
                <Loader2
                  size={20}
                  className="animate-spin"
                  style={{ color: "#C4B8B0" }}
                />
              </div>
            ) : isClosed || slots.length === 0 ? (
              <NoSlotsState isClosed={isClosed} primaryColor={primaryColor} />
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                }}
              >
                {slots.map((slot, idx) => (
                  <motion.button
                    key={slot.time}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03, duration: 0.2 }}
                    onClick={() => handleSlotSelect(slot)}
                    disabled={!slot.available}
                    whileHover={slot.available ? { scale: 1.04 } : {}}
                    whileTap={slot.available ? { scale: 0.97 } : {}}
                    style={{
                      padding: "10px 6px",
                      borderRadius: 12,
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      border: `1.5px solid ${slot.available ? `${primaryColor}50` : "#EDE8E3"}`,
                      backgroundColor: slot.available
                        ? `${primaryColor}08`
                        : "#FAF8F5",
                      color: slot.available ? primaryColor : "#C4B8B0",
                      opacity: slot.available ? 1 : 0.5,
                      cursor: slot.available ? "pointer" : "not-allowed",
                      transition: "all 0.15s",
                      fontFamily: "inherit",
                    }}
                  >
                    {formatTimeDisplay(slot.time)}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint cuando no hay fecha seleccionada */}
      {!selectedDate && !loadingDays && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            textAlign: "center",
            fontSize: "0.8125rem",
            color: "#C4B8B0",
            padding: "16px 0 8px",
          }}
        >
          👆 Toca un día para ver los horarios
        </motion.p>
      )}
    </div>
  );
}
