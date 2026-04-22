"use client";

// components/booking/TimeSlotPicker.tsx
//
// FIXES aplicados:
//
// 1. GET /api/appointments ahora incluye service_id en la query string.
//    Antes: /api/appointments?salon_id=&date=          → 400 Bad Request
//    Ahora: /api/appointments?salon_id=&date=&service_id= → 200 OK
//
// 2. La API GET ya retorna los slots completos con disponibilidad calculada
//    server-side (considerando business_hours + citas existentes + duración).
//    El widget ya NO genera slots localmente ni necesita /api/business-hours.
//    Antes: generateTimeSlots() local + fetch de booked → lógica duplicada
//    Ahora: un solo fetch a /api/appointments → usa slots que retorna la API
//
// 3. handleSlotSelect construye el ISO con sufijo "Z" explícito.
//    Zod .datetime() requiere formato ISO 8601 con Z o offset completo.
//    Antes: "2026-04-28T14:00:00"     → Zod rechaza → 422
//    Ahora: "2026-04-28T14:00:00Z"    → Zod acepta  → 201
//
//    NOTA TIMEZONE: La API guarda el datetime AS IS en Supabase (no convierte).
//    El sufijo Z es solo para pasar la validación Zod — el valor literal
//    "14:00" se preserva porque route.ts inserta sanitizedData.scheduled_at
//    directamente sin parsear con new Date(). parseISOLocal() en utils.ts
//    stripea el Z antes de leer hora/minutos, así que el dashboard
//    siempre muestra la hora correcta.

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

interface Slot {
  time: string; // "14:00"
  available: boolean;
  datetime: string; // ISO string que retorna la API (no se usa directamente)
}

// ─── Constantes de módulo ─────────────────────────────────────────────────────

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

// ─── Componente ───────────────────────────────────────────────────────────────

export default function TimeSlotPicker({
  salonId,
  service,
  primaryColor,
  onSelect,
}: TimeSlotPickerProps) {
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
  // Días disponibles del mes visible — para deshabilitar días sin horario
  const [availableDays, setAvailableDays] = useState<Set<number>>(new Set());
  const [loadingDays, setLoadingDays] = useState(true);

  // Precargar qué días del mes visible tienen slots disponibles
  // Hacemos un fetch por cada día del mes para saber si está abierto.
  // Usamos /api/business-hours que es liviano (no consulta citas).
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
        // Calcular qué días del mes son válidos (no pasados + día abierto)
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

  // Cargar slots cuando cambia la fecha seleccionada
  // FIX: incluir service_id en la query — la API lo requiere para calcular
  // la duración y verificar conflictos correctamente.
  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;
    const dateStr = formatDateKey(selectedDate);

    const load = async () => {
      setLoadingSlots(true);
      setIsClosed(false);
      try {
        const res = await fetch(
          `/api/appointments?salon_id=${salonId}&date=${dateStr}&service_id=${service.id}`,
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
  }, [selectedDate, salonId, service.id]);

  // ── Selección de slot ───────────────────────────────────────────────────────
  //
  // FIX TIMEZONE + ZOD:
  // Construimos el ISO string manualmente con los valores locales del usuario
  // y agregamos "Z" al final para satisfacer la validación Zod .datetime().
  //
  // "Z" técnicamente significa UTC, pero route.ts inserta scheduled_at
  // directamente en Supabase sin pasarlo por new Date() — por lo tanto
  // el valor literal "14:00:00Z" se guarda tal cual como "14:00:00+00".
  // parseISOLocal() en utils.ts stripea el Z antes de extraer la hora,
  // así que el dashboard siempre muestra "02:00 pm" para las 14:00.
  //
  // Resultado en Supabase: "2026-04-28 14:00:00+00" ✅
  // Dashboard muestra: "02:00 pm" ✅

  function handleSlotSelect(slot: Slot) {
    if (!selectedDate || !slot.available) return;

    const y = selectedDate.getFullYear();
    const mo = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedDate.getDate()).padStart(2, "0");
    const [h, m] = slot.time.split(":").map(Number);
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");

    // "Z" al final satisface Zod .datetime() y el valor literal se preserva
    const isoString = `${y}-${mo}-${d}T${hh}:${mm}:00Z`;

    onSelect(
      isoString,
      formatTimeDisplay(slot.time),
      formatDateDisplay(selectedDate),
    );
  }

  // ── Datos del calendario ────────────────────────────────────────────────────

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

  // ── Render ──────────────────────────────────────────────────────────────────

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
            const available = !loadingDays && availableDays.has(dayNum);
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
            ) : isClosed ? (
              <p className="text-sm text-[#9C8E85] text-center py-4">
                El salón no atiende este día.
              </p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-[#9C8E85] text-center py-4">
                No hay horarios disponibles este día.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => handleSlotSelect(slot)}
                    disabled={!slot.available}
                    className="py-2.5 rounded-xl text-xs font-medium border transition-all duration-150 disabled:cursor-not-allowed"
                    style={{
                      borderColor: !slot.available ? "#EDE8E3" : primaryColor,
                      backgroundColor: !slot.available
                        ? "#FAF8F5"
                        : `${primaryColor}08`,
                      color: !slot.available ? "#C4B8B0" : primaryColor,
                      opacity: !slot.available ? 0.5 : 1,
                    }}
                  >
                    {formatTimeDisplay(slot.time)}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
