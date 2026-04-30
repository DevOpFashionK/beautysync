"use client";

// app/error.tsx
// Error boundary global de Next.js App Router.
// DEBE ser 'use client' — requisito del framework.

import { useEffect } from "react";
import Link from "next/link";

// ─── Tokens Dark Atelier ──────────────────────────────────────────────────────
const t = {
  bg: "#080706",
  surface: "#0E0C0B",
  border: "rgba(255,255,255,0.055)",
  borderMid: "rgba(255,255,255,0.09)",
  rose: "#FF2D55",
  roseDim: "rgba(255,45,85,0.55)",
  roseGhost: "rgba(255,45,85,0.08)",
  roseBorder: "rgba(255,45,85,0.22)",
  textPrimary: "rgba(245,242,238,0.9)",
  textMid: "rgba(245,242,238,0.45)",
  textDim: "rgba(245,242,238,0.18)",
};

// ─── Props que Next.js inyecta automáticamente ────────────────────────────────
interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  // Loguear el error para debugging / Sentry en el futuro
  useEffect(() => {
    console.error("[BeautySync] Error global:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100svh",
        background: t.bg,
        backgroundImage: `radial-gradient(ellipse at top right, rgba(255,45,85,0.07) 0%, transparent 55%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Eyebrow ───────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "28px",
        }}
      >
        <span
          style={{
            display: "block",
            width: "14px",
            height: "1px",
            background: t.roseDim,
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-jakarta), sans-serif",
            fontSize: "10px",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            color: t.roseDim,
          }}
        >
          Error del sistema
        </span>
        <span
          style={{
            display: "block",
            width: "14px",
            height: "1px",
            background: t.roseDim,
          }}
        />
      </div>

      {/* ── Ícono ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: t.roseGhost,
          border: `1px solid ${t.roseBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "24px",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
          <path
            d="M11 7v5M11 15h.01M9.27 3.5L1.5 17a2 2 0 001.73 3h15.54a2 2 0 001.73-3L12.73 3.5a2 2 0 00-3.46 0z"
            stroke={t.roseDim}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* ── Título ────────────────────────────────────────────────────────── */}
      <h1
        style={{
          fontFamily: "var(--font-cormorant), serif",
          fontSize: "clamp(26px, 4vw, 36px)",
          fontWeight: 300,
          color: t.textPrimary,
          margin: "0 0 12px",
          letterSpacing: "0.01em",
        }}
      >
        Algo salió mal
      </h1>

      {/* ── Descripción ───────────────────────────────────────────────────── */}
      <p
        style={{
          fontFamily: "var(--font-jakarta), sans-serif",
          fontSize: "13px",
          lineHeight: 1.65,
          color: t.textMid,
          maxWidth: "320px",
          margin: "0 0 36px",
        }}
      >
        Ocurrió un error inesperado. Puedes intentar de nuevo o volver al
        inicio. Si el problema persiste, contacta a soporte.
      </p>

      {/* ── Digest (solo en desarrollo) ───────────────────────────────────── */}
      {process.env.NODE_ENV === "development" && error.digest && (
        <div
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: "8px",
            padding: "8px 14px",
            marginBottom: "28px",
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "11px",
              color: t.textDim,
            }}
          >
            digest: {error.digest}
          </span>
        </div>
      )}

      {/* ── Acciones ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {/* Reintentar — acción primaria */}
        <button
          onClick={reset}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "11px 28px",
            borderRadius: "12px",
            background: t.rose,
            border: `1px solid ${t.rose}`,
            color: "#fff",
            fontFamily: "var(--font-jakarta), sans-serif",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.01em",
            cursor: "pointer",
            transition: "filter 0.18s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.filter = "brightness(1.12)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden
          >
            <path
              d="M1 7a6 6 0 1011.93-1M1 7V3m0 4H5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Intentar de nuevo
        </button>

        {/* Volver al inicio — acción secundaria */}
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "11px 28px",
            borderRadius: "12px",
            background: t.roseGhost,
            border: `1px solid ${t.roseBorder}`,
            color: t.roseDim,
            fontFamily: "var(--font-jakarta), sans-serif",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.01em",
            textDecoration: "none",
            cursor: "pointer",
            transition: "background 0.18s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,45,85,0.16)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = t.roseGhost)}
        >
          Volver al inicio
        </Link>
      </div>

      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <p
        style={{
          fontFamily: "var(--font-jakarta), sans-serif",
          fontSize: "11px",
          color: t.textDim,
          marginTop: "48px",
          letterSpacing: "0.04em",
        }}
      >
        BeautySync · El salón que trabaja solo
      </p>

      {/* ── Acento esquina inferior izquierda ─────────────────────────────── */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "60px",
          height: "60px",
          borderBottom: `1px solid ${t.roseBorder}`,
          borderLeft: `1px solid ${t.roseBorder}`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
