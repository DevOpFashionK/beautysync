"use client";

// components/dashboard/metrics/WeekdayHeatmap.tsx
//
// Heatmap de ocupación por día de semana.
// Muestra qué días del salón son históricamente más ocupados,
// calculado sobre los últimos 90 días de citas no canceladas.
//
// Diseño: barras horizontales con intensidad de color basada en primaryColor.
// No usa recharts — divs + CSS para control preciso del diseño.
//
// Props:
//   weekdayData  — array de 7 elementos (Lun→Dom) con { day, count, pct }
//   primaryColor — color de acento del salón
//   loading      — muestra skeleton si true
//
// Intensidad:
//   pct 0%        → fondo neutro #F3EDE8
//   pct 1–33%     → primaryColor 25% opacidad
//   pct 34–66%    → primaryColor 55% opacidad
//   pct 67–100%   → primaryColor 85% opacidad
//   Día con max   → primaryColor 100% + label en color

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface WeekdayDataPoint {
  /** Nombre corto del día — "Lun", "Mar", ..., "Dom" */
  day: string;
  /** Nombre completo — "Lunes", "Martes", etc. */
  dayFull: string;
  /** Total de citas en ese día de semana (últimos 90 días) */
  count: number;
  /** Porcentaje relativo al día más ocupado (0–100) */
  pct: number;
  /** true si es el día con más citas */
  isMax: boolean;
}

interface WeekdayHeatmapProps {
  weekdayData: WeekdayDataPoint[];
  primaryColor: string;
  loading?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convierte el pct (0–100) en un color con opacidad variable de primaryColor */
function barColor(pct: number, primaryColor: string, isMax: boolean): string {
  if (pct === 0) return "#F3EDE8";
  if (isMax) return primaryColor;
  if (pct >= 67) return `${primaryColor}D9`; // ~85%
  if (pct >= 34) return `${primaryColor}8C`; // ~55%
  return `${primaryColor}40`; // ~25%
}

/** Ancho mínimo visible aunque pct sea muy bajo */
function barWidth(pct: number): string {
  if (pct === 0) return "0%";
  return `${Math.max(pct, 6)}%`;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function HeatmapSkeleton() {
  const widths = ["72%", "45%", "88%", "60%", "95%", "38%", "20%"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.28 }}
      className="rounded-2xl p-6 animate-pulse"
      style={{ background: "#FFFFFF", border: "1px solid #EDE8E3" }}
    >
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div
            className="h-3 rounded-lg w-36 mb-2"
            style={{ background: "#F3EDE8" }}
          />
          <div
            className="h-6 rounded-lg w-24"
            style={{ background: "#F3EDE8" }}
          />
        </div>
        <div className="w-9 h-9 rounded-xl" style={{ background: "#F3EDE8" }} />
      </div>
      {/* Filas skeleton */}
      <div className="flex flex-col gap-3">
        {widths.map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="w-7 h-3 rounded-lg shrink-0"
              style={{ background: "#F3EDE8" }}
            />
            <div
              className="flex-1 h-7 rounded-lg"
              style={{ background: "#F3EDE8" }}
            >
              <div
                className="h-full rounded-lg"
                style={{ width: w, background: "#EDE8E3" }}
              />
            </div>
            <div
              className="w-4 h-3 rounded-lg shrink-0"
              style={{ background: "#F3EDE8" }}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function HeatmapEmpty({ primaryColor }: { primaryColor: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.28 }}
      className="rounded-2xl p-6 flex flex-col items-center justify-center py-16"
      style={{ background: "#FFFFFF", border: "1px solid #EDE8E3" }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ background: `${primaryColor}14` }}
      >
        <Flame size={18} strokeWidth={1.75} style={{ color: primaryColor }} />
      </div>
      <p
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "1.2rem",
          fontWeight: 500,
          color: "#9C8E85",
        }}
      >
        Sin datos aún
      </p>
      <p
        className="text-xs mt-1 text-center"
        style={{ color: "#C4B8B0", maxWidth: "18rem" }}
      >
        El heatmap mostrará tus días más ocupados cuando haya citas registradas.
      </p>
    </motion.div>
  );
}

