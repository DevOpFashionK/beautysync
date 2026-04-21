"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";

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
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background: "linear-gradient(135deg, #2D2420 0%, #4A2E28 60%, #5C3020 100%)",
          }}
        >
          {/* Textura decorativa */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 80% 20%, rgba(212,55,95,0.4) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(201,162,39,0.3) 0%, transparent 50%)",
            }}
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <motion.div
                animate={{ rotate: [0, 8, -8, 8, 0] }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                <Sparkles size={18} style={{ color: "rgba(255,255,255,0.9)" }} />
              </motion.div>
              <div>
                <motion.p
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xs font-semibold tracking-widest uppercase mb-1"
                  style={{ color: "rgba(212,55,95,0.9)", letterSpacing: "0.14em" }}
                >
                  Bienvenida
                </motion.p>
                <motion.h2
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "1.5rem",
                    fontWeight: 500,
                    color: "#FDFBF8",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                  }}
                >
                  {salonName} está listo.
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ delay: 0.6 }}
                  className="text-sm mt-1.5 leading-relaxed"
                  style={{ color: "rgba(253,251,248,0.7)" }}
                >
                  Tienes{" "}
                  <span style={{ color: "#FDFBF8", fontWeight: 600 }}>
                    14 días de prueba gratuita
                  </span>{" "}
                  para explorar BeautySync.
                </motion.p>
              </div>
            </div>

            <button
              onClick={() => setVisible(false)}
              aria-label="Cerrar"
              className="shrink-0 p-1.5 rounded-lg transition-colors"
              style={{ color: "rgba(255,255,255,0.4)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  "rgba(255,255,255,0.8)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  "rgba(255,255,255,0.4)")
              }
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}