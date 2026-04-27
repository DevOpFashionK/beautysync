"use client";

// components/dashboard/metrics/RevenueLineChart.tsx
//
// Gráfico de líneas: ingresos acumulados día a día del mes actual
// comparado con el mes anterior (línea punteada de referencia).
//
// Recibe datos ya procesados desde el Server Component — no hace fetch propio.
//
// Dos líneas:
//   - Mes actual   → línea sólida con primaryColor
//   - Mes anterior → línea punteada en gris (#C4B8B0)
//
// Props:
//   dailyData    — array de { day, currentRevenue, previousRevenue, cumulativeCurrent, cumulativePrevious }
//   primaryColor — color de acento del salón
//   currentMonth — nombre del mes actual ("Abril 2026")
//   loading      — muestra skeleton si true

import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DailyRevenuePoint {
  /** Día del mes: 1, 2, 3, ... 31 */
  day: number;
  /** Label para eje X: "1", "5", "10"... (solo cada 5 días para no saturar) */
  dayLabel: string;
  /** Ingresos acumulados del mes actual hasta este día */
  cumulativeCurrent: number;
  /** Ingresos acumulados del mes anterior hasta este día */
  cumulativePrevious: number;
}

interface RevenueLineChartProps {
  dailyData: DailyRevenuePoint[];
  primaryColor: string;
  currentMonth: string;
  previousMonth: string;
  loading?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Tooltip personalizado ────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
  primaryColor,
  currentMonth,
  previousMonth,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
  primaryColor: string;
  currentMonth: string;
  previousMonth: string;
}) {
  if (!active || !payload?.length) return null;

  const current =
    payload.find((p) => p.dataKey === "cumulativeCurrent")?.value ?? 0;
  const previous =
    payload.find((p) => p.dataKey === "cumulativePrevious")?.value ?? 0;
  const diff = current - previous;
  const isAhead = diff >= 0;

  return (
    <div
      className="rounded-xl px-4 py-3 shadow-lg"
      style={{
        background: "#FFFFFF",
        border: "1px solid #EDE8E3",
        minWidth: "180px",
      }}
    >
      <p
        className="text-xs font-semibold mb-3"
        style={{ color: "#9C8E85", letterSpacing: "0.06em" }}
      >
        Día {label}
      </p>

      {/* Mes actual */}
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: primaryColor }}
        />
        <div>
          <p className="text-xs" style={{ color: "#B5A99F" }}>
            {currentMonth}
          </p>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "1.2rem",
              fontWeight: 600,
              color: "#2D2420",
              lineHeight: 1,
            }}
          >
            {formatCurrency(current)}
          </p>
        </div>
      </div>

      {/* Mes anterior */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: "#C4B8B0" }}
        />
        <div>
          <p className="text-xs" style={{ color: "#B5A99F" }}>
            {previousMonth}
          </p>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "1.2rem",
              fontWeight: 600,
              color: "#9C8E85",
              lineHeight: 1,
            }}
          >
            {formatCurrency(previous)}
          </p>
        </div>
      </div>

      {/* Diferencia */}
      {previous > 0 && (
        <div
          className="text-xs font-semibold px-2 py-1 rounded-lg"
          style={{
            background: isAhead ? "#D1FAE5" : "#FEE2E2",
            color: isAhead ? "#065F46" : "#B91C1C",
          }}
        >
          {isAhead ? "▲" : "▼"} {formatCurrency(Math.abs(diff))} vs mes anterior
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function LineChartSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.24 }}
      className="rounded-2xl p-6 animate-pulse"
      style={{ background: "#FFFFFF", border: "1px solid #EDE8E3" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div
            className="h-3 rounded-lg w-40 mb-2"
            style={{ background: "#F3EDE8" }}
          />
          <div
            className="h-7 rounded-lg w-24"
            style={{ background: "#F3EDE8" }}
          />
        </div>
        <div className="w-9 h-9 rounded-xl" style={{ background: "#F3EDE8" }} />
      </div>
      {/* Líneas skeleton — simulan el gráfico */}
      <div className="relative h-44 px-2">
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "#EDE8E3" }}
        />
        {[25, 50, 75].map((pct) => (
          <div
            key={pct}
            className="absolute left-0 right-0 h-px"
            style={{ bottom: `${pct}%`, background: "#F3EDE8" }}
          />
        ))}
        {/* Línea curva simulada */}
        <svg
          viewBox="0 0 300 100"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0,80 C30,75 60,60 90,50 C120,40 150,30 180,25 C210,20 240,15 300,10"
            fill="none"
            stroke="#F3EDE8"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M0,90 C30,85 60,80 90,72 C120,65 150,58 180,52 C210,46 240,40 300,35"
            fill="none"
            stroke="#EDE8E3"
            strokeWidth="2"
            strokeDasharray="6 4"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {/* Eje X skeleton */}
      <div className="flex gap-4 mt-3 px-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-2.5 rounded-lg flex-1"
            style={{ background: "#F3EDE8" }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function LineChartEmpty({ primaryColor }: { primaryColor: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.24 }}
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
        Sin ingresos aún
      </p>
      <p
        className="text-xs mt-1 text-center"
        style={{ color: "#C4B8B0", maxWidth: "18rem" }}
      >
        El gráfico aparecerá cuando haya citas completadas este mes.
      </p>
    </motion.div>
  );
}

