"use client";

// components/dashboard/metrics/AppointmentsChart.tsx
// Gráfica de barras: citas por semana (últimas 8 semanas). Recharts intacto.

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
  weekLabel: string;
  weekKey: string;
  citas: number;
  ingresos: number;
  isCurrent: boolean;
}

interface AppointmentsChartProps {
  weeklyData: WeeklyDataPoint[];
  primaryColor: string;
  loading?: boolean;
}

// ─── Tooltip Dark Atelier ─────────────────────────────────────────────────────

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
      style={{
        background: "#0E0C0B",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "10px",
        padding: "12px 16px",
        minWidth: "130px",
      }}
    >
      <p
        style={{
          fontSize: "10px",
          letterSpacing: "0.1em",
          color: "rgba(245,242,238,0.3)",
          marginBottom: "8px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span
            style={{
              fontFamily:
                "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "1.5rem",
              fontWeight: 300,
              color: "rgba(245,242,238,0.88)",
              lineHeight: 1,
            }}
          >
            {data.citas}
          </span>
          <span style={{ fontSize: "11px", color: "rgba(245,242,238,0.3)" }}>
            {data.citas === 1 ? "cita" : "citas"}
          </span>
        </div>
        <p style={{ fontSize: "11px", color: "rgba(245,242,238,0.25)" }}>
          {revenue} estimados
        </p>
      </div>
    </div>
  );
}

// ─── Skeleton Dark ────────────────────────────────────────────────────────────

function ChartSkeleton() {
  const heights = [40, 65, 55, 80, 45, 70, 60, 90];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className="animate-pulse"
      style={{
        borderRadius: "10px",
        padding: "24px",
        background: "#0E0C0B",
        border: "1px solid rgba(255,255,255,0.055)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
        }}
      >
        <div>
          <div
            style={{
              height: "10px",
              width: "120px",
              borderRadius: "4px",
              background: "rgba(255,255,255,0.04)",
              marginBottom: "8px",
            }}
          />
          <div
            style={{
              height: "24px",
              width: "56px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.05)",
            }}
          />
        </div>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.04)",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "6px",
          height: "120px",
        }}
      >
        {heights.map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${h}%`,
              borderRadius: "4px 4px 0 0",
              background: "rgba(255,255,255,0.04)",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
        {heights.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: "8px",
              borderRadius: "4px",
              background: "rgba(255,255,255,0.03)",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Empty Dark ───────────────────────────────────────────────────────────────

function ChartEmpty({ primaryColor }: { primaryColor: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      style={{
        borderRadius: "10px",
        padding: "24px",
        background: "#0E0C0B",
        border: "1px solid rgba(255,255,255,0.055)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "56px",
        paddingBottom: "56px",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          background: `${primaryColor}12`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "14px",
        }}
      >
        <TrendingUp
          size={16}
          strokeWidth={1.75}
          style={{ color: `${primaryColor}99` }}
        />
      </div>
      <p
        style={{
          fontFamily:
            "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
          fontSize: "1.1rem",
          fontWeight: 300,
          color: "rgba(245,242,238,0.35)",
          marginBottom: "4px",
        }}
      >
        Sin datos aún
      </p>
      <p
        style={{
          fontSize: "11px",
          color: "rgba(245,242,238,0.15)",
          textAlign: "center",
          maxWidth: "18rem",
        }}
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
  const currentWeek = weeklyData[weeklyData.length - 1];
  const barColorActive = primaryColor;
  const barColorInactive = `${primaryColor}44`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      style={{
        borderRadius: "10px",
        padding: "24px",
        background: "#0E0C0B",
        border: "1px solid rgba(255,255,255,0.055)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "10px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(245,242,238,0.22)",
              marginBottom: "6px",
            }}
          >
            Citas · últimas 8 semanas
          </p>
          <p
            style={{
              fontFamily:
                "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "1.9rem",
              fontWeight: 300,
              color: "rgba(245,242,238,0.88)",
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}
          >
            {totalCitas}
          </p>
          <p
            style={{
              fontSize: "11px",
              marginTop: "4px",
              color: "rgba(245,242,238,0.2)",
            }}
          >
            Esta semana:{" "}
            <span style={{ color: `${primaryColor}CC`, fontWeight: 400 }}>
              {currentWeek.citas}
            </span>
          </p>
        </div>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: `${primaryColor}12`,
            border: `1px solid ${primaryColor}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <TrendingUp
            size={14}
            strokeWidth={1.75}
            style={{ color: `${primaryColor}CC` }}
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
            stroke="rgba(255,255,255,0.04)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="weekLabel"
            tick={{
              fontSize: 11,
              fill: "rgba(245,242,238,0.2)",
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
              fill: "rgba(245,242,238,0.15)",
              fontFamily: "inherit",
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(255,255,255,0.03)", radius: 4 }}
          />
          <Bar dataKey="citas" radius={[4, 4, 0, 0]} maxBarSize={36}>
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
