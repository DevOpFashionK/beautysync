"use client";

// components/dashboard/appointments/AppointmentsEmptyState.tsx
import { motion } from "framer-motion";
import { CalendarX } from "lucide-react";

interface AppointmentsEmptyStateProps {
  primaryColor: string;
}

export default function AppointmentsEmptyState({
  primaryColor,
}: AppointmentsEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 0",
        textAlign: "center",
        maxWidth: "320px",
        margin: "0 auto",
      }}
    >
      {/* Ícono con anillo giratorio */}
      <div style={{ position: "relative", marginBottom: "28px" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            top: "-8px",
            left: "-8px",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            border: `1px dashed ${primaryColor}30`,
          }}
        />
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "14px",
            background: `${primaryColor}10`,
            border: `1px solid ${primaryColor}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CalendarX
            size={26}
            strokeWidth={1.25}
            style={{ color: `${primaryColor}99` }}
          />
        </div>
      </div>

      <h3
        style={{
          fontFamily:
            "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
          fontSize: "1.6rem",
          fontWeight: 300,
          color: "rgba(245,242,238,0.6)",
          letterSpacing: "-0.02em",
          margin: "0 0 10px",
        }}
      >
        Sin citas aún
      </h3>
      <p
        style={{
          fontSize: "13px",
          color: "rgba(245,242,238,0.2)",
          lineHeight: 1.7,
          margin: 0,
          letterSpacing: "0.02em",
        }}
      >
        Las reservas que hagan tus clientas aparecerán aquí. Comparte tu enlace
        de reservas para empezar a recibir citas.
      </p>
    </motion.div>
  );
}
