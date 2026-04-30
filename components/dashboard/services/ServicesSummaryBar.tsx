"use client";

// components/dashboard/services/ServicesSummaryBar.tsx
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

interface ServicesSummaryBarProps {
  totalServices: number;
  inactiveCount: number;
  primaryColor: string;
}

export default function ServicesSummaryBar({
  totalServices,
  inactiveCount,
  primaryColor,
}: ServicesSummaryBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "20px",
        marginTop: "24px",
        paddingTop: "20px",
        borderTop: "1px solid rgba(255,255,255,0.055)",
      }}
    >
      {/* Activos */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "7px",
            background: `${primaryColor}12`,
            border: `1px solid ${primaryColor}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Eye
            size={13}
            strokeWidth={1.75}
            style={{ color: `${primaryColor}CC` }}
          />
        </div>
        <div>
          <p
            style={{
              fontFamily:
                "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "1.4rem",
              fontWeight: 300,
              lineHeight: 1,
              color: `${primaryColor}CC`,
              margin: 0,
            }}
          >
            {totalServices}
          </p>
          <p
            style={{
              fontSize: "10px",
              color: "rgba(245,242,238,0.2)",
              margin: 0,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {totalServices === 1 ? "servicio activo" : "servicios activos"}
          </p>
        </div>
      </div>

      {/* Inactivos */}
      {inactiveCount > 0 && (
        <>
          <div
            style={{
              width: "1px",
              height: "28px",
              background: "rgba(255,255,255,0.06)",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "7px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <EyeOff
                size={13}
                strokeWidth={1.75}
                style={{ color: "rgba(245,242,238,0.2)" }}
              />
            </div>
            <div>
              <p
                style={{
                  fontFamily:
                    "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
                  fontSize: "1.4rem",
                  fontWeight: 300,
                  lineHeight: 1,
                  color: "rgba(245,242,238,0.25)",
                  margin: 0,
                }}
              >
                {inactiveCount}
              </p>
              <p
                style={{
                  fontSize: "10px",
                  color: "rgba(245,242,238,0.15)",
                  margin: 0,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                inactivos
              </p>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
