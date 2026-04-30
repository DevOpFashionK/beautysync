"use client";

// components/dashboard/metrics/TopServices.tsx
// Ranking top 5 servicios del mes. Barras de proporción animadas. Lógica intacta.

import { motion } from "framer-motion";
import { Scissors } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface TopServiceDataPoint {
  id: string;
  name: string;
  count: number;
  revenue: number;
  pct: number;
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

// ─── Rank Badge Dark ──────────────────────────────────────────────────────────

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
        style={{
          width: "26px",
          height: "26px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: `${primaryColor}14`,
          border: `1px solid ${primaryColor}25`,
          fontSize: "13px",
          color: `${primaryColor}CC`,
        }}
      >
        N.1
      </div>
    );
  }
  return (
    <div
      style={{
        width: "26px",
        height: "26px",
        borderRadius: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        fontSize: "11px",
        color: "rgba(245,242,238,0.22)",
        letterSpacing: "0.02em",
      }}
    >
      {rank}
    </div>
  );
}

// ─── Skeleton Dark ────────────────────────────────────────────────────────────

function TopServicesSkeleton() {
  const widths = ["100%", "72%", "55%", "40%", "28%"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.16 }}
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
              height: "20px",
              width: "140px",
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
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {widths.map((w, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}
          >
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "6px",
                background: "rgba(255,255,255,0.04)",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  height: "11px",
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.04)",
                  marginBottom: "8px",
                  width: w,
                }}
              />
              <div
                style={{
                  height: "4px",
                  borderRadius: "2px",
                  background: "rgba(255,255,255,0.03)",
                  marginBottom: "6px",
                }}
              />
              <div
                style={{
                  height: "10px",
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.03)",
                  width: "70px",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Empty Dark ───────────────────────────────────────────────────────────────

function TopServicesEmpty({ primaryColor }: { primaryColor: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.16 }}
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
        <Scissors
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
        Sin servicios este mes
      </p>
      <p
        style={{
          fontSize: "11px",
          color: "rgba(245,242,238,0.15)",
          textAlign: "center",
          maxWidth: "18rem",
        }}
      >
        El ranking aparecerá cuando haya citas registradas este mes.
      </p>
    </motion.div>
  );
}

// ─── Fila de servicio ─────────────────────────────────────────────────────────

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
      style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}
    >
      <RankBadge
        rank={rank}
        isTop={service.isTop}
        primaryColor={primaryColor}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Nombre + conteo */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: "8px",
            marginBottom: "6px",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              fontWeight: 400,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              margin: 0,
              color: service.isTop
                ? "rgba(245,242,238,0.85)"
                : "rgba(245,242,238,0.45)",
            }}
          >
            {service.name}
          </p>
          <span
            style={{
              fontSize: "11px",
              flexShrink: 0,
              color: service.isTop
                ? `${primaryColor}CC`
                : "rgba(245,242,238,0.22)",
            }}
          >
            {service.count} {service.count === 1 ? "cita" : "citas"}
          </span>
        </div>

        {/* Barra de proporción */}
        <div
          style={{
            width: "100%",
            borderRadius: "2px",
            overflow: "hidden",
            height: "3px",
            background: "rgba(255,255,255,0.04)",
            marginBottom: "5px",
          }}
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
              borderRadius: "2px",
              background: service.isTop ? primaryColor : `${primaryColor}44`,
            }}
          />
        </div>

        {/* Ingresos */}
        <p
          style={{
            fontSize: "11px",
            color: "rgba(245,242,238,0.18)",
            margin: 0,
          }}
        >
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
            Servicios · este mes
          </p>
          <p
            style={{
              fontFamily:
                "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "1.3rem",
              fontWeight: 300,
              color: "rgba(245,242,238,0.85)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              maxWidth: "200px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {topService.name}
          </p>
          <p
            style={{
              fontSize: "11px",
              marginTop: "4px",
              color: "rgba(245,242,238,0.2)",
            }}
          >
            es el más solicitado
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
          <Scissors
            size={14}
            strokeWidth={1.75}
            style={{ color: `${primaryColor}CC` }}
          />
        </div>
      </div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
