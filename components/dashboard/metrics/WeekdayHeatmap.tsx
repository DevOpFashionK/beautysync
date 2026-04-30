"use client";

// components/dashboard/metrics/WeekdayHeatmap.tsx
// Heatmap de ocupación por día de semana — barras horizontales SVG. Lógica intacta.

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface WeekdayDataPoint {
  day: string;
  dayFull: string;
  count: number;
  pct: number;
  isMax: boolean;
}

interface WeekdayHeatmapProps {
  weekdayData: WeekdayDataPoint[];
  primaryColor: string;
  loading?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function barColor(pct: number, primaryColor: string, isMax: boolean): string {
  if (pct === 0) return "rgba(255,255,255,0.03)";
  if (isMax) return primaryColor;
  if (pct >= 67) return `${primaryColor}BB`;
  if (pct >= 34) return `${primaryColor}77`;
  return `${primaryColor}33`;
}

function barWidth(pct: number): string {
  if (pct === 0) return "0%";
  return `${Math.max(pct, 6)}%`;
}

// ─── Skeleton Dark ────────────────────────────────────────────────────────────

function HeatmapSkeleton() {
  const widths = ["72%", "45%", "88%", "60%", "95%", "38%", "20%"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.28 }}
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
              width: "130px",
              borderRadius: "4px",
              background: "rgba(255,255,255,0.04)",
              marginBottom: "8px",
            }}
          />
          <div
            style={{
              height: "20px",
              width: "90px",
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
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {widths.map((w, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            <div
              style={{
                width: "24px",
                height: "10px",
                borderRadius: "4px",
                background: "rgba(255,255,255,0.04)",
                flexShrink: 0,
              }}
            />
            <div
              style={{
                flex: 1,
                height: "24px",
                borderRadius: "6px",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: w,
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.04)",
                }}
              />
            </div>
            <div
              style={{
                width: "14px",
                height: "10px",
                borderRadius: "4px",
                background: "rgba(255,255,255,0.04)",
                flexShrink: 0,
              }}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Empty Dark ───────────────────────────────────────────────────────────────

function HeatmapEmpty({ primaryColor }: { primaryColor: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.28 }}
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
        <Flame
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
  const fill = barColor(point.pct, primaryColor, point.isMax);
  const track = "rgba(255,255,255,0.04)";
  const width = barWidth(point.pct);

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.28 + index * 0.04 }}
      style={{ display: "flex", alignItems: "center", gap: "10px" }}
    >
      {/* Label día */}
      <p
        style={{
          fontSize: "10px",
          fontWeight: 400,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          flexShrink: 0,
          width: "24px",
          textAlign: "right",
          color: point.isMax ? `${primaryColor}CC` : "rgba(245,242,238,0.25)",
        }}
      >
        {point.day}
      </p>

      {/* Track */}
      <div
        style={{
          flex: 1,
          borderRadius: "6px",
          overflow: "hidden",
          background: track,
          height: "24px",
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
            background: fill,
            borderRadius: "6px",
          }}
        />
        {point.isMax && (
          <div
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Flame
              size={9}
              strokeWidth={2}
              style={{ color: "rgba(245,242,238,0.7)" }}
            />
            <span
              style={{
                fontSize: "9px",
                color: "rgba(245,242,238,0.7)",
                letterSpacing: "0.06em",
              }}
            >
              Mas ocupado
            </span>
          </div>
        )}
      </div>

      {/* Conteo */}
      <p
        style={{
          fontSize: "11px",
          flexShrink: 0,
          width: "18px",
          textAlign: "right",
          color: point.isMax ? `${primaryColor}CC` : "rgba(245,242,238,0.22)",
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
  if (totalCitas === 0) return <HeatmapEmpty primaryColor={primaryColor} />;

  const maxDay = weekdayData.find((d) => d.isMax);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.28 }}
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
            Ocupación · últimos 90 días
          </p>
          {maxDay && (
            <p
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
                fontSize: "1.4rem",
                fontWeight: 300,
                color: "rgba(245,242,238,0.85)",
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              {maxDay.dayFull}
            </p>
          )}
          <p
            style={{
              fontSize: "11px",
              marginTop: "4px",
              color: "rgba(245,242,238,0.2)",
            }}
          >
            es tu día más ocupado
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
          <Flame
            size={14}
            strokeWidth={1.75}
            style={{ color: `${primaryColor}CC` }}
          />
        </div>
      </div>

      {/* Filas */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
      <p
        style={{
          fontSize: "10px",
          marginTop: "16px",
          textAlign: "right",
          color: "rgba(245,242,238,0.12)",
          letterSpacing: "0.04em",
        }}
      >
        Total: {totalCitas} citas en 90 días
      </p>
    </motion.div>
  );
}
