"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const t = {
  rose: "#FF2D55",
  roseDim: "rgba(255,45,85,0.55)",
  roseBorder: "rgba(255,45,85,0.22)",
  surface: "#0E0C0B",
  surface2: "#131110",
  border: "rgba(255,255,255,0.055)",
  borderMid: "rgba(255,255,255,0.09)",
  textPrimary: "rgba(245,242,238,0.9)",
  textMid: "rgba(245,242,238,0.45)",
  textDim: "rgba(245,242,238,0.18)",
  bg: "#080706",
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /** Muestra acento esquina Dark Atelier */
  cornerAccent?: boolean;
  /** Radial en esquina superior */
  radialAccent?: boolean;
  /** Evita cerrar al hacer click en backdrop */
  persistent?: boolean;
}

const sizeMap = {
  sm: "380px",
  md: "520px",
  lg: "680px",
  xl: "860px",
};

// ─── Componente ───────────────────────────────────────────────────────────────
export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  size = "md",
  cornerAccent = true,
  radialAccent = false,
  persistent = false,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Bloquear scroll del body mientras está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !persistent) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, persistent]);

  if (!open) return null;

  const maxWidth = sizeMap[size];

  const content = (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (!persistent && e.target === overlayRef.current) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(8,7,6,0.80)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        animation: "modal-overlay-in 0.18s ease",
      }}
    >
      <style>{`
        @keyframes modal-overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modal-panel-in {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        style={{
          position: "relative",
          width: "100%",
          maxWidth,
          background: t.surface,
          border: `1px solid ${t.borderMid}`,
          borderRadius: "16px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
          overflow: "hidden",
          animation: "modal-panel-in 0.22s ease",
          ...(radialAccent && {
            backgroundImage: `radial-gradient(ellipse at top left, rgba(255,45,85,0.05) 0%, transparent 60%)`,
          }),
        }}
      >
        {/* Acento esquina */}
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
              borderTopRightRadius: "16px",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Header */}
        {(title || eyebrow) && (
          <div
            style={{
              padding: "20px 24px 0",
              borderBottom: `1px solid ${t.border}`,
              paddingBottom: "16px",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
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
                    {eyebrow}
                  </span>
                </div>
              )}
              {title && (
                <h2
                  id="modal-title"
                  style={{
                    fontFamily: "var(--font-cormorant), serif",
                    fontSize: "22px",
                    fontWeight: 300,
                    color: t.textPrimary,
                    margin: 0,
                  }}
                >
                  {title}
                </h2>
              )}
            </div>

            {/* Botón cerrar */}
            <button
              onClick={onClose}
              aria-label="Cerrar"
              style={{
                background: "transparent",
                border: `1px solid ${t.border}`,
                borderRadius: "8px",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: t.textDim,
                cursor: "pointer",
                transition: "border-color 0.18s, color 0.18s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = t.borderMid;
                e.currentTarget.style.color = t.textMid;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = t.border;
                e.currentTarget.style.color = t.textDim;
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M1 1l12 12M13 1L1 13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>{children}</div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: `1px solid ${t.border}`,
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Usar portal para renderizar fuera del árbol DOM
  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
