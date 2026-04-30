"use client";

// components/booking/TimeSlotPicker.tsx
// FIXES preservados:
// 1. timezoneOffset = new Date().getTimezoneOffset()
// 2. API GET retorna slots server-side
// 3. handleSlotSelect construye ISO con sufijo "Z"
// 4. dynamic() en BookingWidget, ssr:false

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

// ─── Constantes — intactas ────────────────────────────────────────────────────
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

// ─── Helpers — intactos ───────────────────────────────────────────────────────
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
  .tsp-header { margin-bottom: 20px; }

  .tsp-title {
    font-family: var(--font-display);
    font-size: 1.8rem;
    font-weight: 300;
    color: rgba(245,242,238,0.92);
    line-height: 1.1;
    margin-bottom: 5px;
    letter-spacing: -0.025em;
  }

  .tsp-subtitle {
    font-size: 13px;
    color: rgba(245,242,238,0.3);
    font-family: var(--font-body);
    letter-spacing: 0.02em;
    margin-bottom: 20px;
  }

  /* ── Calendario ── */
  .tsp-cal {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 18px 14px;
    margin-bottom: 20px;
  }

  .tsp-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .tsp-nav-btn {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }

  .tsp-nav-btn:hover:not(:disabled) {
    background: rgba(255,255,255,0.07);
    border-color: rgba(255,255,255,0.14);
  }

  .tsp-nav-btn:disabled { opacity: 0.2; cursor: not-allowed; }

  .tsp-month-name {
    font-size: 14px;
    font-weight: 500;
    color: rgba(245,242,238,0.85);
    font-family: var(--font-body);
  }

  .tsp-month-year {
    font-size: 12px;
    color: rgba(245,242,238,0.3);
    margin-left: 5px;
    font-family: var(--font-body);
  }

  .tsp-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
  }

  .tsp-day-label {
    text-align: center;
    font-size: 9px;
    font-weight: 600;
    color: rgba(245,242,238,0.2);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 4px 0 10px;
    font-family: var(--font-body);
  }

  .tsp-day-btn {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    border: 1.5px solid transparent;
    background: transparent;
    transition: all 0.15s;
    position: relative;
    font-family: var(--font-body);
    color: rgba(245,242,238,0.18);
  }

  .tsp-day-btn.available {
    color: rgba(245,242,238,0.78);
    font-weight: 600;
  }

  .tsp-day-btn.available:hover {
    background: rgba(255,255,255,0.07);
    color: rgba(245,242,238,0.95);
  }

  .tsp-day-btn.unavailable {
    cursor: not-allowed;
  }

  .tsp-day-btn.selected {
    color: #fff !important;
    font-weight: 700;
  }

  .tsp-dot {
    position: absolute;
    bottom: 3px;
    left: 50%;
    transform: translateX(-50%);
    width: 3px;
    height: 3px;
    border-radius: 50%;
    opacity: 0.5;
  }

  /* ── Slots ── */
  .tsp-slots-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .tsp-slots-date {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    color: rgba(245,242,238,0.65);
    text-transform: capitalize;
    font-family: var(--font-body);
    letter-spacing: 0.02em;
  }

  .tsp-slots-count {
    font-size: 10px;
    font-weight: 500;
    padding: 3px 10px;
    border-radius: 100px;
    font-family: var(--font-body);
    letter-spacing: 0.06em;
  }

  .tsp-slots-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 7px;
  }

  .tsp-slot-btn {
    padding: 10px 6px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 500;
    border: 1px solid transparent;
    cursor: pointer;
    font-family: var(--font-body);
    text-align: center;
    transition: all 0.15s;
    letter-spacing: 0.02em;
  }

  .tsp-slot-btn.available {
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.08);
    color: rgba(245,242,238,0.75);
  }

  .tsp-slot-btn.unavailable {
    background: transparent;
    border-color: rgba(255,255,255,0.03);
    color: rgba(245,242,238,0.15);
    cursor: not-allowed;
    text-decoration: line-through;
  }

  .tsp-hint {
    text-align: center;
    font-size: 12px;
    color: rgba(245,242,238,0.2);
    padding: 20px 0 8px;
    font-family: var(--font-body);
    letter-spacing: 0.04em;
  }

  .tsp-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 0;
    text-align: center;
  }

  .tsp-empty-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
  }

  .tsp-empty-text {
    font-size: 12px;
    color: rgba(245,242,238,0.3);
    line-height: 1.55;
    font-family: var(--font-body);
    letter-spacing: 0.02em;
  }

  @keyframes tsp-shimmer {
    0%   { opacity: 0.15; }
    50%  { opacity: 0.35; }
    100% { opacity: 0.15; }
  }

  .tsp-skeleton-cell {
    aspect-ratio: 1;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
    animation: tsp-shimmer 1.6s ease-in-out infinite;
  }
