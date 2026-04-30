"use client";

// components/dashboard/WelcomeBanner.tsx
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface WelcomeBannerProps {
  salonName: string;
}

export default function WelcomeBanner({ salonName }: WelcomeBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "12px",
            padding: "20px 24px",
            background: "#0E0C0B",
            border: "1px solid rgba(255,255,255,0.055)", // ✅ fix: 0.06 → 0.055
          }}
        >
          {/* Acento esquina superior derecha */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "16px",
              height: "16px",
              borderTop: "1px solid rgba(255,45,85,0.22)", // ✅ fix: 0.35 → 0.22
              borderRight: "1px solid rgba(255,45,85,0.22)", // ✅ fix: 0.35 → 0.22
              borderTopRightRadius: "12px",
              pointerEvents: "none",
            }}
          />

          {/* Radial sutil */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at top right, rgba(255,45,85,0.07) 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}
            >
              {/* Icono — punto pulsante */}
              <div
                style={{
                  marginTop: "3px",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "rgba(255,45,85,0.7)",
                  flexShrink: 0,
                  boxShadow: "0 0 0 3px rgba(255,45,85,0.12)",
                }}
              />

              <div>
                <motion.p
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    fontSize: "10px",
                    fontWeight: 400,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "rgba(255,45,85,0.55)", // roseDim ✅
                    marginBottom: "6px",
                  }}
                >
                  Bienvenida
                </motion.p>

                <motion.h2
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  style={{
                    fontFamily:
                      "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
                    fontSize: "1.5rem",
                    fontWeight: 300,
                    color: "rgba(245,242,238,0.9)", // textPrimary ✅
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                    margin: 0,
                  }}
                >
                  {salonName} está listo.
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  style={{
                    fontSize: "13px",
                    marginTop: "6px",
                    lineHeight: 1.65,
                    color: "rgba(245,242,238,0.18)", // ✅ fix: 0.3 → textDim 0.18
                    fontWeight: 300,
                  }}
                >
                  Tienes{" "}
                  <span style={{ color: "rgba(245,242,238,0.45)" }}>
                    {" "}
                    {/* ✅ fix: 0.65 → textMid 0.45 */}
                    14 días de prueba gratuita
                  </span>{" "}
                  para explorar BeautySync.
                </motion.p>
              </div>
            </div>

            {/* Cerrar */}
            <button
              onClick={() => setVisible(false)}
              aria-label="Cerrar"
              style={{
                flexShrink: 0,
                padding: "4px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(245,242,238,0.18)", // textDim ✅
                display: "flex",
                alignItems: "center",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  "rgba(245,242,238,0.5)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  "rgba(245,242,238,0.18)")
              }
            >
              <X size={15} strokeWidth={1.5} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
