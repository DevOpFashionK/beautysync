"use client";

// components/dashboard/metrics/TopServices.tsx
//
// Ranking de servicios más populares del mes actual.
// Muestra hasta 5 servicios ordenados por cantidad de citas,
// con barra de proporción relativa al más popular y precio promedio.
//
// Recibe datos ya procesados desde el Server Component — no hace fetch propio.
//
// Props:
//   services     — array de hasta 5 servicios con métricas del mes
//   primaryColor — color de acento del salón
//   loading      — muestra skeleton si true

import { motion } from "framer-motion";
import { Scissors } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface TopServiceDataPoint {
  /** ID del servicio */
  id: string;
  /** Nombre del servicio */
  name: string;
  /** Cantidad de citas este mes (no canceladas) */
  count: number;
  /** Ingresos generados este mes (citas completadas/confirmadas) */
  revenue: number;
  /** Porcentaje relativo al servicio más popular (0–100) */
  pct: number;
  /** true si es el servicio #1 */
  isTop: boolean;
}

interface TopServicesProps {
  services: TopServiceDataPoint[];
  primaryColor: string;
  loading?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRevenue(amount: number): string {
  const dollars = Math.floor(amount);
  const cents = Math.round((amount - dollars) * 100);
  return `$${dollars}.${String(cents).padStart(2, "0")}`;
}

/** Número de posición con estilo: 1 → corona, 2–5 → número */
function RankBadge({
  rank,
  isTop,
  primaryColor,
}: {
  rank: number;
  isTop: boolean;
  primaryColor: string;
}) {
  if (isTop) {
    return (
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm"
        style={{
          background: `${primaryColor}18`,
          color: primaryColor,
          fontWeight: 700,
        }}
      >
        ✦
      </div>
    );
  }

  return (
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                 text-xs font-semibold"
      style={{
        background: "#F3EDE8",
        color: "#B5A99F",
      }}
    >
      {rank}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function TopServicesSkeleton() {
  const widths = ["100%", "72%", "55%", "40%", "28%"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.16 }}
      className="rounded-2xl p-6 animate-pulse"
      style={{ background: "#FFFFFF", border: "1px solid #EDE8E3" }}
    >
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div
            className="h-3 rounded-lg w-40 mb-2"
            style={{ background: "#F3EDE8" }}
          />
          <div
            className="h-6 rounded-lg w-32"
            style={{ background: "#F3EDE8" }}
          />
        </div>
        <div className="w-9 h-9 rounded-xl" style={{ background: "#F3EDE8" }} />
      </div>

      {/* Filas skeleton */}
      <div className="flex flex-col gap-4">
        {widths.map((w, i) => (
          <div key={i} className="flex items-start gap-3">
            {/* Badge */}
            <div
              className="w-7 h-7 rounded-lg shrink-0"
              style={{ background: "#F3EDE8" }}
            />
            <div className="flex-1 min-w-0">
              {/* Nombre */}
              <div
                className="h-3.5 rounded-lg mb-2"
                style={{ background: "#F3EDE8", width: w }}
              />
              {/* Barra */}
              <div
                className="h-1.5 rounded-full w-full mb-1.5"
                style={{ background: "#F3EDE8" }}
              />
              {/* Stats */}
              <div
                className="h-3 rounded-lg w-24"
                style={{ background: "#F3EDE8" }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function TopServicesEmpty({ primaryColor }: { primaryColor: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.16 }}
      className="rounded-2xl p-6 flex flex-col items-center justify-center py-16"
      style={{ background: "#FFFFFF", border: "1px solid #EDE8E3" }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ background: `${primaryColor}14` }}
      >
        <Scissors
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
        Sin servicios este mes
      </p>
      <p
        className="text-xs mt-1 text-center"
        style={{ color: "#C4B8B0", maxWidth: "18rem" }}
      >
        El ranking aparecerá cuando haya citas registradas este mes.
      </p>
    </motion.div>
  );
}

// ─── Fila de un servicio ─────────────────────────────────────────────────────

function ServiceRow({
  service,
  rank,
  primaryColor,
  index,
}: {
  service: TopServiceDataPoint;
  rank: number;
  primaryColor: string;
  index: number;
}) {
  const barWidth = `${Math.max(service.pct, 4)}%`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.16 + index * 0.05 }}
      className="flex items-start gap-3"
    >
      {/* Badge de posición */}
      <RankBadge
        rank={rank}
        isTop={service.isTop}
        primaryColor={primaryColor}
      />

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        {/* Nombre + conteo */}
        <div className="flex items-baseline justify-between gap-2 mb-1.5">
          <p
            className="text-sm font-medium truncate"
            style={{
              color: service.isTop ? "#2D2420" : "#5C4F48",
              fontWeight: service.isTop ? 600 : 500,
            }}
          >
            {service.name}
          </p>
          <span
            className="text-xs font-semibold shrink-0"
            style={{ color: service.isTop ? primaryColor : "#9C8E85" }}
          >
            {service.count} {service.count === 1 ? "cita" : "citas"}
          </span>
        </div>

        {/* Barra de proporción */}
        <div
          className="w-full rounded-full overflow-hidden mb-1.5"
          style={{ height: "5px", background: "#F3EDE8" }}
        >
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: barWidth }}
            transition={{
              duration: 0.55,
              delay: 0.2 + index * 0.06,
              ease: "easeOut",
            }}
            style={{
              height: "100%",
              borderRadius: "9999px",
              background: service.isTop ? primaryColor : `${primaryColor}60`,
            }}
          />
        </div>

        {/* Ingresos */}
        <p className="text-xs" style={{ color: "#B5A99F" }}>
          {formatRevenue(service.revenue)} este mes
        </p>
      </div>
    </motion.div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function TopServices({
  services,
  primaryColor,
  loading = false,
}: TopServicesProps) {
  if (loading) return <TopServicesSkeleton />;
  if (!services.length) return <TopServicesEmpty primaryColor={primaryColor} />;

  const topService = services[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.16 }}
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
            Servicios · este mes
          </p>
          <p
            className="truncate max-w-[180px]"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "1.35rem",
              fontWeight: 600,
              color: "#2D2420",
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
            }}
          >
            {topService.name}
          </p>
          <p className="text-xs mt-1" style={{ color: "#B5A99F" }}>
            es el más solicitado
          </p>
        </div>

        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${primaryColor}14` }}
        >
          <Scissors
            size={16}
            strokeWidth={1.75}
            style={{ color: primaryColor }}
          />
        </div>
      </div>

      {/* Lista de servicios */}
      <div className="flex flex-col gap-4">
        {services.map((service, i) => (
          <ServiceRow
            key={service.id}
            service={service}
            rank={i + 1}
            primaryColor={primaryColor}
            index={i}
          />
        ))}
      </div>
    </motion.div>
  );
}