// ─── Leyenda personalizada ────────────────────────────────────────────────────

function CustomLegend({
  primaryColor,
  currentMonth,
  previousMonth,
}: {
  primaryColor: string;
  currentMonth: string;
  previousMonth: string;
}) {
  return (
    <div className="flex items-center gap-5 mt-3 justify-end">
      <div className="flex items-center gap-1.5">
        <div
          className="w-6 h-0.5 rounded-full"
          style={{ background: primaryColor }}
        />
        <span className="text-xs" style={{ color: "#9C8E85" }}>
          {currentMonth}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <svg width="24" height="2" viewBox="0 0 24 2">
          <line
            x1="0"
            y1="1"
            x2="24"
            y2="1"
            stroke="#C4B8B0"
            strokeWidth="2"
            strokeDasharray="5 3"
          />
        </svg>
        <span className="text-xs" style={{ color: "#9C8E85" }}>
          {previousMonth}
        </span>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function RevenueLineChart({
  dailyData,
  primaryColor,
  currentMonth,
  previousMonth,
  loading = false,
}: RevenueLineChartProps) {
  if (loading) return <LineChartSkeleton />;

  const hasData = dailyData.some(
    (d) => d.cumulativeCurrent > 0 || d.cumulativePrevious > 0,
  );
  if (!hasData) return <LineChartEmpty primaryColor={primaryColor} />;

  // Ingreso acumulado final del mes actual (último punto con datos)
  const lastPoint = [...dailyData]
    .reverse()
    .find((d) => d.cumulativeCurrent > 0);
  const totalCurrent = lastPoint?.cumulativeCurrent ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.24 }}
      className="rounded-2xl p-6"
      style={{ background: "#FFFFFF", border: "1px solid #EDE8E3" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <p
            className="text-xs font-medium uppercase tracking-wider mb-1.5"
            style={{ color: "#9C8E85", letterSpacing: "0.08em" }}
          >
            Ingresos acumulados · {currentMonth}
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
            {formatCurrency(totalCurrent)}
          </p>
          <p className="text-xs mt-1" style={{ color: "#B5A99F" }}>
            acumulado hasta hoy
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

      {/* Leyenda */}
      <CustomLegend
        primaryColor={primaryColor}
        currentMonth={currentMonth}
        previousMonth={previousMonth}
      />

      {/* Gráfico */}
      <div className="mt-4">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart
            data={dailyData}
            margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="#EDE8E3"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="dayLabel"
              tick={{ fontSize: 11, fill: "#B5A99F", fontFamily: "inherit" }}
              axisLine={false}
              tickLine={false}
              dy={6}
              interval={4}
            />
            <YAxis
              tickFormatter={(v) => `$${v}`}
              tick={{ fontSize: 11, fill: "#C4B8B0", fontFamily: "inherit" }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              content={
                <CustomTooltip
                  primaryColor={primaryColor}
                  currentMonth={currentMonth}
                  previousMonth={previousMonth}
                />
              }
              cursor={{ stroke: "#EDE8E3", strokeWidth: 1 }}
            />

            {/* Línea mes anterior — punteada, gris */}
            <Line
              type="monotone"
              dataKey="cumulativePrevious"
              stroke="#C4B8B0"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 4, fill: "#C4B8B0", strokeWidth: 0 }}
            />

            {/* Línea mes actual — sólida, primaryColor */}
            <Line
              type="monotone"
              dataKey="cumulativeCurrent"
              stroke={primaryColor}
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 5,
                fill: primaryColor,
                strokeWidth: 2,
                stroke: "#FFFFFF",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
