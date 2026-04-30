"use client";

// app/(dashboard)/error.tsx
// Error boundary del dashboard de Next.js App Router.
// DEBE ser 'use client' — requisito del framework.
// Contexto: el usuario ya está autenticado, por eso el CTA
// principal es volver al dashboard, no al inicio.

import { useEffect } from "react";

// ─── Tokens Dark Atelier ──────────────────────────────────────────────────────
const t = {
  bg: "#080706",
  surface: "#0E0C0B",
  surface2: "#131110",
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

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[BeautySync] Error en dashboard:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100%",
        minBlockSize: "calc(100svh - 64px)", // descuenta el header del dashboard
        background: t.bg,
        backgroundImage: `radial-gradient(ellipse at center top, rgba(255,45,85,0.05) 0%, transparent 60%)`,
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
          Error de sección
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

      {/* ── Card contenedor ───────────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          background: t.surface,
          border: `1px solid ${t.borderMid}`,
          borderRadius: "16px",
          padding: "36px 40px",
          maxWidth: "440px",
          width: "100%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.40)",
        }}
      >
        {/* Acento esquina superior derecha */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "14px",
            height: "14px",
            borderTop: `1px solid ${t.roseBorder}`,
            borderRight: `1px solid ${t.roseBorder}`,
            borderTopRightRadius: "16px",
            pointerEvents: "none",
          }}
        />

        {/* ── Ícono ───────────────────────────────────────────────────────── */}
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            background: t.roseGhost,
            border: `1px solid ${t.roseBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
          >
            <path
              d="M10 6v5M10 14h.01M8.27 2.5L1.5 15a2 2 0 001.73 3h13.54a2 2 0 001.73-3L11.73 2.5a2 2 0 00-3.46 0z"
              stroke={t.roseDim}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* ── Título ──────────────────────────────────────────────────────── */}
        <h1
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "26px",
            fontWeight: 300,
            color: t.textPrimary,
            margin: "0 0 10px",
            letterSpacing: "0.01em",
          }}
        >
          Error en esta sección
        </h1>

        {/* ── Descripción ─────────────────────────────────────────────────── */}
        <p
          style={{
            fontFamily: "var(--font-jakarta), sans-serif",
            fontSize: "13px",
            lineHeight: 1.65,
            color: t.textMid,
            margin: "0 0 28px",
          }}
        >
          Esta sección del dashboard encontró un problema. El resto de tu cuenta
          está bien — puedes reintentar o navegar a otra sección.
        </p>

        {/* ── Digest (solo desarrollo) ─────────────────────────────────────── */}
        {process.env.NODE_ENV === "development" && error.digest && (
          <div
            style={{
              background: t.surface2,
              border: `1px solid ${t.border}`,
              borderRadius: "8px",
              padding: "8px 12px",
              marginBottom: "24px",
              textAlign: "left",
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

        {/* ── Divisor ─────────────────────────────────────────────────────── */}
        <div
          style={{
            height: "1px",
            background: t.border,
            margin: "0 0 24px",
          }}
        />

        {/* ── Acciones ────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Reintentar — primaria */}
          <button
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 24px",
              borderRadius: "10px",
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
            onMouseLeave={(e) =>
              (e.currentTarget.style.filter = "brightness(1)")
            }
          >
            <svg
              width="13"
              height="13"
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
            Reintentar
          </button>

          {/* Ir al dashboard — ghost-rose */}
          <a
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 24px",
              borderRadius: "10px",
              background: t.roseGhost,
              border: `1px solid ${t.roseBorder}`,
              color: t.roseDim,
              fontFamily: "var(--font-jakarta), sans-serif",
              fontSize: "13px",
              fontWeight: 500,
              letterSpacing: "0.01em",
              textDecoration: "none",
              transition: "background 0.18s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,45,85,0.16)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = t.roseGhost)
            }
          >
            Ir al dashboard
          </a>
        </div>
      </div>

      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <p
        style={{
          fontFamily: "var(--font-jakarta), sans-serif",
          fontSize: "11px",
          color: t.textDim,
          marginTop: "32px",
          letterSpacing: "0.04em",
        }}
      >
        BeautySync · El salón que trabaja solo
      </p>
    </div>
  );
}
