"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";

// ─── Tokens Dark Atelier ──────────────────────────────────────────────────────
const t = {
  rose: "#FF2D55",
  roseDim: "rgba(255,45,85,0.55)",
  roseGhost: "rgba(255,45,85,0.08)",
  roseGhostHv: "rgba(255,45,85,0.16)",
  roseBorder: "rgba(255,45,85,0.22)",
  surface: "#0E0C0B",
  surface2: "#131110",
  border: "rgba(255,255,255,0.055)",
  borderMid: "rgba(255,255,255,0.09)",
  textPrimary: "rgba(245,242,238,0.9)",
  textMid: "rgba(245,242,238,0.45)",
  textDim: "rgba(245,242,238,0.18)",
};

// ─── Variantes ────────────────────────────────────────────────────────────────
type Variant =
  | "primary"
  | "ghost"
  | "ghost-rose"
  | "outline"
  | "danger"
  | "subtle";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

// ─── Estilos base por variante ────────────────────────────────────────────────
function getVariantStyle(
  variant: Variant,
  disabled: boolean,
): React.CSSProperties {
  const opacity = disabled ? 0.45 : 1;

  const map: Record<Variant, React.CSSProperties> = {
    primary: {
      background: t.rose,
      border: `1px solid ${t.rose}`,
      color: "#fff",
      opacity,
    },
    ghost: {
      background: "transparent",
      border: `1px solid ${t.borderMid}`,
      color: t.textMid,
      opacity,
    },
    "ghost-rose": {
      background: t.roseGhost,
      border: `1px solid ${t.roseBorder}`,
      color: t.roseDim,
      opacity,
    },
    outline: {
      background: "transparent",
      border: `1px solid ${t.borderMid}`,
      color: t.textPrimary,
      opacity,
    },
    danger: {
      background: "rgba(255,45,85,0.12)",
      border: `1px solid rgba(255,45,85,0.30)`,
      color: "#FF2D55",
      opacity,
    },
    subtle: {
      background: t.surface2,
      border: `1px solid ${t.border}`,
      color: t.textMid,
      opacity,
    },
  };

  return map[variant];
}

function getSizeStyle(size: Size): React.CSSProperties {
  const map: Record<Size, React.CSSProperties> = {
    sm: {
      padding: "6px 14px",
      fontSize: "12px",
      borderRadius: "8px",
      gap: "6px",
    },
    md: {
      padding: "10px 20px",
      fontSize: "13px",
      borderRadius: "10px",
      gap: "8px",
    },
    lg: {
      padding: "13px 28px",
      fontSize: "14px",
      borderRadius: "12px",
      gap: "10px",
    },
  };
  return map[size];
}

// ─── Spinner inline ───────────────────────────────────────────────────────────
function InlineSpinner() {
  return (
    <span
      style={{
        width: "14px",
        height: "14px",
        border: "1.5px solid currentColor",
        borderTopColor: "transparent",
        borderRadius: "50%",
        display: "inline-block",
        animation: "btn-spin 0.7s linear infinite",
        flexShrink: 0,
      }}
    />
  );
}

// ─── Componente ───────────────────────────────────────────────────────────────
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      children,
      style,
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    const variantStyle = getVariantStyle(variant, isDisabled);
    const sizeStyle = getSizeStyle(size);

    // Hover handlers para efectos sin Tailwind
    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled) {
        const el = e.currentTarget;
        if (variant === "primary") {
          el.style.filter = "brightness(1.12)";
        } else if (variant === "ghost-rose") {
          el.style.background = t.roseGhostHv;
        } else if (variant === "ghost" || variant === "outline") {
          el.style.borderColor = t.borderMid;
          el.style.color = t.textPrimary;
        } else if (variant === "danger") {
          el.style.background = "rgba(255,45,85,0.20)";
        } else if (variant === "subtle") {
          el.style.borderColor = t.borderMid;
        }
      }
      onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled) {
        const el = e.currentTarget;
        // Restaurar estilos base
        Object.assign(el.style, variantStyle);
      }
      onMouseLeave?.(e);
    };

    return (
      <>
        {/* Keyframe para spinner */}
        <style>{`
          @keyframes btn-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>

        <button
          ref={ref}
          disabled={isDisabled}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            // Base
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-jakarta), sans-serif",
            fontWeight: 500,
            letterSpacing: "0.01em",
            cursor: isDisabled ? "not-allowed" : "pointer",
            transition: "all 0.18s ease",
            width: fullWidth ? "100%" : undefined,
            whiteSpace: "nowrap",
            userSelect: "none",
            // Variante
            ...variantStyle,
            // Tamaño
            ...sizeStyle,
            // Override externo
            ...style,
          }}
          {...props}
        >
          {loading && <InlineSpinner />}
          {children}
        </button>
      </>
    );
  },
);

Button.displayName = "Button";
