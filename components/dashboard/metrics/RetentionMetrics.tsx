"use client";

// components/dashboard/metrics/RetentionMetrics.tsx
// Anillos SVG de rebooking y frecuencia de visita. Lógica intacta.

import { motion } from "framer-motion";
import { RefreshCw, Clock } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface RetentionData {
  rebookingRate: number;
  rebookingCount: number;
  visitFrequency: number;
  totalClients: number;
}

interface RetentionMetricsProps {
  data: RetentionData;
  primaryColor: string;
  loading?: boolean;
}

// ─── Anillo SVG Dark ──────────────────────────────────────────────────────────

const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function RingChart({
  pct,
  primaryColor,
  children,
}: {
  pct: number;
  primaryColor: string;
  children: React.ReactNode;
}) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  const filled = (clamped / 100) * CIRCUMFERENCE;
  const gap = CIRCUMFERENCE - filled;

  return (
    <div
      style={{
        position: "relative",
        width: "96px",
        height: "96px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width="96"
        height="96"
        viewBox="0 0 96 96"
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track dark */}
        <circle
          cx="48"
          cy="48"
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="7"
        />
        {/* Arco animado */}
        <motion.circle
          cx="48"
          cy="48"
          r={RADIUS}
          fill="none"
          stroke={primaryColor}
          strokeWidth="7"
          strokeLinecap="round"
          strokeOpacity={0.75}
          strokeDasharray={`${filled} ${gap}`}
          initial={{ strokeDasharray: `0 ${CIRCUMFERENCE}` }}
          animate={{ strokeDasharray: `${filled} ${gap}` }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Badge cualitativo Dark ───────────────────────────────────────────────────

function QualityBadge({
  label,
  level,
}: {
  label: string;
  level: "good" | "ok" | "warn" | "bad";
}) {
  const styles = {
    good: {
      bg: "rgba(16,185,129,0.1)",
      color: "rgba(52,211,153,0.85)",
      border: "rgba(16,185,129,0.2)",
    },
    ok: {
      bg: "rgba(234,179,8,0.1)",
      color: "rgba(251,191,36,0.85)",
      border: "rgba(234,179,8,0.2)",
    },
    warn: {
      bg: "rgba(255,255,255,0.04)",
      color: "rgba(245,242,238,0.3)",
      border: "rgba(255,255,255,0.07)",
    },
    bad: {
      bg: "rgba(239,68,68,0.1)",
      color: "rgba(252,165,165,0.85)",
      border: "rgba(239,68,68,0.2)",
    },
  };
  const s = styles[level];
  return (
    <span
      style={{
        display: "inline-flex",
        fontSize: "10px",
        padding: "2px 9px",
        borderRadius: "20px",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        letterSpacing: "0.05em",
      }}
    >
      {label}
    </span>
  );
}

// ─── Card Rebooking Dark ──────────────────────────────────────────────────────

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
  const label =
    rate >= 60
      ? "Excelente"
      : rate >= 40
        ? "Buena"
        : rate >= 20
          ? "Regular"
          : "Por mejorar";
  const level =
    rate >= 60 ? "good" : rate >= 40 ? "ok" : rate >= 20 ? "warn" : "bad";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.12 }}
      style={{
        flex: 1,
        borderRadius: "10px",
        padding: "20px",
        background: "#0E0C0B",
        border: "1px solid rgba(255,255,255,0.055)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            width: "26px",
            height: "26px",
            borderRadius: "6px",
            background: `${primaryColor}12`,
            border: `1px solid ${primaryColor}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <RefreshCw
            size={12}
            strokeWidth={1.75}
            style={{ color: `${primaryColor}CC` }}
          />
        </div>
        <p
          style={{
            fontSize: "10px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(245,242,238,0.22)",
            margin: 0,
          }}
        >
          Rebooking
        </p>
      </div>

      {/* Anillo + stats */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <RingChart pct={rate} primaryColor={primaryColor}>
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
            {rate}%
          </p>
        </RingChart>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            minWidth: 0,
          }}
        >
          <QualityBadge label={label} level={level} />
          <p
            style={{
              fontSize: "12px",
              lineHeight: 1.5,
              color: "rgba(245,242,238,0.35)",
              margin: 0,
            }}
          >
            <span
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
                fontSize: "1.1rem",
                fontWeight: 300,
                color: "rgba(245,242,238,0.75)",
              }}
            >
              {count}
            </span>{" "}
            de <span style={{ color: "rgba(245,242,238,0.5)" }}>{total}</span>{" "}
            clientas volvieron
          </p>
          <p
            style={{
              fontSize: "10px",
              color: "rgba(245,242,238,0.15)",
              margin: 0,
              letterSpacing: "0.03em",
            }}
          >
            en los últimos 60 días
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Card Frecuencia Dark ─────────────────────────────────────────────────────

function VisitFrequencyCard({
  frequency,
  primaryColor,
}: {
  frequency: number;
  primaryColor: string;
}) {
  const pct = Math.max(0, Math.round(((60 - frequency) / 53) * 100));
  const rounded = Math.round(frequency);

  const label =
    frequency <= 14
      ? "Muy frecuente"
      : frequency <= 30
        ? "Frecuente"
        : frequency <= 45
          ? "Ocasional"
          : "Esporadica";
  const level =
    frequency <= 14
      ? "good"
      : frequency <= 30
        ? "ok"
        : frequency <= 45
          ? "warn"
          : "bad";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.16 }}
      style={{
        flex: 1,
        borderRadius: "10px",
        padding: "20px",
        background: "#0E0C0B",
        border: "1px solid rgba(255,255,255,0.055)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            width: "26px",
            height: "26px",
            borderRadius: "6px",
            background: `${primaryColor}12`,
            border: `1px solid ${primaryColor}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Clock
            size={12}
            strokeWidth={1.75}
            style={{ color: `${primaryColor}CC` }}
          />
        </div>
        <p
          style={{
            fontSize: "10px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(245,242,238,0.22)",
            margin: 0,
          }}
        >
          Frecuencia de visita
        </p>
      </div>

      {/* Anillo + stats */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <RingChart pct={pct} primaryColor={primaryColor}>
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
            {rounded}
          </p>
          <p
            style={{
              fontSize: "9px",
              color: "rgba(245,242,238,0.2)",
              lineHeight: 1,
              letterSpacing: "0.06em",
              margin: 0,
            }}
          >
            días
          </p>
        </RingChart>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            minWidth: 0,
          }}
        >
          <QualityBadge label={label} level={level} />
          <p
            style={{
              fontSize: "12px",
              lineHeight: 1.5,
              color: "rgba(245,242,238,0.35)",
              margin: 0,
            }}
          >
            Regresan cada{" "}
            <span style={{ color: "rgba(245,242,238,0.65)" }}>
              {rounded} días
            </span>{" "}
            en promedio
          </p>
          <p
            style={{
              fontSize: "10px",
              color: "rgba(245,242,238,0.15)",
              margin: 0,
              letterSpacing: "0.03em",
            }}
          >
            basado en últimos 90 días
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton Dark ────────────────────────────────────────────────────────────

function RetentionSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {[0.12, 0.16].map((delay) => (
        <motion.div
          key={delay}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay }}
          className="animate-pulse"
          style={{
            flex: 1,
            borderRadius: "10px",
            padding: "20px",
            background: "#0E0C0B",
            border: "1px solid rgba(255,255,255,0.055)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "6px",
                background: "rgba(255,255,255,0.04)",
              }}
            />
            <div
              style={{
                height: "10px",
                width: "60px",
                borderRadius: "4px",
                background: "rgba(255,255,255,0.04)",
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "96px",
                height: "96px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.04)",
                flexShrink: 0,
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                flex: 1,
              }}
            >
              <div
                style={{
                  height: "20px",
                  width: "70px",
                  borderRadius: "20px",
                  background: "rgba(255,255,255,0.04)",
                }}
              />
              <div
                style={{
                  height: "11px",
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.04)",
                }}
              />
              <div
                style={{
                  height: "10px",
                  width: "75%",
                  borderRadius: "4px",
                  background: "rgba(255,255,255,0.03)",
                }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Empty Dark ───────────────────────────────────────────────────────────────

function RetentionEmpty({ primaryColor }: { primaryColor: string }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {[RefreshCw, Clock].map((Icon, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 + i * 0.04 }}
          style={{
            flex: 1,
            borderRadius: "10px",
            padding: "24px",
            background: "#0E0C0B",
            border: "1px solid rgba(255,255,255,0.055)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: "48px",
            paddingBottom: "48px",
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
              marginBottom: "12px",
            }}
          >
            <Icon
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
              maxWidth: "14rem",
            }}
          >
            Necesita al menos 2 citas para calcular retención.
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
