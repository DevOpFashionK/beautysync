"use client";

// components/dashboard/metrics/MetricCard.tsx
//
// Card KPI reutilizable para el dashboard de métricas.
// Muestra: ícono, label, valor principal, y delta opcional (% vs periodo anterior).
//
// Props:
//   - icon: componente lucide-react
//   - label: texto descriptivo del KPI
//   - value: valor principal (string — ya formateado por el padre)
//   - delta: número opcional — positivo = verde ▲, negativo = rojo ▼, null = sin delta
//   - deltaLabel: texto junto al delta (ej: "vs mes anterior")
//   - primaryColor: color de acento del salón
//   - index: posición — controla el delay de la animación de entrada
//   - loading: muestra skeleton si true

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string;
  primaryColor: string;
  index?: number;
  loading?: boolean;
  /** Ancho del skeleton del valor — default "w-16" */
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
      {/* Ícono placeholder */}
      <div
        className="w-9 h-9 rounded-xl mb-4"
        style={{ background: "#F3EDE8" }}
      />
      {/* Label placeholder */}
      <div
        className="h-3 rounded-lg w-24 mb-3"
        style={{ background: "#F3EDE8" }}
      />
      {/* Valor placeholder */}
      <div
        className={`h-8 rounded-lg ${skeletonWidth} mb-2`}
        style={{ background: "#F3EDE8" }}
      />
      {/* Delta placeholder */}
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
  const isPositive = delta >= 0;
  const isZero = delta === 0;

  const color = isZero ? "#9C8E85" : isPositive ? "#065F46" : "#B91C1C";
  const bg = isZero ? "#F3EDE8" : isPositive ? "#D1FAE5" : "#FEE2E2";
  const arrow = isZero ? "→" : isPositive ? "▲" : "▼";
  const sign = isPositive && !isZero ? "+" : "";
  const label = Math.abs(delta).toFixed(0);

  return (
    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
      <span
        className="inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ background: bg, color }}
      >
        <span style={{ fontSize: "0.6rem" }}>{arrow}</span>
        {sign}
        {label}%
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
  icon: Icon,
  label,
  value,
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="rounded-2xl p-5"
      style={{ background: "#FFFFFF", border: "1px solid #EDE8E3" }}
    >
      {/* Ícono con acento del salón */}
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

      {/* Delta opcional */}
      {delta != null && <DeltaBadge delta={delta} deltaLabel={deltaLabel} />}
    </motion.div>
  );
}
