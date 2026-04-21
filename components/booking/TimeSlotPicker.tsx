"use client";

// components/booking/TimeSlotPicker.tsx
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Loader2, CalendarX, Ban } from "lucide-react";
import type { SlotData, SelectedService } from "@/types/booking.types";

interface TimeSlotPickerProps {
  salonId: string;
  service: SelectedService;
  primaryColor: string;
  onSelect: (datetime: string, displayTime: string, displayDate: string) => void;
}

interface DaySchedule {
  is_open: boolean;
  open_time: string;
  close_time: string;
}

type BusinessHoursMap = Record<number, DaySchedule>;

const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateDisplay(date: Date): string {
  const dayName = DAYS_ES[date.getDay()];
  const day = date.getDate();
  const month = MONTHS_ES[date.getMonth()];
  return `${dayName} ${day} de ${month}`;
}

export default function TimeSlotPicker({
  salonId,
  service,
  primaryColor,
  onSelect,
}: TimeSlotPickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [isClosed, setIsClosed] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Horarios del salón — se cargan una sola vez al montar
  const [businessHours, setBusinessHours] = useState<BusinessHoursMap>({});
  const [loadingHours, setLoadingHours] = useState(true);

  // ── Cargar business_hours al montar ──────────────────────────────────────
  useEffect(() => {
    async function fetchBusinessHours() {
      try {
        const res = await fetch(`/api/business-hours?salon_id=${salonId}`);
        if (!res.ok) return;
        const data = await res.json();
        // Convertir array a mapa por day_of_week para lookup O(1)
        const map: BusinessHoursMap = {};
        for (const row of data.hours) {
          map[row.day_of_week] = {
            is_open: row.is_open,
            open_time: row.open_time,
            close_time: row.close_time,
          };
        }
        setBusinessHours(map);
      } catch {
        // Si falla, el calendario funciona sin bloqueo visual
        // El API de slots igual valida server-side
      } finally {
        setLoadingHours(false);
      }
    }
    fetchBusinessHours();
  }, [salonId]);

  // ── Fetch slots para una fecha seleccionada ───────────────────────────────
  const fetchSlots = useCallback(
    async (date: Date) => {
      setLoadingSlots(true);
      setSlotsError(null);
      setSlots([]);
      setIsClosed(false);

      try {
        const dateStr = formatDateISO(date);
        const res = await fetch(
          `/api/appointments?salon_id=${salonId}&service_id=${service.id}&date=${dateStr}`
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "No se pudo cargar la disponibilidad");
        }

        const data = await res.json();

        if (data.closed) {
          setIsClosed(true);
          return;
        }

        setSlots(data.slots || []);
      } catch (err) {
        setSlotsError(err instanceof Error ? err.message : "Error al cargar horarios");
      } finally {
        setLoadingSlots(false);
      }
    },
    [salonId, service.id]
  );

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    fetchSlots(date);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const days = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const isPrevDisabled =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const maxDate = new Date(today);
  maxDate.setMonth(maxDate.getMonth() + 3);
  const isNextDisabled =
    viewYear > maxDate.getFullYear() ||
    (viewYear === maxDate.getFullYear() && viewMonth >= maxDate.getMonth());

  const availableSlots = slots.filter((s) => s.available);
  const hasClosedDays = Object.values(businessHours).some((h) => !h.is_open);

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
          {service.name} · {service.duration_minutes} min
        </p>
      </motion.div>

      {/* ── Calendar ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl border border-[#EDE8E3] p-4 mb-4"
      >
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            disabled={isPrevDisabled}
            className="w-8 h-8 rounded-lg flex items-center justify-center
                       text-[#9C8E85] hover:bg-[#FAF8F5] disabled:opacity-30
                       disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="font-['Cormorant_Garamond'] text-lg font-semibold text-[#2D2420]">
            {MONTHS_ES[viewMonth]} {viewYear}
          </span>

          <button
            onClick={handleNextMonth}
            disabled={isNextDisabled}
            className="w-8 h-8 rounded-lg flex items-center justify-center
                       text-[#9C8E85] hover:bg-[#FAF8F5] disabled:opacity-30
                       disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day headers — días cerrados aparecen más tenues */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS_ES.map((d, i) => {
            const dayClosed = businessHours[i] && !businessHours[i].is_open;
            return (
              <div
                key={d}
                className="text-center text-[10px] font-medium py-1"
                style={{ color: dayClosed ? "#E0D9D4" : "#C4B8B0" }}
              >
                {d}
              </div>
            );
          })}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {days.map((date) => {
            const isToday = formatDateISO(date) === formatDateISO(today);
            const isPast = date < today;
            const isFuture = date > maxDate;
            const isSelected =
              selectedDate && formatDateISO(date) === formatDateISO(selectedDate);

            // Verificar si ese día de la semana está cerrado en el salón
            const dayOfWeek = date.getDay();
            const schedule = businessHours[dayOfWeek];
            const isDayClosed = schedule ? !schedule.is_open : false;

            const isDisabled = isPast || isFuture || isDayClosed;

            return (
              <button
                key={date.toISOString()}
                onClick={() => !isDisabled && handleDateSelect(date)}
                disabled={isDisabled}
                title={isDayClosed ? "El salón no atiende este día" : undefined}
                className={`
                  relative w-full aspect-square rounded-xl text-xs font-medium
                  flex items-center justify-center transition-all duration-150
                  ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}
                  ${!isDisabled && !isSelected ? "hover:bg-[#FAF8F5] text-[#2D2420]" : ""}
                `}
                style={
                  isSelected
                    ? { backgroundColor: primaryColor, color: "#fff" }
                    : isDayClosed
                    ? { color: "#E0D9D4", textDecoration: "line-through" }
                    : isPast || isFuture
                    ? { color: "#C4B8B0" }
                    : isToday
                    ? { color: primaryColor, fontWeight: 700 }
                    : { color: "#2D2420" }
                }
              >
                {date.getDate()}

                {/* Punto indicador de hoy */}
                {isToday && !isSelected && !isDayClosed && (
                  <span
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Leyenda — solo si hay días cerrados configurados */}
        {hasClosedDays && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[#EDE8E3]">
            <span
              className="text-[10px] font-medium line-through"
              style={{ color: "#E0D9D4" }}
            >
              15
            </span>
            <span className="text-[10px] text-[#C4B8B0]">= Días no disponibles</span>
          </div>
        )}
      </motion.div>

      {/* ── Time Slots ── */}
      <AnimatePresence mode="wait">
        {!selectedDate && (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-[#9C8E85] text-sm py-6"
          >
            Selecciona una fecha para ver horarios disponibles
          </motion.p>
        )}

        {selectedDate && loadingSlots && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-8 text-[#9C8E85] text-sm"
          >
            <Loader2 size={16} className="animate-spin" style={{ color: primaryColor }} />
            Verificando disponibilidad...
          </motion.div>
        )}

        {/* Día cerrado */}
        {selectedDate && isClosed && !loadingSlots && (
          <motion.div
            key="closed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-8 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] flex items-center justify-center mb-3">
              <Ban size={22} className="text-[#C4B8B0]" />
            </div>
            <p className="text-[#2D2420] font-medium text-sm">Cerrado ese día</p>
            <p className="text-[#9C8E85] text-xs mt-1 leading-relaxed">
              El salón no atiende los{" "}
              <span className="font-medium">{DAYS_ES[selectedDate.getDay()]}s</span>.
              Por favor elige otra fecha.
            </p>
          </motion.div>
        )}

        {selectedDate && slotsError && !loadingSlots && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-6"
          >
            <p className="text-sm text-red-500">{slotsError}</p>
            <button
              onClick={() => selectedDate && fetchSlots(selectedDate)}
              className="mt-2 text-xs underline"
              style={{ color: primaryColor }}
            >
              Reintentar
            </button>
          </motion.div>
        )}

        {selectedDate && !loadingSlots && !slotsError && !isClosed && (
          <motion.div
            key="slots"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-xs font-medium text-[#9C8E85] mb-3 flex items-center gap-1.5">
              <Clock size={12} />
              {formatDateDisplay(selectedDate)} · {availableSlots.length} horarios disponibles
            </p>

            {availableSlots.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CalendarX size={28} className="text-[#C4B8B0] mb-2" />
                <p className="text-[#2D2420] font-medium text-sm">Sin disponibilidad</p>
                <p className="text-[#9C8E85] text-xs mt-1">Prueba con otra fecha</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {availableSlots.map((slot, i) => (
                  <motion.button
                    key={slot.datetime}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() =>
                      onSelect(slot.datetime, slot.time, formatDateDisplay(selectedDate))
                    }
                    className="py-2.5 rounded-xl border text-xs font-medium
                               transition-all duration-150 hover:shadow-sm"
                    style={{
                      borderColor: `${primaryColor}40`,
                      color: primaryColor,
                      backgroundColor: `${primaryColor}08`,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = primaryColor;
                      (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${primaryColor}08`;
                      (e.currentTarget as HTMLButtonElement).style.color = primaryColor;
                    }}
                  >
                    {slot.time}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}