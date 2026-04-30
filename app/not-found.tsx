// app/not-found.tsx
import Link from "next/link";

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

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100svh",
        background: t.bg,
        // Radial sutil en esquina superior izquierda
        backgroundImage: `radial-gradient(ellipse at top left, rgba(255,45,85,0.06) 0%, transparent 55%)`,
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
      {/* ── Eyebrow ─────────────────────────────────────────────────────── */}
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
          Error 404
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

      {/* ── 404 display ─────────────────────────────────────────────────── */}
      <div style={{ position: "relative", marginBottom: "8px" }}>
        {/* Número fantasma de fondo */}
        <p
          aria-hidden
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "clamp(120px, 22vw, 200px)",
            fontWeight: 300,
            lineHeight: 1,
            color: "rgba(255,45,85,0.06)",
            userSelect: "none",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          404
        </p>

        {/* Texto superpuesto */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "clamp(22px, 4vw, 32px)",
              fontWeight: 300,
              color: t.textPrimary,
              margin: 0,
              letterSpacing: "0.01em",
            }}
          >
            Página no encontrada
          </h1>
        </div>
      </div>

      {/* ── Mensaje ──────────────────────────────────────────────────────── */}
      <p
        style={{
          fontFamily: "var(--font-jakarta), sans-serif",
          fontSize: "13px",
          lineHeight: 1.65,
          color: t.textMid,
          maxWidth: "300px",
          margin: "20px 0 36px",
        }}
      >
        El enlace que buscas no existe o fue removido. Si buscas reservar una
        cita, verifica el link con tu salón.
      </p>

      {/* ── Divisor decorativo ───────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "36px",
        }}
      >
        <div style={{ width: "40px", height: "1px", background: t.border }} />
        <span style={{ color: t.roseDim, fontSize: "10px" }}>✦</span>
        <div style={{ width: "40px", height: "1px", background: t.border }} />
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <Link
        href="/"
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
          textDecoration: "none",
          letterSpacing: "0.01em",
          transition: "filter 0.18s ease",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.filter = "brightness(1.12)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path
            d="M6 2L1 7m0 0l5 5M1 7h12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Volver al inicio
      </Link>

      {/* ── Brand ────────────────────────────────────────────────────────── */}
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

      {/* ── Acento esquina inferior derecha ──────────────────────────────── */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: "60px",
          height: "60px",
          borderBottom: `1px solid ${t.roseBorder}`,
          borderRight: `1px solid ${t.roseBorder}`,
          borderBottomRightRadius: "0px",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