// ─── Fila de un día ──────────────────────────────────────────────────────────

function DayRow({
  point,
  primaryColor,
  index,
}: {
  point: WeekdayDataPoint;
  primaryColor: string;
  index: number;
}) {
  const fillColor = barColor(point.pct, primaryColor, point.isMax);
  const trackColor = "#F3EDE8";
  const width = barWidth(point.pct);

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.28 + index * 0.04 }}
      className="flex items-center gap-3"
    >
      {/* Label día */}
      <p
        className="text-xs font-medium shrink-0 w-7 text-right"
        style={{
          color: point.isMax ? primaryColor : "#9C8E85",
          fontWeight: point.isMax ? 700 : 500,
        }}
      >
        {point.day}
      </p>

      {/* Track */}
      <div
        className="flex-1 rounded-lg overflow-hidden"
        style={{
          background: trackColor,
          height: "28px",
          position: "relative",
        }}
      >
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width }}
          transition={{
            duration: 0.6,
            delay: 0.32 + index * 0.05,
            ease: "easeOut",
          }}
          style={{
            height: "100%",
            background: fillColor,
            borderRadius: "0.5rem",
          }}
        />
        {/* Badge "Día más ocupado" solo en isMax */}
        {point.isMax && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Flame
              size={10}
              strokeWidth={2}
              style={{ color: "rgba(255,255,255,0.9)" }}
            />
            <span
              className="text-xs font-semibold"
              style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.65rem" }}
            >
              Más ocupado
            </span>
          </div>
        )}
      </div>

      {/* Conteo */}
      <p
        className="text-xs font-semibold shrink-0 w-5 text-right"
        style={{
          color: point.isMax ? primaryColor : "#B5A99F",
          fontWeight: point.isMax ? 700 : 500,
        }}
      >
        {point.count}
      </p>
    </motion.div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function WeekdayHeatmap({
  weekdayData,
  primaryColor,
  loading = false,
}: WeekdayHeatmapProps) {
  if (loading) return <HeatmapSkeleton />;

  const totalCitas = weekdayData.reduce((sum, d) => sum + d.count, 0);
  const hasData = totalCitas > 0;

  if (!hasData) return <HeatmapEmpty primaryColor={primaryColor} />;

  const maxDay = weekdayData.find((d) => d.isMax);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.28 }}
      className="rounded-2xl p-6"
      style={{ background: "#FFFFFF", border: "1px solid #EDE8E3" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p
            className="text-xs font-medium uppercase tracking-wider mb-1.5"
            style={{ color: "#9C8E85", letterSpacing: "0.08em" }}
          >
            Ocupación · últimos 90 días
          </p>
          {maxDay && (
            <p
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "1.5rem",
                fontWeight: 600,
                color: "#2D2420",
                lineHeight: 1,
                letterSpacing: "-0.01em",
              }}
            >
              {maxDay.dayFull}
            </p>
          )}
          <p className="text-xs mt-1" style={{ color: "#B5A99F" }}>
            es tu día más ocupado
          </p>
        </div>

        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${primaryColor}14` }}
        >
          <Flame size={16} strokeWidth={1.75} style={{ color: primaryColor }} />
        </div>
      </div>

      {/* Filas por día */}
      <div className="flex flex-col gap-2.5">
        {weekdayData.map((point, i) => (
          <DayRow
            key={point.day}
            point={point}
            primaryColor={primaryColor}
            index={i}
          />
        ))}
      </div>

      {/* Footer */}
      <p className="text-xs mt-5 text-right" style={{ color: "#C4B8B0" }}>
        Total: {totalCitas} citas en 90 días
      </p>
    </motion.div>
  );
}
