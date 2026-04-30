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
  { index: 0, label: "Domingo", short: "Dom" },
  { index: 1, label: "Lunes", short: "Lun" },
  { index: 2, label: "Martes", short: "Mar" },
  { index: 3, label: "Miércoles", short: "Mié" },
  { index: 4, label: "Jueves", short: "Jue" },
  { index: 5, label: "Viernes", short: "Vie" },
  { index: 6, label: "Sábado", short: "Sáb" },
];

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

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  surface: "#0E0C0B",
  surface2: "#131110",
  border: "rgba(255,255,255,0.055)",
  borderMid: "rgba(255,255,255,0.09)",
  textPrimary: "rgba(245,242,238,0.88)",
  textMid: "rgba(245,242,238,0.45)",
  textDim: "rgba(245,242,238,0.18)",
  roseDim: "rgba(255,45,85,0.55)",
  roseGhost: "rgba(255,45,85,0.08)",
  roseBorder: "rgba(255,45,85,0.22)",
};

export default function BusinessHoursConfig({
  salonId,
  primaryColor,
}: BusinessHoursConfigProps) {
  const [hours, setHours] = useState<DayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Cargar horarios ────────────────────────────────────────────────────────
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
      setHours(
        data.map((row) => ({
          day_of_week: row.day_of_week,
          is_open: row.is_open,
          open_time: row.open_time.slice(0, 5),
          close_time: row.close_time.slice(0, 5),
        })),
      );
      setLoading(false);
    }
    load();
  }, [salonId]);

  const toggleDay = (dayIndex: number) => {
    setHours((prev) =>
      prev.map((h) =>
        h.day_of_week === dayIndex ? { ...h, is_open: !h.is_open } : h,
      ),
    );
  };

  const updateTime = (
    dayIndex: number,
    field: "open_time" | "close_time",
    value: string,
  ) => {
    setHours((prev) =>
      prev.map((h) =>
        h.day_of_week === dayIndex ? { ...h, [field]: value } : h,
      ),
    );
  };

  // ── Guardar — lógica intacta ───────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
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
          { onConflict: "salon_id,day_of_week" },
        );
      if (upsertError) throw upsertError;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Error al guardar. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 0",
        }}
      >
        <Loader2
          size={20}
          className="animate-spin"
          style={{ color: T.textDim }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "5px",
            background: `${primaryColor}12`,
            border: `1px solid ${primaryColor}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Clock
            size={11}
            strokeWidth={1.75}
            style={{ color: `${primaryColor}CC` }}
          />
        </div>
        <h2
          style={{
            fontSize: "12px",
            fontWeight: 400,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: T.textMid,
            margin: 0,
          }}
        >
          Horarios de atención
        </h2>
      </div>

      <p
        style={{
          fontSize: "12px",
          color: T.textDim,
          marginTop: "-10px",
          lineHeight: 1.65,
          letterSpacing: "0.02em",
        }}
      >
        Activa los días que atiendes y define tu horario. Los días desactivados
        no aparecerán disponibles para reservas.
      </p>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.18)",
            borderRadius: "8px",
            padding: "10px 14px",
          }}
        >
          <p style={{ fontSize: "12px", color: "rgba(252,165,165,0.85)" }}>
            {error}
          </p>
        </motion.div>
      )}

      {/* Days list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {DAYS.map((day, i) => {
          const config = hours.find((h) => h.day_of_week === day.index);
          if (!config) return null;
          const isOpen = config.is_open;

          return (
            <motion.div
              key={day.index}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                borderRadius: "8px",
                border: `1px solid ${isOpen ? T.borderMid : T.border}`,
                background: isOpen ? T.surface : "rgba(255,255,255,0.015)",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                }}
              >
                {/* Toggle */}
                <button
                  onClick={() => toggleDay(day.index)}
                  style={{
                    position: "relative",
                    flexShrink: 0,
                    width: "36px",
                    height: "20px",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: isOpen
                      ? primaryColor
                      : "rgba(255,255,255,0.08)",
                    transition: "background 0.25s",
                    outline: "none",
                    padding: 0,
                  }}
                >
                  <motion.span
                    layout
                    style={{
                      position: "absolute",
                      top: "2px",
                      width: "16px",
                      height: "16px",
                      background: "#fff",
                      borderRadius: "50%",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                    }}
                    animate={{ left: isOpen ? "calc(100% - 18px)" : "2px" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>

                {/* Nombre del día */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 400,
                      color: isOpen ? T.textPrimary : T.textDim,
                      transition: "color 0.2s",
                    }}
                  >
                    {day.label}
                  </span>
                  {!isOpen && (
                    <span
                      style={{
                        marginLeft: "8px",
                        fontSize: "10px",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: T.textDim,
                      }}
                    >
                      Cerrado
                    </span>
                  )}
                </div>

                {/* Selectores de hora */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        overflow: "hidden",
                      }}
                    >
                      <select
                        value={config.open_time}
                        onChange={(e) =>
                          updateTime(day.index, "open_time", e.target.value)
                        }
                        style={{
                          fontSize: "11px",
                          border: `1px solid ${T.borderMid}`,
                          borderRadius: "6px",
                          padding: "5px 8px",
                          color: T.textMid,
                          background: T.surface2,
                          outline: "none",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {TIME_OPTIONS.map((opt) => (
                          <option
                            key={opt.value}
                            value={opt.value}
                            style={{ background: "#131110" }}
                          >
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      <span
                        style={{
                          fontSize: "10px",
                          color: T.textDim,
                          flexShrink: 0,
                        }}
                      >
                        a
                      </span>

                      <select
                        value={config.close_time}
                        onChange={(e) =>
                          updateTime(day.index, "close_time", e.target.value)
                        }
                        style={{
                          fontSize: "11px",
                          border: `1px solid ${T.borderMid}`,
                          borderRadius: "6px",
                          padding: "5px 8px",
                          color: T.textMid,
                          background: T.surface2,
                          outline: "none",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {TIME_OPTIONS.map((opt) => (
                          <option
                            key={opt.value}
                            value={opt.value}
                            style={{ background: "#131110" }}
                          >
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
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            color: T.textDim,
            fontWeight: 400,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginRight: "2px",
          }}
        >
          Plantilla:
        </span>
        {[
          {
            label: "Lun – Sáb",
            fn: () =>
              setHours((p) =>
                p.map((h) => ({ ...h, is_open: h.day_of_week !== 0 })),
              ),
          },
          {
            label: "Lun – Vie",
            fn: () =>
              setHours((p) =>
                p.map((h) => ({
                  ...h,
                  is_open: h.day_of_week >= 1 && h.day_of_week <= 5,
                })),
              ),
          },
          {
            label: "Todos los días",
            fn: () => setHours((p) => p.map((h) => ({ ...h, is_open: true }))),
          },
        ].map((preset) => (
          <button
            key={preset.label}
            onClick={preset.fn}
            style={{
              padding: "5px 12px",
              borderRadius: "6px",
              border: `1px solid ${T.border}`,
              background: "transparent",
              fontSize: "10px",
              letterSpacing: "0.06em",
              color: T.textDim,
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = T.borderMid;
              (e.currentTarget as HTMLElement).style.color = T.textMid;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = T.border;
              (e.currentTarget as HTMLElement).style.color = T.textDim;
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Guardar */}
      <motion.button
        onClick={handleSave}
        disabled={saving}
        whileHover={!saving ? { y: -1 } : {}}
        whileTap={!saving ? { scale: 0.99 } : {}}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "8px",
          border: `1px solid ${saved ? "rgba(52,211,153,0.25)" : T.roseBorder}`,
          background: saved ? "rgba(16,185,129,0.08)" : T.roseGhost,
          color: saved ? "rgba(52,211,153,0.85)" : T.roseDim,
          fontSize: "12px",
          fontWeight: 400,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          cursor: saving ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "7px",
          opacity: saving ? 0.5 : 1,
          transition: "all 0.2s",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => {
          if (!saving && !saved) {
            (e.currentTarget as HTMLElement).style.background =
              "rgba(255,45,85,0.14)";
            (e.currentTarget as HTMLElement).style.borderColor =
              "rgba(255,45,85,0.4)";
            (e.currentTarget as HTMLElement).style.color = "#FF2D55";
          }
        }}
        onMouseLeave={(e) => {
          if (!saving && !saved) {
            (e.currentTarget as HTMLElement).style.background = T.roseGhost;
            (e.currentTarget as HTMLElement).style.borderColor = T.roseBorder;
            (e.currentTarget as HTMLElement).style.color = T.roseDim;
          }
        }}
      >
        {saving ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Guardando…
          </>
        ) : saved ? (
          <>
            <CheckCircle size={14} /> ¡Guardado!
          </>
        ) : (
          <>
            <Save size={14} /> Guardar horarios
          </>
        )}
      </motion.button>
    </div>
  );
}
