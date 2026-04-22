"use client";

// components/booking/TimeSlotPicker.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Loader2 } from "lucide-react";
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

interface BusinessHours {
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

// ─── Constantes y helpers de módulo ──────────────────────────────────────────
// Fuera del componente: no se recalculan en cada render y son idénticos
// en servidor y cliente → nunca causan hydration mismatch.

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

function generateTimeSlots(
  bh: BusinessHours,
  durationMinutes: number,
): string[] {
  const slots: string[] = [];
  const [openH, openM] = bh.open_time.split(":").map(Number);
  const [closeH, closeM] = bh.close_time.split(":").map(Number);
  const openTotal = openH * 60 + openM;
  const closeTotal = closeH * 60 + closeM;

  for (
    let t = openTotal;
    t + durationMinutes <= closeTotal;
    t += durationMinutes
  ) {
    const h = Math.floor(t / 60);
    const m = t % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return slots;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function TimeSlotPicker({
  salonId,
  service,
  primaryColor,
  onSelect,
}: TimeSlotPickerProps) {
  // today como lazy initializer de useState:
  // - Solo se ejecuta una vez, en el cliente
  // - BookingWidget lo carga con dynamic + ssr:false → nunca corre en servidor
  // - Valor estable entre renders → sin hydration mismatch
  const [today] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [currentMonth, setCurrentMonth] = useState<Date>(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingHours, setLoadingHours] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Cargar horarios del salón — una sola vez
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/business-hours?salon_id=${salonId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setBusinessHours(data.hours || []);
      })
      .catch(() => {
        if (!cancelled) setBusinessHours([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingHours(false);
      });
    return () => {
      cancelled = true;
    };
  }, [salonId]);

  // Cargar slots ocupados al cambiar fecha — con cleanup anti race-condition
  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;
    const dateStr = formatDateKey(selectedDate);

    const load = async () => {
      setLoadingSlots(true);
      try {
        const r = await fetch(
          `/api/appointments?salon_id=${salonId}&date=${dateStr}`,
        );
        const data = await r.json();
        if (!cancelled) setBookedSlots(data.booked || []);
      } catch {
        if (!cancelled) setBookedSlots([]);
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, salonId]);

  // ── Helpers que dependen de estado ─────────────────────────────────────────

  function getBusinessHoursForDay(date: Date): BusinessHours | null {
    return businessHours.find((bh) => bh.day_of_week === date.getDay()) ?? null;
  }

  function isDayAvailable(date: Date): boolean {
    if (date < today) return false;
    return !!getBusinessHoursForDay(date)?.is_open;
  }

  function isSlotBooked(timeStr: string): boolean {
    return bookedSlots.includes(timeStr);
  }

  function isSlotInPast(date: Date, timeStr: string): boolean {
    const [h, m] = timeStr.split(":").map(Number);
    const slotDate = new Date(date);
    slotDate.setHours(h, m, 0, 0);
    return slotDate <= new Date();
  }

  // ── Selección de slot ───────────────────────────────────────────────────────
  //
  // FIX TIMEZONE: ISO string construido manualmente con valores locales.
  // toISOString() restaría UTC-6 → guardaría 08:00 cuando el usuario eligió 14:00.
  // Con este approach "2026-04-23T14:00:00" llega a Supabase y se guarda como 14:00.

  function handleSlotSelect(timeStr: string) {
    if (!selectedDate) return;
    const y = selectedDate.getFullYear();
    const mo = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedDate.getDate()).padStart(2, "0");
    const [h, m] = timeStr.split(":").map(Number);
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");

    onSelect(
      `${y}-${mo}-${d}T${hh}:${mm}:00`,
      formatTimeDisplay(timeStr),
      formatDateDisplay(selectedDate),
    );
  }

  // ── Datos del calendario ────────────────────────────────────────────────────

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const isPrevDisabled =
    currentMonth <= new Date(today.getFullYear(), today.getMonth(), 1);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const selectedBH = selectedDate ? getBusinessHoursForDay(selectedDate) : null;
  const timeSlots = selectedBH
    ? generateTimeSlots(selectedBH, service.duration_minutes)
    : [];

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loadingHours) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="animate-spin text-[#C4B8B0]" size={24} />
      </div>
    );
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        <h2 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-[#2D2420]">
          Elige fecha y hora
        </h2>
        <p className="text-[#9C8E85] text-sm mt-1">
          Selecciona un día disponible
        </p>
      </motion.div>

      {/* Calendario */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-[#EDE8E3] bg-white p-4 mb-4"
      >
        {/* Navegación mes */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            disabled={isPrevDisabled}
            className="p-1.5 rounded-lg hover:bg-[#FAF8F5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} className="text-[#9C8E85]" />
          </button>
          <span className="text-sm font-semibold text-[#2D2420]">
            {MONTHS_ES[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-[#FAF8F5] transition-colors"
          >
            <ChevronRight size={16} className="text-[#9C8E85]" />
          </button>
        </div>

        {/* Etiquetas días */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS_ES.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-medium text-[#C4B8B0] py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid de días */}
        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const date = new Date(year, month, dayNum);
            const available = isDayAvailable(date);
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
                className="aspect-square flex items-center justify-center rounded-full text-xs font-medium transition-all duration-150 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isSelected ? primaryColor : "transparent",
                  color: isSelected
                    ? "#fff"
                    : available
                      ? "#2D2420"
                      : "#C4B8B0",
                  fontWeight: isToday && !isSelected ? 700 : undefined,
                  textDecoration:
                    isToday && !isSelected ? "underline" : undefined,
                  opacity: available ? 1 : 0.4,
                }}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Slots de hora */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={formatDateKey(selectedDate)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <Clock size={13} className="text-[#9C8E85]" />
              <span className="text-xs font-medium text-[#9C8E85]">
                Horarios disponibles — {formatDateDisplay(selectedDate)}
              </span>
            </div>

            {loadingSlots ? (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin text-[#C4B8B0]" size={20} />
              </div>
            ) : timeSlots.length === 0 ? (
              <p className="text-sm text-[#9C8E85] text-center py-4">
                No hay horarios disponibles este día.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot) => {
                  const disabled =
                    isSlotBooked(slot) || isSlotInPast(selectedDate, slot);
                  return (
                    <button
                      key={slot}
                      onClick={() => !disabled && handleSlotSelect(slot)}
                      disabled={disabled}
                      className="py-2.5 rounded-xl text-xs font-medium border transition-all duration-150 disabled:cursor-not-allowed"
                      style={{
                        borderColor: disabled ? "#EDE8E3" : primaryColor,
                        backgroundColor: disabled
                          ? "#FAF8F5"
                          : `${primaryColor}08`,
                        color: disabled ? "#C4B8B0" : primaryColor,
                        opacity: disabled ? 0.5 : 1,
                      }}
                    >
                      {formatTimeDisplay(slot)}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
