"use client";

// components/dashboard/settings/BusinessHoursConfig.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2, Clock, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DayConfig {
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

interface BusinessHoursConfigProps {
  salonId: string;
  primaryColor: string;
}

const DAYS = [
  { index: 0, label: "Domingo",   short: "Dom" },
  { index: 1, label: "Lunes",     short: "Lun" },
  { index: 2, label: "Martes",    short: "Mar" },
  { index: 3, label: "Miércoles", short: "Mié" },
  { index: 4, label: "Jueves",    short: "Jue" },
  { index: 5, label: "Viernes",   short: "Vie" },
  { index: 6, label: "Sábado",    short: "Sáb" },
];

// Genera opciones de tiempo cada 30 minutos
function generateTimeOptions(): { value: string; label: string }[] {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const value = `${hh}:${mm}`;
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? "am" : "pm";
      const label = `${hour12}:${mm} ${ampm}`;
      options.push({ value, label });
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

export default function BusinessHoursConfig({
  salonId,
  primaryColor,
}: BusinessHoursConfigProps) {
  const [hours, setHours] = useState<DayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Cargar horarios actuales ──────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("business_hours")
        .select("day_of_week, is_open, open_time, close_time")
        .eq("salon_id", salonId)
        .order("day_of_week", { ascending: true });

      if (error || !data) {
        setError("No se pudieron cargar los horarios");
        setLoading(false);
        return;
      }

      // Normalizar open_time / close_time a "HH:MM" (Postgres devuelve "HH:MM:SS")
      setHours(
        data.map((row) => ({
          day_of_week: row.day_of_week,
          is_open: row.is_open,
          open_time: row.open_time.slice(0, 5),
          close_time: row.close_time.slice(0, 5),
        }))
      );
      setLoading(false);
    }
    load();
  }, [salonId]);

  // ── Helpers para mutar estado ────────────────────────────────────────────
  const toggleDay = (dayIndex: number) => {
    setHours((prev) =>
      prev.map((h) =>
        h.day_of_week === dayIndex ? { ...h, is_open: !h.is_open } : h
      )
    );
  };

  const updateTime = (
    dayIndex: number,
    field: "open_time" | "close_time",
    value: string
  ) => {
    setHours((prev) =>
      prev.map((h) =>
        h.day_of_week === dayIndex ? { ...h, [field]: value } : h
      )
    );
  };

  // ── Guardar ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      // Upsert todos los días en una sola operación
      const { error: upsertError } = await supabase
        .from("business_hours")
        .upsert(
          hours.map((h) => ({
            salon_id: salonId,
            day_of_week: h.day_of_week,
            is_open: h.is_open,
            open_time: h.open_time,
            close_time: h.close_time,
          })),
          { onConflict: "salon_id,day_of_week" }
        );

      if (upsertError) throw upsertError;

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError("Error al guardar. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 size={20} className="animate-spin text-[#C4B8B0]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}14` }}
        >
          <Clock size={11} style={{ color: primaryColor }} />
        </div>
        <h2 className="font-semibold text-[#2D2420] text-sm">
          Horarios de atención
        </h2>
      </div>

      <p className="text-xs text-[#9C8E85] -mt-3 leading-relaxed">
        Activa los días que atiendes y define tu horario. Los días desactivados
        no aparecerán disponibles para reservas.
      </p>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 rounded-xl px-4 py-3"
        >
          <p className="text-sm text-red-600">{error}</p>
        </motion.div>
      )}

      {/* Days list */}
      <div className="flex flex-col gap-2">
        {DAYS.map((day, i) => {
          const config = hours.find((h) => h.day_of_week === day.index);
          if (!config) return null;
          const isOpen = config.is_open;

          return (
            <motion.div
              key={day.index}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`
                rounded-2xl border transition-all duration-200
                ${isOpen
                  ? "bg-white border-[#EDE8E3]"
                  : "bg-[#FAF8F5] border-[#EDE8E3]"
                }
              `}
            >
              {/* Day row */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Toggle */}
                <button
                  onClick={() => toggleDay(day.index)}
                  className="relative shrink-0 w-10 h-5 rounded-full transition-all duration-300 focus:outline-none"
                  style={{
                    backgroundColor: isOpen ? primaryColor : "#EDE8E3",
                  }}
                >
                  <motion.span
                    layout
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                    animate={{ left: isOpen ? "calc(100% - 18px)" : "2px" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>

                {/* Day name */}
                <div className="flex-1 min-w-0">
                  <span
                    className="text-sm font-medium transition-colors duration-200"
                    style={{ color: isOpen ? "#2D2420" : "#C4B8B0" }}
                  >
                    {day.label}
                  </span>
                  {!isOpen && (
                    <span className="ml-2 text-xs text-[#C4B8B0]">
                      Cerrado
                    </span>
                  )}
                </div>

                {/* Time range — visible solo si está abierto */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-2 overflow-hidden"
                    >
                      {/* Open time */}
                      <select
                        value={config.open_time}
                        onChange={(e) =>
                          updateTime(day.index, "open_time", e.target.value)
                        }
                        className="text-xs border border-[#EDE8E3] rounded-lg px-2 py-1.5
                                   text-[#2D2420] bg-white outline-none cursor-pointer
                                   transition-colors hover:border-[#C4B8B0]"
                      >
                        {TIME_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      <span className="text-[10px] text-[#C4B8B0] shrink-0">a</span>

                      {/* Close time */}
                      <select
                        value={config.close_time}
                        onChange={(e) =>
                          updateTime(day.index, "close_time", e.target.value)
                        }
                        className="text-xs border border-[#EDE8E3] rounded-lg px-2 py-1.5
                                   text-[#2D2420] bg-white outline-none cursor-pointer
                                   transition-colors hover:border-[#C4B8B0]"
                      >
                        {TIME_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick presets */}
      <div className="flex flex-wrap gap-2">
        <span className="text-[10px] text-[#C4B8B0] font-medium self-center mr-1">
          Aplicar plantilla:
        </span>
        {[
          {
            label: "Lun – Sáb",
            fn: () =>
              setHours((prev) =>
                prev.map((h) => ({ ...h, is_open: h.day_of_week !== 0 }))
              ),
          },
          {
            label: "Lun – Vie",
            fn: () =>
              setHours((prev) =>
                prev.map((h) => ({
                  ...h,
                  is_open: h.day_of_week >= 1 && h.day_of_week <= 5,
                }))
              ),
          },
          {
            label: "Todos los días",
            fn: () =>
              setHours((prev) => prev.map((h) => ({ ...h, is_open: true }))),
          },
        ].map((preset) => (
          <button
            key={preset.label}
            onClick={preset.fn}
            className="px-3 py-1 rounded-lg border border-[#EDE8E3] text-[10px]
                       font-medium text-[#9C8E85] hover:text-[#2D2420]
                       hover:border-[#C4B8B0] transition-all duration-150 bg-white"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Save button */}
      <motion.button
        onClick={handleSave}
        disabled={saving}
        whileHover={!saving ? { scale: 1.01 } : {}}
        whileTap={!saving ? { scale: 0.99 } : {}}
        className="w-full py-3 rounded-xl font-semibold text-sm text-white
                   flex items-center justify-center gap-2
                   disabled:opacity-60 disabled:cursor-not-allowed
                   transition-opacity"
        style={{
          backgroundColor: primaryColor,
          boxShadow: `0 8px 24px ${primaryColor}25`,
        }}
      >
        {saving ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Guardando…
          </>
        ) : saved ? (
          <>
            <CheckCircle size={15} />
            ¡Guardado!
          </>
        ) : (
          <>
            <Save size={15} />
            Guardar horarios
          </>
        )}
      </motion.button>
    </div>
  );
}