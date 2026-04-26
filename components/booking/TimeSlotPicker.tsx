"use client";

// components/booking/TimeSlotPicker.tsx
// Fase 8.1 v2 — Calendario y slots adaptados a la estética oscura premium
//
// FIXES preservados del original:
// 1. offset = new Date().getTimezoneOffset() → el servidor calcula "hoy" correctamente
// 2. La API GET retorna slots con disponibilidad calculada server-side
// 3. handleSlotSelect construye el ISO con sufijo "Z" para Zod en route.ts
// 4. dynamic() en BookingWidget evita hydration mismatch (ssr: false)

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

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = `
  /* ── Header ── */
  .tsp-title {
    font-family: var(--font-cormorant), Georgia, serif;
    font-size: 1.75rem;
    font-weight: 600;
    color: rgba(245, 242, 238, 0.95);
    line-height: 1.15;
    margin-bottom: 4px;
    letter-spacing: -0.01em;
  }

  .tsp-subtitle {
    font-size: 13px;
    color: rgba(245, 242, 238, 0.4);
    font-family: var(--font-jakarta), sans-serif;
    margin-bottom: 20px;
  }

  /* ── Calendario ── */
  .tsp-cal {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    padding: 18px 16px;
    margin-bottom: 20px;
  }

  /* Navegación mes */
  .tsp-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }

  .tsp-nav-btn {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.04);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }

  .tsp-nav-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.18);
  }

  .tsp-nav-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }

  .tsp-month-label {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .tsp-month-name {
    font-size: 15px;
    font-weight: 700;
    color: rgba(245, 242, 238, 0.9);
    font-family: var(--font-jakarta), sans-serif;
  }

  .tsp-month-year {
    font-size: 13px;
    color: rgba(245, 242, 238, 0.35);
    font-family: var(--font-jakarta), sans-serif;
  }

  /* Grid de días */
  .tsp-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
  }

  .tsp-day-label {
    text-align: center;
    font-size: 10px;
    font-weight: 600;
    color: rgba(245, 242, 238, 0.25);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 4px 0 10px;
    font-family: var(--font-jakarta), sans-serif;
  }

  .tsp-day-btn {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: 1.5px solid transparent;
    background: transparent;
    transition: all 0.15s;
    position: relative;
    font-family: var(--font-jakarta), sans-serif;
  }

  .tsp-day-btn.available {
    color: rgba(245, 242, 238, 0.85);
    font-weight: 600;
  }

  .tsp-day-btn.available:hover {
    background: rgba(255, 255, 255, 0.07);
  }

  .tsp-day-btn.unavailable {
    color: rgba(245, 242, 238, 0.18);
    cursor: not-allowed;
  }

  .tsp-day-btn.today {
    font-weight: 700;
  }

  .tsp-day-btn.selected {
    color: #fff !important;
    font-weight: 700;
  }

  /* Punto indicador de disponibilidad */
  .tsp-dot {
    position: absolute;
    bottom: 3px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    border-radius: 50%;
    opacity: 0.55;
  }

  /* ── Slots ── */
  .tsp-slots-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .tsp-slots-date {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 600;
    color: rgba(245, 242, 238, 0.8);
    text-transform: capitalize;
    font-family: var(--font-jakarta), sans-serif;
  }

  .tsp-slots-count {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 100px;
    font-family: var(--font-jakarta), sans-serif;
  }

  .tsp-slots-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .tsp-slot-btn {
    padding: 10px 6px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    border: 1px solid transparent;
    transition: all 0.15s;
    cursor: pointer;
    font-family: var(--font-jakarta), sans-serif;
    text-align: center;
  }

  .tsp-slot-btn.available {
    background: rgba(255, 255, 255, 0.04);
  }

  .tsp-slot-btn.available:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .tsp-slot-btn.unavailable {
    background: transparent;
    opacity: 0.28;
    cursor: not-allowed;
  }

  /* Hint sin fecha seleccionada */
  .tsp-hint {
    text-align: center;
    font-size: 13px;
    color: rgba(245, 242, 238, 0.25);
    padding: 20px 0 8px;
    font-family: var(--font-jakarta), sans-serif;
  }

  /* Empty state */
  .tsp-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 0;
    text-align: center;
  }

  .tsp-empty-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2px;
  }

  .tsp-empty-text {
    font-size: 13px;
    color: rgba(245, 242, 238, 0.35);
    line-height: 1.5;
    font-family: var(--font-jakarta), sans-serif;
  }

  /* Skeleton */
  @keyframes tsp-shimmer {
    0%   { opacity: 0.3; }
    50%  { opacity: 0.6; }
    100% { opacity: 0.3; }
  }

  .tsp-skeleton-cell {
    aspect-ratio: 1;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.07);
    animation: tsp-shimmer 1.6s ease-in-out infinite;
  }
`;

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function CalendarSkeleton() {
  return (
    <div className="tsp-grid" style={{ gap: "4px 0" }}>
      {Array.from({ length: 35 }).map((_, i) => (
        <div
          key={i}
          className="tsp-skeleton-cell"
          style={{ animationDelay: `${(i % 7) * 0.05}s` }}
        />
      ))}
    </div>
  );
}

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
      className="tsp-empty"
    >
      <div
        className="tsp-empty-icon"
        style={{ background: `${primaryColor}14` }}
      >
        <CalendarX size={18} style={{ color: primaryColor, opacity: 0.6 }} />
      </div>
      <p className="tsp-empty-text">
        {isClosed
          ? "El salón no atiende este día."
          : "Sin horarios disponibles.\nPrueba con otro día."}
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

  // ── Precargar días disponibles ──────────────────────────────────────────────
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
          if (date >= today && openDays.has(date.getDay())) valid.add(d);
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
  const availableSlots = slots.filter((s) => s.available).length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{styles}</style>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="tsp-title">Elige fecha y hora</h2>
        <p className="tsp-subtitle">Los días disponibles están resaltados</p>
      </motion.div>

      {/* ── Calendario ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="tsp-cal"
      >
        {/* Navegación mes */}
        <div className="tsp-nav">
          <button
            onClick={prevMonth}
            disabled={isPrevDisabled}
            className="tsp-nav-btn"
          >
            <ChevronLeft size={15} color="rgba(245,242,238,0.6)" />
          </button>

          <div className="tsp-month-label">
            <span className="tsp-month-name">{MONTHS_ES[month]}</span>
            <span className="tsp-month-year">{year}</span>
          </div>

          <button onClick={nextMonth} className="tsp-nav-btn">
            <ChevronRight size={15} color="rgba(245,242,238,0.6)" />
          </button>
        </div>

        {/* Labels días de la semana */}
        <div className="tsp-grid">
          {DAYS_ES.map((d) => (
            <div key={d} className="tsp-day-label">
              {d}
            </div>
          ))}
        </div>

        {/* Grid de días */}
        {loadingDays ? (
          <CalendarSkeleton />
        ) : (
          <div className="tsp-grid" style={{ gap: "3px 0" }}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}

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
                  className={[
                    "tsp-day-btn",
                    available ? "available" : "unavailable",
                    isToday ? "today" : "",
                    isSelected ? "selected" : "",
                  ].join(" ")}
                  style={{
                    backgroundColor: isSelected ? primaryColor : "transparent",
                    borderColor:
                      isToday && !isSelected
                        ? `${primaryColor}50`
                        : "transparent",
                    boxShadow: isSelected
                      ? `0 0 16px ${primaryColor}40`
                      : "none",
                  }}
                >
                  {dayNum}
                  {/* Punto indicador */}
                  {available && !isSelected && (
                    <span
                      className="tsp-dot"
                      style={{ backgroundColor: primaryColor }}
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
            {/* Header slots */}
            <div className="tsp-slots-header">
              <div className="tsp-slots-date">
                <Clock size={13} style={{ color: primaryColor }} />
                {formatDateDisplay(selectedDate)}
              </div>

              {!loadingSlots && !isClosed && slots.length > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="tsp-slots-count"
                  style={{
                    color: primaryColor,
                    background: `${primaryColor}16`,
                  }}
                >
                  {availableSlots} libre{availableSlots !== 1 ? "s" : ""}
                </motion.span>
              )}
            </div>

            {/* Contenido */}
            {loadingSlots ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "24px 0",
                }}
              >
                <Loader2
                  size={20}
                  className="animate-spin"
                  style={{ color: "rgba(245,242,238,0.3)" }}
                />
              </div>
            ) : isClosed || slots.length === 0 ? (
              <NoSlotsState isClosed={isClosed} primaryColor={primaryColor} />
            ) : (
              <div className="tsp-slots-grid">
                {slots.map((slot, idx) => (
                  <motion.button
                    key={slot.time}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.025, duration: 0.18 }}
                    whileHover={slot.available ? { scale: 1.04 } : {}}
                    whileTap={slot.available ? { scale: 0.96 } : {}}
                    onClick={() => handleSlotSelect(slot)}
                    disabled={!slot.available}
                    className={`tsp-slot-btn ${slot.available ? "available" : "unavailable"}`}
                    style={{
                      borderColor: slot.available
                        ? `${primaryColor}40`
                        : "rgba(255,255,255,0.06)",
                      color: slot.available
                        ? primaryColor
                        : "rgba(245,242,238,0.25)",
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

      {/* Hint sin fecha seleccionada */}
      {!selectedDate && !loadingDays && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="tsp-hint"
        >
          👆 Toca un día para ver los horarios
        </motion.p>
      )}
    </>
  );
}
