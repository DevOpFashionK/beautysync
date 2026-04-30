import { HTMLAttributes } from "react";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const t = {
  rose: "#FF2D55",
  roseDim: "rgba(255,45,85,0.55)",
  roseGhost: "rgba(255,45,85,0.08)",
  roseBorder: "rgba(255,45,85,0.22)",
  surface2: "#131110",
  border: "rgba(255,255,255,0.055)",
  borderMid: "rgba(255,255,255,0.09)",
  textPrimary: "rgba(245,242,238,0.9)",
  textMid: "rgba(245,242,238,0.45)",
  textDim: "rgba(245,242,238,0.18)",
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
type BadgeVariant =
  | "default"
  | "rose"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

type BadgeSize = "sm" | "md";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean; // muestra un punto de color a la izquierda
}

// ─── Estilos por variante ─────────────────────────────────────────────────────
const variantMap: Record<
  BadgeVariant,
  { bg: string; border: string; color: string; dot: string }
> = {
  default: {
    bg: t.surface2,
    border: t.border,
    color: t.textMid,
    dot: t.textDim,
  },
  rose: {
    bg: t.roseGhost,
    border: t.roseBorder,
    color: t.roseDim,
    dot: t.rose,
  },
  success: {
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.22)",
    color: "rgba(34,197,94,0.80)",
    dot: "rgb(34,197,94)",
  },
  warning: {
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.22)",
    color: "rgba(245,158,11,0.80)",
    dot: "rgb(245,158,11)",
  },
  error: {
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.22)",
    color: "rgba(239,68,68,0.80)",
    dot: "rgb(239,68,68)",
  },
  info: {
    bg: "rgba(99,179,237,0.08)",
    border: "rgba(99,179,237,0.22)",
    color: "rgba(99,179,237,0.80)",
    dot: "rgb(99,179,237)",
  },
  neutral: {
    bg: "rgba(255,255,255,0.04)",
    border: t.borderMid,
    color: t.textMid,
    dot: t.textDim,
  },
};

const sizeMap: Record<BadgeSize, React.CSSProperties> = {
  sm: { fontSize: "10px", padding: "2px 8px", borderRadius: "6px", gap: "5px" },
  md: {
    fontSize: "11px",
    padding: "4px 10px",
    borderRadius: "8px",
    gap: "6px",
  },
};

// ─── Componente ───────────────────────────────────────────────────────────────
export function Badge({
  variant = "default",
  size = "md",
  dot = false,
  children,
  style,
  ...props
}: BadgeProps) {
  const v = variantMap[variant];
  const s = sizeMap[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontFamily: "var(--font-jakarta), sans-serif",
        fontWeight: 500,
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
        background: v.bg,
        border: `1px solid ${v.border}`,
        color: v.color,
        lineHeight: 1,
        ...s,
        ...style,
      }}
      {...props}
    >
      {dot && (
        <span
          aria-hidden
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: v.dot,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}

// ─── StatusBadge (atajo semántico para estados de cita) ───────────────────────
type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "no_show"
  | "completed";

const statusMap: Record<
  AppointmentStatus,
  { label: string; variant: BadgeVariant }
> = {
  pending: { label: "Pendiente", variant: "warning" },
  confirmed: { label: "Confirmada", variant: "success" },
  cancelled: { label: "Cancelada", variant: "error" },
  no_show: { label: "No asistió", variant: "neutral" },
  completed: { label: "Completada", variant: "info" },
};

interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: AppointmentStatus;
}

export function StatusBadge({ status, ...props }: StatusBadgeProps) {
  const { label, variant } = statusMap[status];
  return (
    <Badge variant={variant} dot {...props}>
      {label}
    </Badge>
  );
}
