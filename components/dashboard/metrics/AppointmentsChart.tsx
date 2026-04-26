"use client";

// components/dashboard/metrics/AppointmentsChart.tsx
//
// Gráfica de barras: citas agendadas por semana (últimas 8 semanas).
// Recibe datos ya procesados desde el Server Component — no hace fetch propio.
//
// Diseño: sistema dashboard (Tailwind v4, paleta cálida, rounded-2xl)
// Recharts: BarChart responsive con tooltip personalizado y eje X con labels
// de semana legibles ("Sem 14", "Sem 15", etc. — o "Esta sem" para la actual).
//
// Props:
//   weeklyData  — array de { weekLabel, citas, ingresos } (8 semanas, más antigua → más reciente)
//   primaryColor — color de acento del salón (usado en las barras)
//   loading     — muestra skeleton si true

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface WeeklyDataPoint {
  /** Label corto para el eje X: "Sem 14", "Esta sem" */
  weekLabel: string;
  /** Semana ISO (YYYY-Www) — usado como key único */
  weekKey: string;
  /** Total de citas en esa semana (no canceladas) */
  citas: number;
  /** Ingresos estimados de citas completadas/confirmadas */
  ingresos: number;
  /** true si es la semana actual — recibe color más saturado */
  isCurrent: boolean;
}

interface AppointmentsChartProps {
  weeklyData: WeeklyDataPoint[];
  primaryColor: string;
  loading?: boolean;
}

// ─── Tooltip personalizado ────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: WeeklyDataPoint }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;

  const dollars = Math.floor(data.ingresos);
  const cents = Math.round((data.ingresos - dollars) * 100);
  const revenue = `$${dollars}.${String(cents).padStart(2, "0")}`;

  return (
    <div
      className="rounded-xl px-4 py-3 shadow-lg"
      style={{
        background: "#FFFFFF",
        border: "1px solid #EDE8E3",
        minWidth: "140px",
      }}
    >
      <p
        className="text-xs font-semibold mb-2"
        style={{ color: "#9C8E85", letterSpacing: "0.06em" }}
      >
        {label}
      </p>
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-1.5">
          <span
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "1.5rem",
              fontWeight: 600,
              color: "#2D2420",
              lineHeight: 1,
            }}
          >
            {data.citas}
          </span>
          <span className="text-xs" style={{ color: "#B5A99F" }}>
            {data.citas === 1 ? "cita" : "citas"}
          </span>
        </div>
        <p className="text-xs font-medium" style={{ color: "#9C8E85" }}>
          {revenue} estimados
        </p>
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ChartSkeleton() {
  // 8 barras de altura aleatoria fija para el skeleton
  const heights = [40, 65, 55, 80, 45, 70, 60, 90];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className="rounded-2xl p-6 animate-pulse"
      style={{ background: "#FFFFFF", border: "1px solid #EDE8E3" }}
    >
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div
            className="h-3 rounded-lg w-32 mb-2"
            style={{ background: "#F3EDE8" }}
          />
          <div
            className="h-7 rounded-lg w-16"
            style={{ background: "#F3EDE8" }}
          />
        </div>
        <div className="w-9 h-9 rounded-xl" style={{ background: "#F3EDE8" }} />
      </div>
      {/* Barras skeleton */}
      <div className="flex items-end gap-2 h-36 px-2">
        {heights.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-lg"
            style={{ height: `${h}%`, background: "#F3EDE8" }}
          />
        ))}
      </div>
      {/* Eje X skeleton */}
      <div className="flex gap-2 mt-3 px-2">
        {heights.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-2.5 rounded-lg"
            style={{ background: "#F3EDE8" }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function ChartEmpty({ primaryColor }: { primaryColor: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className="rounded-2xl p-6 flex flex-col items-center justify-center py-16"
      style={{ background: "#FFFFFF", border: "1px solid #EDE8E3" }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ background: `${primaryColor}14` }}
      >
        <TrendingUp
          size={18}
          strokeWidth={1.75}
          style={{ color: primaryColor }}
        />
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
        La gráfica aparecerá cuando haya citas registradas.
      </p>
    </motion.div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AppointmentsChart({
  weeklyData,
  primaryColor,
  loading = false,
}: AppointmentsChartProps) {
  if (loading) return <ChartSkeleton />;

  const hasData = weeklyData.some((w) => w.citas > 0);
  if (!hasData) return <ChartEmpty primaryColor={primaryColor} />;

  const totalCitas = weeklyData.reduce((sum, w) => sum + w.citas, 0);

  // Semana actual: último elemento del array
  const currentWeek = weeklyData[weeklyData.length - 1];

  // Color de barra: semana actual usa primaryColor, resto usa versión más suave
  const barColorActive = primaryColor;
  const barColorInactive = `${primaryColor}55`; // ~33% opacidad

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
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
            Citas · últimas 8 semanas
          </p>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "1.9rem",
              fontWeight: 600,
              color: "#2D2420",
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {totalCitas}
          </p>
          <p className="text-xs mt-1" style={{ color: "#B5A99F" }}>
            Esta semana:{" "}
            <span style={{ color: primaryColor, fontWeight: 600 }}>
              {currentWeek.citas}
            </span>
          </p>
        </div>

        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${primaryColor}14` }}
        >
          <TrendingUp
            size={16}
            strokeWidth={1.75}
            style={{ color: primaryColor }}
          />
        </div>
      </div>

      {/* Gráfica */}
      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          data={weeklyData}
          margin={{ top: 4, right: 0, left: -28, bottom: 0 }}
          barCategoryGap="28%"
        >
          <CartesianGrid
            vertical={false}
            stroke="#EDE8E3"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="weekLabel"
            tick={{
              fontSize: 11,
              fill: "#B5A99F",
              fontFamily: "inherit",
            }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            allowDecimals={false}
            tick={{
              fontSize: 11,
              fill: "#C4B8B0",
              fontFamily: "inherit",
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "#FAF8F5", radius: 6 }}
          />
          <Bar dataKey="citas" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {weeklyData.map((entry) => (
              <Cell
                key={entry.weekKey}
                fill={entry.isCurrent ? barColorActive : barColorInactive}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
