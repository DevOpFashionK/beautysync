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

// Fuera del componente — disponible en todo el módulo sin problemas de hoisting
function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function TimeSlotPicker({
  salonId,
  service,
  primaryColor,
  onSelect,
}: TimeSlotPickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingHours, setLoadingHours] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Cargar business hours una vez
  useEffect(() => {
    fetch(`/api/business-hours?salon_id=${salonId}`)
      .then((r) => r.json())
      .then((data) => setBusinessHours(data.hours || []))
      .catch(() => setBusinessHours([]))
      .finally(() => setLoadingHours(false));
  }, [salonId]);

  // Cargar slots ocupados cuando cambia la fecha seleccionada
  useEffect(() => {
    if (!selectedDate) return;
    const dateStr = formatDateKey(selectedDate);
    let cancelled = false;

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

  // ── Helpers ──────────────────────────────────────────────────────────────

  function getBusinessHoursForDay(date: Date): BusinessHours | null {
    const dow = date.getDay();
    return businessHours.find((bh) => bh.day_of_week === dow) ?? null;
  }

  function isDayAvailable(date: Date): boolean {
    if (date < today) return false;
    const bh = getBusinessHoursForDay(date);
    return !!bh?.is_open;
  }

  function generateTimeSlots(bh: BusinessHours): string[] {
    const slots: string[] = [];
    const [openH, openM] = bh.open_time.split(":").map(Number);
    const [closeH, closeM] = bh.close_time.split(":").map(Number);
    const openTotal = openH * 60 + openM;
    const closeTotal = closeH * 60 + closeM;
    const duration = service.duration_minutes;

    for (let t = openTotal; t + duration <= closeTotal; t += duration) {
      const h = Math.floor(t / 60);
      const m = t % 60;
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
    return slots;
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

  function formatTimeDisplay(timeStr: string): string {
    const [h, m] = timeStr.split(":").map(Number);
    const ampm = h >= 12 ? "pm" : "am";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  function formatDateDisplay(date: Date): string {
    const dayName = DAYS_FULL_ES[date.getDay()];
    const day = date.getDate();
    const month = MONTHS_ES[date.getMonth()];
    return `${dayName} ${day} de ${month}`;
  }

  // ── Slot selection ────────────────────────────────────────────────────────
  //
  // FIX TIMEZONE: Construimos el ISO string manualmente usando los valores
  // locales de fecha y hora directamente, sin pasar por toISOString() que
  // convertiría de local a UTC restando el offset (UTC-6 El Salvador).
  //
  // El resultado es un string tipo "2026-04-23T14:00:00" que Supabase
  // interpreta y guarda como 14:00 — exactamente lo que el usuario eligió.
  //
  function handleSlotSelect(timeStr: string) {
    if (!selectedDate) return;

    const y = selectedDate.getFullYear();
    const mo = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedDate.getDate()).padStart(2, "0");
    const [h, m] = timeStr.split(":").map(Number);
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");

    // ISO sin offset → Supabase lo guarda tal cual como hora local
    const isoString = `${y}-${mo}-${d}T${hh}:${mm}:00`;

    onSelect(
      isoString,
      formatTimeDisplay(timeStr),
      formatDateDisplay(selectedDate),
    );
  }

  // ── Calendar rendering ────────────────────────────────────────────────────

  function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 1).getDay();
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const isPrevDisabled =
    currentMonth <= new Date(today.getFullYear(), today.getMonth(), 1);

  // ── Render ────────────────────────────────────────────────────────────────

  if (loadingHours) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="animate-spin text-[#C4B8B0]" size={24} />
      </div>
    );
  }

  const selectedBH = selectedDate ? getBusinessHoursForDay(selectedDate) : null;
  const timeSlots = selectedBH ? generateTimeSlots(selectedBH) : [];

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

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-[#EDE8E3] bg-white p-4 mb-4"
      >
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            disabled={isPrevDisabled}
            className="p-1.5 rounded-lg hover:bg-[#FAF8F5] disabled:opacity-30
                       disabled:cursor-not-allowed transition-colors"
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

        {/* Day labels */}
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

        {/* Days grid */}
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
                className="aspect-square flex items-center justify-center rounded-full
                           text-xs font-medium transition-all duration-150
                           disabled:cursor-not-allowed"
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

      {/* Time slots */}
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
                  const booked = isSlotBooked(slot);
                  const past = isSlotInPast(selectedDate, slot);
                  const disabled = booked || past;

                  return (
                    <button
                      key={slot}
                      onClick={() => !disabled && handleSlotSelect(slot)}
                      disabled={disabled}
                      className="py-2.5 rounded-xl text-xs font-medium border transition-all duration-150
                                 disabled:cursor-not-allowed"
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
