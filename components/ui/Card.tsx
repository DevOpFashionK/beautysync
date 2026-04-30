import { HTMLAttributes } from "react";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const t = {
  rose: "#FF2D55",
  roseBorder: "rgba(255,45,85,0.22)",
  roseGhost: "rgba(255,45,85,0.08)",
  surface: "#0E0C0B",
  surface2: "#131110",
  border: "rgba(255,255,255,0.055)",
  borderMid: "rgba(255,255,255,0.09)",
  textPrimary: "rgba(245,242,238,0.9)",
  textMid: "rgba(245,242,238,0.45)",
  textDim: "rgba(245,242,238,0.18)",
};

// ─── Variantes ────────────────────────────────────────────────────────────────
type CardVariant = "default" | "elevated" | "rose" | "flat";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  /** Muestra el acento esquina superior derecha (motivo Dark Atelier) */
  cornerAccent?: boolean;
  /** Radial sutil en esquina superior */
  radialAccent?: boolean;
  padding?: string;
}

function getVariantStyle(variant: CardVariant): React.CSSProperties {
  const map: Record<CardVariant, React.CSSProperties> = {
    default: {
      background: t.surface,
      border: `1px solid ${t.border}`,
    },
    elevated: {
      background: t.surface2,
      border: `1px solid ${t.borderMid}`,
      boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
    },
    rose: {
      background: t.roseGhost,
      border: `1px solid ${t.roseBorder}`,
    },
    flat: {
      background: "transparent",
      border: `1px solid ${t.border}`,
    },
  };
  return map[variant];
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function Card({
  variant = "default",
  cornerAccent = false,
  radialAccent = false,
  padding = "20px",
  children,
  style,
  ...props
}: CardProps) {
  const borderRadius = "14px";

  return (
    <div
      style={{
        position: "relative",
        borderRadius,
        padding,
        overflow: "hidden",
        ...getVariantStyle(variant),
        // Radial en esquina superior izquierda
        ...(radialAccent && {
          backgroundImage: `radial-gradient(ellipse at top left, rgba(255,45,85,0.06) 0%, transparent 65%), ${
            getVariantStyle(variant).background
              ? `linear-gradient(${getVariantStyle(variant).background as string}, ${getVariantStyle(variant).background as string})`
              : ""
          }`,
          background: undefined,
        }),
        ...style,
      }}
      {...props}
    >
      {/* Acento esquina superior derecha */}
      {cornerAccent && (
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
            borderTopRightRadius: borderRadius,
            pointerEvents: "none",
          }}
        />
      )}

      {children}
    </div>
  );
}

// ─── CardHeader ───────────────────────────────────────────────────────────────
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Eyebrow label encima del título */
  eyebrow?: string;
  title?: string;
  action?: React.ReactNode;
}

export function CardHeader({
  eyebrow,
  title,
  action,
  children,
  style,
  ...props
}: CardHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "16px",
        ...style,
      }}
      {...props}
    >
      <div>
        {eyebrow && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                display: "block",
                width: "14px",
                height: "1px",
                background: "rgba(255,45,85,0.55)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-jakarta), sans-serif",
                fontSize: "10px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: "rgba(255,45,85,0.55)",
              }}
            >
              {eyebrow}
            </span>
          </div>
        )}
        {title && (
          <h2
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "20px",
              fontWeight: 300,
              color: t.textPrimary,
              margin: 0,
            }}
          >
            {title}
          </h2>
        )}
        {children}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── CardDivider ──────────────────────────────────────────────────────────────
export function CardDivider({ style }: { style?: React.CSSProperties }) {
  return (
    <hr
      style={{
        border: "none",
        borderTop: `1px solid ${t.border}`,
        margin: "16px 0",
        ...style,
      }}
    />
  );
}
