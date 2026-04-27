"use client";

// components/dashboard/metrics/RetentionMetrics.tsx
//
// Métricas de retención de clientas — dos cards lado a lado:
//
//   1. Tasa de Rebooking   — % de clientas que volvieron en los últimos 60 días
//   2. Frecuencia de Visita — promedio de días entre visitas por clienta
//
// Visualización: anillo SVG con porcentaje/valor en el centro.
// Sin recharts — SVG puro para control total y rendimiento óptimo.
//
// Props:
//   rebookingRate    — porcentaje 0–100 de clientas que reagendaron
//   rebookingCount   — número absoluto de clientas que volvieron
//   visitFrequency   — promedio de días entre visitas (número)
//   totalClients     — total de clientas únicas en los últimos 60 días
//   primaryColor     — color de acento del salón
//   loading          — muestra skeleton si true

import { motion } from "framer-motion";
import { RefreshCw, Clock } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface RetentionData {
  rebookingRate: number; // 0–100
  rebookingCount: number; // clientas que volvieron
  visitFrequency: number; // días promedio entre visitas
  totalClients: number; // clientas únicas en 60 días
}

interface RetentionMetricsProps {
  data: RetentionData;
  primaryColor: string;
  loading?: boolean;
}

// ─── Anillo SVG ───────────────────────────────────────────────────────────────
//
// Radio = 36, circunferencia = 2π×36 ≈ 226.2
// strokeDasharray controla el arco lleno vs vacío.

const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function RingChart({
  pct,
  primaryColor,
  children,
}: {
  pct: number; // 0–100
  primaryColor: string;
  children: React.ReactNode;
}) {
  const clampedPct = Math.min(Math.max(pct, 0), 100);
  const filled = (clampedPct / 100) * CIRCUMFERENCE;
  const gap = CIRCUMFERENCE - filled;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg
        width="96"
        height="96"
        viewBox="0 0 96 96"
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx="48"
          cy="48"
          r={RADIUS}
          fill="none"
          stroke="#F3EDE8"
          strokeWidth="8"
        />
        {/* Arco animado */}
        <motion.circle
          cx="48"
          cy="48"
          r={RADIUS}
          fill="none"
          stroke={primaryColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${gap}`}
          initial={{ strokeDasharray: `0 ${CIRCUMFERENCE}` }}
          animate={{ strokeDasharray: `${filled} ${gap}` }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      {/* Contenido central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// ─── Card de Rebooking ────────────────────────────────────────────────────────

function RebookingCard({
  rate,
  count,
  total,
  primaryColor,
}: {
  rate: number;
  count: number;
  total: number;
  primaryColor: string;
}) {
  // Clasificación cualitativa de la tasa
  const label =
    rate >= 60
      ? "Excelente"
      : rate >= 40
        ? "Buena"
        : rate >= 20
          ? "Regular"
          : "Por mejorar";

  const labelColor =
    rate >= 60
      ? "#065F46"
      : rate >= 40
        ? "#92400E"
        : rate >= 20
          ? "#9C8E85"
          : "#B91C1C";

  const labelBg =
    rate >= 60
      ? "#D1FAE5"
      : rate >= 40
        ? "#FEF3C7"
        : rate >= 20
          ? "#F3EDE8"
          : "#FEE2E2";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.12 }}
      className="flex-1 rounded-2xl p-5"
      style={{ background: "#FFFFFF", border: "1px solid #EDE8E3" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${primaryColor}14` }}
        >
          <RefreshCw
            size={13}
            strokeWidth={2}
            style={{ color: primaryColor }}
          />
        </div>
        <p
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "#9C8E85", letterSpacing: "0.08em" }}
        >
          Rebooking
        </p>
      </div>

      {/* Anillo + stats */}
      <div className="flex items-center gap-4">
        <RingChart pct={rate} primaryColor={primaryColor}>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "#2D2420",
              lineHeight: 1,
            }}
          >
            {rate}%
          </p>
        </RingChart>

        <div className="flex flex-col gap-2 min-w-0">
          {/* Badge cualitativo */}
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full self-start"
            style={{ background: labelBg, color: labelColor }}
          >
            {label}
          </span>

          <p className="text-xs leading-relaxed" style={{ color: "#9C8E85" }}>
            <span
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#2D2420",
              }}
            >
              {count}
            </span>{" "}
            de{" "}
            <span style={{ color: "#5C4F48", fontWeight: 600 }}>{total}</span>{" "}
            clientas volvieron
          </p>

          <p className="text-xs" style={{ color: "#C4B8B0" }}>
            en los últimos 60 días
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Card de Frecuencia de Visita ─────────────────────────────────────────────

