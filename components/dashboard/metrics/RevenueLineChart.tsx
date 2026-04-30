"use client";

// components/dashboard/metrics/RevenueLineChart.tsx
// Ingresos acumulados día a día — mes actual vs mes anterior. Recharts intacto.

import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DailyRevenuePoint {
  day: number;
  dayLabel: string;
  cumulativeCurrent: number;
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

// ─── Tooltip Dark ─────────────────────────────────────────────────────────────

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
      style={{
        background: "#0E0C0B",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "10px",
        padding: "14px 16px",
        minWidth: "180px",
      }}
    >
      <p
        style={{
          fontSize: "10px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(245,242,238,0.25)",
          marginBottom: "12px",
        }}
      >
        Día {label}
      </p>

      {/* Mes actual */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: primaryColor,
            flexShrink: 0,
          }}
        />
        <div>
          <p
            style={{
              fontSize: "10px",
              color: "rgba(245,242,238,0.25)",
              margin: 0,
            }}
          >
            {currentMonth}
          </p>
          <p
            style={{
              fontFamily:
                "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "1.2rem",
              fontWeight: 300,
              color: "rgba(245,242,238,0.85)",
              lineHeight: 1,
              margin: 0,
            }}
          >
            {formatCurrency(current)}
          </p>
        </div>
      </div>

      {/* Mes anterior */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "rgba(245,242,238,0.2)",
            flexShrink: 0,
          }}
        />
        <div>
          <p
            style={{
              fontSize: "10px",
              color: "rgba(245,242,238,0.25)",
              margin: 0,
            }}
          >
            {previousMonth}
          </p>
          <p
            style={{
              fontFamily:
                "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "1.2rem",
              fontWeight: 300,
              color: "rgba(245,242,238,0.4)",
              lineHeight: 1,
              margin: 0,
            }}
          >
            {formatCurrency(previous)}
          </p>
        </div>
      </div>

      {/* Diferencia */}
      {previous > 0 && (
        <div
          style={{
            fontSize: "11px",
            padding: "4px 10px",
            borderRadius: "20px",
            background: isAhead
              ? "rgba(16,185,129,0.1)"
              : "rgba(239,68,68,0.1)",
            color: isAhead ? "rgba(52,211,153,0.85)" : "rgba(252,165,165,0.85)",
            border: `1px solid ${isAhead ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
          }}
        >
          {isAhead ? "▲" : "▼"} {formatCurrency(Math.abs(diff))} vs mes anterior
        </div>
      )}
    </div>
  );
}

// ─── Leyenda Dark ─────────────────────────────────────────────────────────────

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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginTop: "10px",
        justifyContent: "flex-end",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div
          style={{
            width: "20px",
            height: "1.5px",
            background: primaryColor,
            borderRadius: "2px",
          }}
        />
        <span
          style={{
            fontSize: "10px",
            color: "rgba(245,242,238,0.3)",
            letterSpacing: "0.04em",
          }}
        >
          {currentMonth}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <svg width="20" height="2" viewBox="0 0 20 2">
          <line
            x1="0"
            y1="1"
            x2="20"
            y2="1"
            stroke="rgba(245,242,238,0.18)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
        </svg>
        <span
          style={{
            fontSize: "10px",
            color: "rgba(245,242,238,0.25)",
            letterSpacing: "0.04em",
          }}
        >
          {previousMonth}
        </span>
      </div>
    </div>
  );
}

// ─── Skeleton Dark ────────────────────────────────────────────────────────────

function LineChartSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.24 }}
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
              width: "160px",
              borderRadius: "4px",
              background: "rgba(255,255,255,0.04)",
              marginBottom: "8px",
            }}
          />
          <div
            style={{
              height: "24px",
              width: "80px",
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
      <div style={{ position: "relative", height: "160px" }}>
        <svg
          viewBox="0 0 300 100"
          style={{ width: "100%", height: "100%" }}
          preserveAspectRatio="none"
        >
          <path
            d="M0,80 C30,75 60,60 90,50 C120,40 150,30 180,25 C210,20 240,15 300,10"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M0,90 C30,85 60,80 90,72 C120,65 150,58 180,52 C210,46 240,40 300,35"
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1.5"
            strokeDasharray="5 3"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
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

function LineChartEmpty({ primaryColor }: { primaryColor: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.24 }}
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
        Sin ingresos aún
      </p>
      <p
        style={{
          fontSize: "11px",
          color: "rgba(245,242,238,0.15)",
          textAlign: "center",
          maxWidth: "18rem",
        }}
      >
        El gráfico aparecerá cuando haya citas completadas este mes.
      </p>
    </motion.div>
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

  const lastPoint = [...dailyData]
    .reverse()
    .find((d) => d.cumulativeCurrent > 0);
  const totalCurrent = lastPoint?.cumulativeCurrent ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.24 }}
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
          marginBottom: "4px",
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
            Ingresos acumulados · {currentMonth}
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
            {formatCurrency(totalCurrent)}
          </p>
          <p
            style={{
              fontSize: "11px",
              marginTop: "4px",
              color: "rgba(245,242,238,0.2)",
            }}
          >
            acumulado hasta hoy
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

      <CustomLegend
        primaryColor={primaryColor}
        currentMonth={currentMonth}
        previousMonth={previousMonth}
      />

      {/* Gráfico */}
      <div style={{ marginTop: "16px" }}>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart
            data={dailyData}
            margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="rgba(255,255,255,0.04)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="dayLabel"
              tick={{
                fontSize: 11,
                fill: "rgba(245,242,238,0.2)",
                fontFamily: "inherit",
              }}
              axisLine={false}
              tickLine={false}
              dy={6}
              interval={4}
            />
            <YAxis
              tickFormatter={(v) => `$${v}`}
              tick={{
                fontSize: 11,
                fill: "rgba(245,242,238,0.15)",
                fontFamily: "inherit",
              }}
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
              cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }}
            />
            {/* Mes anterior — punteada */}
            <Line
              type="monotone"
              dataKey="cumulativePrevious"
              stroke="rgba(245,242,238,0.18)"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{
                r: 3,
                fill: "rgba(245,242,238,0.3)",
                strokeWidth: 0,
              }}
            />
            {/* Mes actual — sólida */}
            <Line
              type="monotone"
              dataKey="cumulativeCurrent"
              stroke={primaryColor}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                fill: primaryColor,
                strokeWidth: 2,
                stroke: "#080706",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
