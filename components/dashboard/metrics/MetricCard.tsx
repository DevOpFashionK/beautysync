"use client";

// components/dashboard/metrics/MetricCard.tsx
//
// Fase 8.3 — Íconos como string identifier (no función) para evitar
// el error de serialización Server → Client Component en Next.js 16.

import { motion } from "framer-motion";
import {
  CalendarDays,
  CalendarCheck,
  DollarSign,
  UserPlus,
  TrendingDown,
  TrendingUp,
  UserX,
  Receipt,
  RefreshCw,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Map de íconos ────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  calendar: CalendarDays,
  dollar: DollarSign,
  "user-plus": UserPlus,
  "trending-down": TrendingDown,
  "no-show": UserX,
  ticket: Receipt,
  rebooking: RefreshCw,
  clock: Clock,
  "trending-up": TrendingUp,
  "calendar-check": CalendarCheck,
};

export type MetricIconKey = keyof typeof ICON_MAP;

// ─── Props ────────────────────────────────────────────────────────────────────

interface MetricCardProps {
  icon: MetricIconKey;
  label: string;
  value: string;
  sublabel?: string;
  delta?: number | null;
  deltaLabel?: string;
  primaryColor: string;
  index?: number;
  loading?: boolean;
  skeletonWidth?: string;
}

// ─── Skeleton Dark Atelier ────────────────────────────────────────────────────

function MetricCardSkeleton({
  index = 0,
  skeletonWidth = "w-16",
}: {
  index?: number;
  skeletonWidth?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="animate-pulse"
      style={{
        borderRadius: "10px",
        padding: "20px",
        background: "#0E0C0B",
        border: "1px solid rgba(255,255,255,0.055)",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          background: "rgba(255,255,255,0.04)",
          marginBottom: "16px",
        }}
      />
      <div
        style={{
          height: "10px",
          borderRadius: "4px",
          width: "60%",
          background: "rgba(255,255,255,0.04)",
          marginBottom: "10px",
        }}
      />
      <div
        className={skeletonWidth}
        style={{
          height: "28px",
          borderRadius: "6px",
          background: "rgba(255,255,255,0.05)",
          marginBottom: "8px",
        }}
      />
      <div
        style={{
          height: "10px",
          borderRadius: "4px",
          width: "40%",
          background: "rgba(255,255,255,0.03)",
        }}
      />
    </motion.div>
  );
}

// ─── Delta badge Dark Atelier ─────────────────────────────────────────────────

function DeltaBadge({
  delta,
  deltaLabel,
}: {
  delta: number;
  deltaLabel?: string;
}) {
  const isZero = delta === 0;
  const isPositive = delta > 0;

  const color = isZero
    ? "rgba(245,242,238,0.25)"
    : isPositive
      ? "rgba(52,211,153,0.85)"
      : "rgba(252,165,165,0.85)";

  const bg = isZero
    ? "rgba(255,255,255,0.04)"
    : isPositive
      ? "rgba(16,185,129,0.1)"
      : "rgba(239,68,68,0.1)";

  const border = isZero
    ? "rgba(255,255,255,0.07)"
    : isPositive
      ? "rgba(16,185,129,0.2)"
      : "rgba(239,68,68,0.2)";

  const arrow = isZero ? "→" : isPositive ? "▲" : "▼";
  const sign = isPositive ? "+" : "";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginTop: "10px",
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "3px",
          fontSize: "11px",
          padding: "2px 8px",
          borderRadius: "20px",
          background: bg,
          color,
          border: `1px solid ${border}`,
          fontWeight: 400,
          letterSpacing: "0.04em",
        }}
      >
        <span style={{ fontSize: "9px" }}>{arrow}</span>
        {sign}
        {Math.abs(delta).toFixed(0)}%
      </span>
      {deltaLabel && (
        <span
          style={{
            fontSize: "11px",
            color: "rgba(245,242,238,0.18)",
            letterSpacing: "0.03em",
          }}
        >
          {deltaLabel}
        </span>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function MetricCard({
  icon,
  label,
  value,
  sublabel,
  delta,
  deltaLabel,
  primaryColor,
  index = 0,
  loading = false,
  skeletonWidth,
}: MetricCardProps) {
  if (loading) {
    return <MetricCardSkeleton index={index} skeletonWidth={skeletonWidth} />;
  }

  const Icon = ICON_MAP[icon] ?? CalendarDays;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      style={{
        borderRadius: "10px",
        padding: "20px",
        background: "#0E0C0B",
        border: "1px solid rgba(255,255,255,0.055)",
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "rgba(255,255,255,0.09)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "rgba(255,255,255,0.055)";
      }}
    >
      {/* Radial sutil en esquina */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "80px",
          height: "80px",
          background: `radial-gradient(circle at top right, ${primaryColor}0A, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Ícono */}
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
          background: `${primaryColor}12`,
          border: `1px solid ${primaryColor}20`,
        }}
      >
        <Icon
          size={15}
          strokeWidth={1.75}
          style={{ color: `${primaryColor}CC` }}
        />
      </div>

      {/* Label */}
      <p
        style={{
          fontSize: "10px",
          fontWeight: 400,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(245,242,238,0.25)",
          marginBottom: "8px",
        }}
      >
        {label}
      </p>

      {/* Valor */}
      <p
        style={{
          fontFamily:
            "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
          fontSize: "2rem",
          fontWeight: 300,
          color: "rgba(245,242,238,0.88)",
          lineHeight: 1,
          letterSpacing: "-0.03em",
        }}
      >
        {value}
      </p>

      {/* Sublabel */}
      {sublabel && (
        <p
          style={{
            fontSize: "11px",
            marginTop: "5px",
            color: "rgba(245,242,238,0.2)",
            letterSpacing: "0.03em",
          }}
        >
          {sublabel}
        </p>
      )}

      {/* Delta */}
      {delta != null && <DeltaBadge delta={delta} deltaLabel={deltaLabel} />}
    </motion.div>
  );
}
