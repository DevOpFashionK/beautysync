"use client";

// components/dashboard/metrics/MetricCard.tsx
//
// Fase 8.3 — Agregados íconos nuevos al ICON_MAP:
//   no-show, ticket, rebooking, clock, trending-up, calendar-check
//
// FIX original: íconos como string identifier (no función) para evitar
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

// ─── Map de íconos disponibles ────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  // Fase 8.2
  calendar: CalendarDays,
  dollar: DollarSign,
  "user-plus": UserPlus,
  "trending-down": TrendingDown,
  // Fase 8.3 — nuevos
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
  /** Subtexto debajo del valor — ej: "por cita completada" */
  sublabel?: string;
  delta?: number | null;
  deltaLabel?: string;
  primaryColor: string;
  index?: number;
  loading?: boolean;
  skeletonWidth?: string;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

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
      className="rounded-2xl p-5 animate-pulse"
      style={{ background: "#FFFFFF", border: "1px solid #EDE8E3" }}
    >
      <div
        className="w-9 h-9 rounded-xl mb-4"
        style={{ background: "#F3EDE8" }}
      />
      <div
        className="h-3 rounded-lg w-24 mb-3"
        style={{ background: "#F3EDE8" }}
      />
      <div
        className={`h-8 rounded-lg ${skeletonWidth} mb-2`}
        style={{ background: "#F3EDE8" }}
      />
      <div className="h-3 rounded-lg w-20" style={{ background: "#F3EDE8" }} />
    </motion.div>
  );
}

// ─── Delta badge ─────────────────────────────────────────────────────────────

function DeltaBadge({
  delta,
  deltaLabel,
}: {
  delta: number;
  deltaLabel?: string;
}) {
  const isZero = delta === 0;
  const isPositive = delta > 0;

  const color = isZero ? "#9C8E85" : isPositive ? "#065F46" : "#B91C1C";
  const bg = isZero ? "#F3EDE8" : isPositive ? "#D1FAE5" : "#FEE2E2";
  const arrow = isZero ? "→" : isPositive ? "▲" : "▼";
  const sign = isPositive ? "+" : "";

  return (
    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
      <span
        className="inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ background: bg, color }}
      >
        <span style={{ fontSize: "0.6rem" }}>{arrow}</span>
        {sign}
        {Math.abs(delta).toFixed(0)}%
      </span>
      {deltaLabel && (
        <span className="text-xs" style={{ color: "#C4B8B0" }}>
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
      className="rounded-2xl p-5"
      style={{ background: "#FFFFFF", border: "1px solid #EDE8E3" }}
    >
      {/* Ícono */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
        style={{ background: `${primaryColor}14` }}
      >
        <Icon size={16} strokeWidth={1.75} style={{ color: primaryColor }} />
      </div>

      {/* Label */}
      <p
        className="text-xs font-medium uppercase tracking-wider mb-1.5"
        style={{ color: "#9C8E85", letterSpacing: "0.08em" }}
      >
        {label}
      </p>

      {/* Valor */}
      <p
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "2rem",
          fontWeight: 600,
          color: "#2D2420",
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </p>

      {/* Sublabel opcional */}
      {sublabel && (
        <p className="text-xs mt-1" style={{ color: "#B5A99F" }}>
          {sublabel}
        </p>
      )}

      {/* Delta opcional */}
      {delta != null && <DeltaBadge delta={delta} deltaLabel={deltaLabel} />}
    </motion.div>
  );
}