function VisitFrequencyCard({
  frequency,
  primaryColor,
}: {
  frequency: number;
  primaryColor: string;
}) {
  // Convertir días a porcentaje para el anillo
  // Referencia: 7 días = visita semanal (100%), 60 días = visita muy esporádica (0%)
  const pct = Math.max(0, Math.round(((60 - frequency) / 53) * 100));
  const rounded = Math.round(frequency);

  // Clasificación
  const label =
    frequency <= 14
      ? "Muy frecuente"
      : frequency <= 30
        ? "Frecuente"
        : frequency <= 45
          ? "Ocasional"
          : "Esporádica";

  const labelColor =
    frequency <= 14
      ? "#065F46"
      : frequency <= 30
        ? "#92400E"
        : frequency <= 45
          ? "#9C8E85"
          : "#B91C1C";

  const labelBg =
    frequency <= 14
      ? "#D1FAE5"
      : frequency <= 30
        ? "#FEF3C7"
        : frequency <= 45
          ? "#F3EDE8"
          : "#FEE2E2";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.16 }}
      className="flex-1 rounded-2xl p-5"
      style={{ background: "#FFFFFF", border: "1px solid #EDE8E3" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${primaryColor}14` }}
        >
          <Clock size={13} strokeWidth={2} style={{ color: primaryColor }} />
        </div>
        <p
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "#9C8E85", letterSpacing: "0.08em" }}
        >
          Frecuencia de visita
        </p>
      </div>

      {/* Anillo + stats */}
      <div className="flex items-center gap-4">
        <RingChart pct={pct} primaryColor={primaryColor}>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "#2D2420",
              lineHeight: 1,
            }}
          >
            {rounded}
          </p>
          <p style={{ fontSize: "0.6rem", color: "#B5A99F", lineHeight: 1 }}>
            días
          </p>
        </RingChart>

        <div className="flex flex-col gap-2 min-w-0">
          {/* Badge cualitativo */}
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full self-start"
            style={{ background: labelBg, color: labelColor }}
          >
            {label}
          </span>

          <p className="text-xs leading-relaxed" style={{ color: "#9C8E85" }}>
            Tus clientas regresan cada{" "}
            <span style={{ color: "#5C4F48", fontWeight: 600 }}>
              {rounded} días
            </span>{" "}
            en promedio
          </p>

          <p className="text-xs" style={{ color: "#C4B8B0" }}>
            basado en últimos 90 días
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function RetentionSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {[0.12, 0.16].map((delay) => (
        <motion.div
          key={delay}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay }}
          className="flex-1 rounded-2xl p-5 animate-pulse"
          style={{ background: "#FFFFFF", border: "1px solid #EDE8E3" }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-7 h-7 rounded-lg"
              style={{ background: "#F3EDE8" }}
            />
            <div
              className="h-3 rounded-lg w-20"
              style={{ background: "#F3EDE8" }}
            />
          </div>
          {/* Anillo + texto */}
          <div className="flex items-center gap-4">
            <div
              className="w-24 h-24 rounded-full"
              style={{ background: "#F3EDE8" }}
            />
            <div className="flex flex-col gap-2 flex-1">
              <div
                className="h-5 rounded-full w-20"
                style={{ background: "#F3EDE8" }}
              />
              <div
                className="h-3 rounded-lg w-full"
                style={{ background: "#F3EDE8" }}
              />
              <div
                className="h-3 rounded-lg w-3/4"
                style={{ background: "#F3EDE8" }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function RetentionEmpty({ primaryColor }: { primaryColor: string }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {[RefreshCw, Clock].map((Icon, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 + i * 0.04 }}
          className="flex-1 rounded-2xl p-6 flex flex-col items-center justify-center py-12"
          style={{ background: "#FFFFFF", border: "1px solid #EDE8E3" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ background: `${primaryColor}14` }}
          >
            <Icon
              size={18}
              strokeWidth={1.75}
              style={{ color: primaryColor }}
            />
          </div>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "1.1rem",
              fontWeight: 500,
              color: "#9C8E85",
            }}
          >
            Sin datos aún
          </p>
          <p
            className="text-xs mt-1 text-center"
            style={{ color: "#C4B8B0", maxWidth: "14rem" }}
          >
            Necesita al menos 2 citas registradas para calcular retención.
          </p>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function RetentionMetrics({
  data,
  primaryColor,
  loading = false,
}: RetentionMetricsProps) {
  if (loading) return <RetentionSkeleton />;

  const hasData = data.totalClients >= 2 && data.visitFrequency > 0;
  if (!hasData) return <RetentionEmpty primaryColor={primaryColor} />;

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <RebookingCard
        rate={data.rebookingRate}
        count={data.rebookingCount}
        total={data.totalClients}
        primaryColor={primaryColor}
      />
      <VisitFrequencyCard
        frequency={data.visitFrequency}
        primaryColor={primaryColor}
      />
    </div>
  );
}
