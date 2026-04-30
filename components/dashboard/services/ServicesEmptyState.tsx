"use client";

// components/dashboard/services/ServicesEmptyState.tsx
import { motion } from "framer-motion";
import { Plus, Scissors } from "lucide-react";

interface ServicesEmptyStateProps {
  primaryColor: string;
  onCreate: () => void;
}

export default function ServicesEmptyState({
  primaryColor,
  onCreate,
}: ServicesEmptyStateProps) {
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
          <Scissors
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
        Aún no tienes servicios
      </h3>
      <p
        style={{
          fontSize: "13px",
          color: "rgba(245,242,238,0.2)",
          lineHeight: 1.7,
          margin: "0 0 32px",
          letterSpacing: "0.02em",
        }}
      >
        Agrega los servicios que ofrece tu salón para que tus clientas puedan
        reservar en línea.
      </p>

      <motion.button
        onClick={onCreate}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          padding: "12px 24px",
          borderRadius: "8px",
          border: "1px solid rgba(255,45,85,0.22)",
          background: "rgba(255,45,85,0.08)",
          color: "rgba(255,45,85,0.75)",
          fontSize: "12px",
          fontWeight: 400,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          cursor: "pointer",
          transition: "all 0.2s",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            "rgba(255,45,85,0.16)";
          (e.currentTarget as HTMLElement).style.borderColor =
            "rgba(255,45,85,0.42)";
          (e.currentTarget as HTMLElement).style.color = "#FF2D55";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            "rgba(255,45,85,0.08)";
          (e.currentTarget as HTMLElement).style.borderColor =
            "rgba(255,45,85,0.22)";
          (e.currentTarget as HTMLElement).style.color = "rgba(255,45,85,0.75)";
        }}
      >
        <Plus size={14} strokeWidth={2} />
        Agregar primer servicio
      </motion.button>

      <p
        style={{
          fontSize: "11px",
          color: "rgba(245,242,238,0.12)",
          marginTop: "20px",
          letterSpacing: "0.03em",
        }}
      >
        Puedes usar nuestras plantillas para empezar más rápido
      </p>
    </motion.div>
  );
}