`;

// ─── Skeleton ─────────────────────────────────────────────────────────────────
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

// ─── No slots ─────────────────────────────────────────────────────────────────
function NoSlotsState({
  isClosed,
  primaryColor,
}: {
  isClosed: boolean;
  primaryColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="tsp-empty"
    >
      <div
        className="tsp-empty-icon"
        style={{ background: `${primaryColor}14` }}
      >
        <CalendarX
          size={16}
          strokeWidth={1.5}
          style={{ color: primaryColor, opacity: 0.6 }}
        />
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

  // ── Precargar días disponibles — lógica intacta ───────────────────────────
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

  // ── Cargar slots — lógica intacta ─────────────────────────────────────────
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

  // ── Selección de slot — lógica intacta (ISO con "Z") ─────────────────────
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

  // ── Navegación de mes ─────────────────────────────────────────────────────
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

  return (
    <>
      <style>{styles}</style>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="tsp-header"
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
            <ChevronLeft size={14} color="rgba(245,242,238,0.5)" />
          </button>
          <div>
            <span className="tsp-month-name">{MONTHS_ES[month]}</span>
            <span className="tsp-month-year">{year}</span>
          </div>
          <button onClick={nextMonth} className="tsp-nav-btn">
            <ChevronRight size={14} color="rgba(245,242,238,0.5)" />
          </button>
        </div>

        {/* Labels días */}
        <div className="tsp-grid">
          {DAYS_ES.map((d) => (
            <div key={d} className="tsp-day-label">
              {d}
            </div>
          ))}
        </div>

        {/* Grid días */}
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
                        ? `${primaryColor}45`
                        : "transparent",
                    boxShadow: isSelected
                      ? `0 0 14px ${primaryColor}45`
                      : "none",
                  }}
                >
                  {dayNum}
                  {available && !isSelected && (
                    <span
                      className="tsp-dot"
                      style={{ background: primaryColor }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── Slots ── */}
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
                <Clock
                  size={12}
                  strokeWidth={1.75}
                  style={{ color: primaryColor }}
                />
                {formatDateDisplay(selectedDate)}
              </div>
              {!loadingSlots && !isClosed && slots.length > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="tsp-slots-count"
                  style={{
                    color: primaryColor,
                    background: `${primaryColor}14`,
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
                  size={18}
                  className="animate-spin"
                  style={{ color: "rgba(245,242,238,0.25)" }}
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
                    transition={{ delay: idx * 0.022, duration: 0.18 }}
                    whileHover={slot.available ? { scale: 1.04 } : {}}
                    whileTap={slot.available ? { scale: 0.96 } : {}}
                    onClick={() => handleSlotSelect(slot)}
                    disabled={!slot.available}
                    className={`tsp-slot-btn ${slot.available ? "available" : "unavailable"}`}
                    onMouseEnter={(e) => {
                      if (!slot.available) return;
                      (e.currentTarget as HTMLElement).style.borderColor =
                        `${primaryColor}55`;
                      (e.currentTarget as HTMLElement).style.color =
                        primaryColor;
                      (e.currentTarget as HTMLElement).style.background =
                        `${primaryColor}10`;
                      (e.currentTarget as HTMLElement).style.boxShadow =
                        `0 0 12px ${primaryColor}20`;
                    }}
                    onMouseLeave={(e) => {
                      if (!slot.available) return;
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "rgba(255,255,255,0.08)";
                      (e.currentTarget as HTMLElement).style.color =
                        "rgba(245,242,238,0.75)";
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(255,255,255,0.04)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
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

      {/* Hint */}
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
