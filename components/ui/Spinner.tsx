// ─── Tokens ───────────────────────────────────────────────────────────────────
const t = {
  rose: "#FF2D55",
  roseDim: "rgba(255,45,85,0.55)",
  roseBorder: "rgba(255,45,85,0.22)",
  surface: "#0E0C0B",
  bg: "#080706",
  textDim: "rgba(245,242,238,0.18)",
  textMid: "rgba(245,242,238,0.45)",
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
type SpinnerSize = "xs" | "sm" | "md" | "lg";
type SpinnerVariant = "rose" | "dim" | "white";

interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  label?: string; // accesibilidad / texto bajo el spinner
}

const sizeMap: Record<SpinnerSize, { wh: number; stroke: number }> = {
  xs: { wh: 14, stroke: 1.5 },
  sm: { wh: 20, stroke: 2 },
  md: { wh: 32, stroke: 2.5 },
  lg: { wh: 48, stroke: 3 },
};

const variantMap: Record<SpinnerVariant, { track: string; arc: string }> = {
  rose: { track: t.roseBorder, arc: t.rose },
  dim: { track: "rgba(255,255,255,0.06)", arc: t.textMid },
  white: { track: "rgba(255,255,255,0.12)", arc: "rgba(245,242,238,0.9)" },
};

export function Spinner({
  size = "md",
  variant = "rose",
  label,
}: SpinnerProps) {
  const { wh, stroke } = sizeMap[size];
  const { track, arc } = variantMap[variant];
  const r = (wh - stroke) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <span
      role="status"
      aria-label={label ?? "Cargando…"}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <style>{`
        @keyframes spinner-rotate {
          to { transform: rotate(360deg); }
        }
        @keyframes spinner-dash {
          0%   { stroke-dashoffset: ${circ}; }
          50%  { stroke-dashoffset: ${circ * 0.25}; }
          100% { stroke-dashoffset: ${circ}; }
        }
      `}</style>

      <svg
        width={wh}
        height={wh}
        viewBox={`0 0 ${wh} ${wh}`}
        style={{
          animation: "spinner-rotate 1.2s linear infinite",
          flexShrink: 0,
        }}
        aria-hidden
      >
        {/* Track */}
        <circle
          cx={wh / 2}
          cy={wh / 2}
          r={r}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        {/* Arc animado */}
        <circle
          cx={wh / 2}
          cy={wh / 2}
          r={r}
          fill="none"
          stroke={arc}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * 0.75}
          style={{ animation: `spinner-dash 1.2s ease-in-out infinite` }}
        />
      </svg>

      {label && (
        <span
          style={{
            fontFamily: "var(--font-jakarta), sans-serif",
            fontSize: "12px",
            color: t.textMid,
            letterSpacing: "0.02em",
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}

// ─── PageLoader — pantalla completa de carga ──────────────────────────────────
interface PageLoaderProps {
  label?: string;
}

export function PageLoader({ label = "Cargando…" }: PageLoaderProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: t.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "20px",
        zIndex: 100,
      }}
    >
      <Spinner size="lg" variant="rose" />
      <span
        style={{
          fontFamily: "var(--font-cormorant), serif",
          fontSize: "18px",
          fontWeight: 300,
          color: t.textMid,
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── InlineLoader — reemplaza un bloque de contenido ─────────────────────────
interface InlineLoaderProps {
  height?: string;
  label?: string;
}

export function InlineLoader({ height = "200px", label }: InlineLoaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height,
        width: "100%",
      }}
    >
      <Spinner size="md" variant="rose" label={label} />
    </div>
  );
}
