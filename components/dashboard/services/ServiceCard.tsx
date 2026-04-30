"use client";

// components/dashboard/services/ServiceCard.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, DollarSign, Pencil, Power, MoreVertical } from "lucide-react";
import type { ServiceItem } from "./ServicesClient";

interface ServiceCardProps {
  service: ServiceItem;
  primaryColor: string;
  index: number;
  onEdit: (service: ServiceItem) => void;
  onToggleActive: (service: ServiceItem) => void;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(price);
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function ServiceCard({
  service,
  primaryColor,
  index,
  onEdit,
  onToggleActive,
}: ServiceCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = service.is_active !== false;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="group"
      style={{
        position: "relative",
        background: "#0E0C0B",
        borderRadius: "10px",
        border: `1px solid ${isActive ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.03)"}`,
        overflow: "hidden",
        transition: "border-color 0.2s, transform 0.15s",
        opacity: isActive ? 1 : 0.45,
      }}
      onMouseEnter={(e) => {
        if (isActive) {
          (e.currentTarget as HTMLElement).style.borderColor =
            "rgba(255,255,255,0.1)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = isActive
          ? "rgba(255,255,255,0.055)"
          : "rgba(255,255,255,0.03)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Barra superior — primaryColor si activo, dim si no */}
      <div
        style={{
          height: "2px",
          background: isActive
            ? `linear-gradient(90deg, ${primaryColor}, ${primaryColor}44)`
            : "rgba(255,255,255,0.04)",
          transition: "background 0.3s",
        }}
      />

      <div style={{ padding: "18px" }}>
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "8px",
            marginBottom: "10px",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badge inactivo */}
            {!isActive && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "9px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(245,242,238,0.25)",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  padding: "2px 8px",
                  borderRadius: "20px",
                  marginBottom: "8px",
                }}
              >
                Inactivo
              </span>
            )}
            <h3
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
                fontSize: "1.2rem",
                fontWeight: 300,
                color: "rgba(245,242,238,0.85)",
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                margin: 0,
              }}
            >
              {service.name}
            </h3>
          </div>

          {/* Menú */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="group-hover:opacity-100"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(245,242,238,0.2)",
                background: "none",
                border: "none",
                cursor: "pointer",
                opacity: 0,
                transition: "color 0.2s, background 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(255,255,255,0.05)";
                (e.currentTarget as HTMLElement).style.color =
                  "rgba(245,242,238,0.5)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "none";
                (e.currentTarget as HTMLElement).style.color =
                  "rgba(245,242,238,0.2)";
              }}
            >
              <MoreVertical size={14} strokeWidth={1.5} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <>
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 10 }}
                    onClick={() => setMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "32px",
                      zIndex: 20,
                      background: "#131110",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "8px",
                      overflow: "hidden",
                      width: "140px",
                      boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                    }}
                  >
                    <button
                      onClick={() => {
                        onEdit(service);
                        setMenuOpen(false);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 14px",
                        fontSize: "12px",
                        color: "rgba(245,242,238,0.6)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s, color 0.15s",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          "rgba(255,255,255,0.05)";
                        (e.currentTarget as HTMLElement).style.color =
                          "rgba(245,242,238,0.85)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          "none";
                        (e.currentTarget as HTMLElement).style.color =
                          "rgba(245,242,238,0.6)";
                      }}
                    >
                      <Pencil size={12} strokeWidth={1.75} />
                      Editar
                    </button>
                    <div
                      style={{
                        height: "1px",
                        background: "rgba(255,255,255,0.05)",
                        margin: "0 10px",
                      }}
                    />
                    <button
                      onClick={() => {
                        onToggleActive(service);
                        setMenuOpen(false);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 14px",
                        fontSize: "12px",
                        color: isActive
                          ? "rgba(251,191,36,0.7)"
                          : "rgba(52,211,153,0.7)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          "rgba(255,255,255,0.05)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          "none";
                      }}
                    >
                      <Power size={12} strokeWidth={1.75} />
                      {isActive ? "Desactivar" : "Activar"}
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Descripción */}
        {service.description && (
          <p
            style={{
              fontSize: "11px",
              color: "rgba(245,242,238,0.2)",
              lineHeight: 1.65,
              marginBottom: "12px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {service.description}
          </p>
        )}

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            paddingTop: "12px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "5px",
                background: `${primaryColor}12`,
                border: `1px solid ${primaryColor}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Clock
                size={10}
                strokeWidth={1.75}
                style={{ color: `${primaryColor}99` }}
              />
            </div>
            <span style={{ fontSize: "11px", color: "rgba(245,242,238,0.4)" }}>
              {formatDuration(service.duration_minutes)}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "5px",
                background: `${primaryColor}12`,
                border: `1px solid ${primaryColor}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DollarSign
                size={10}
                strokeWidth={1.75}
                style={{ color: `${primaryColor}99` }}
              />
            </div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 400,
                color: `${primaryColor}CC`,
              }}
            >
              {formatPrice(service.price)}
            </span>
          </div>
        </div>

        {/* Quick edit — visible on hover */}
        <motion.button
          onClick={() => onEdit(service)}
          className="group-hover:opacity-100"
          style={{
            position: "absolute",
            bottom: "14px",
            right: "14px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 10px",
            borderRadius: "6px",
            border: `1px solid ${primaryColor}30`,
            background: `${primaryColor}10`,
            fontSize: "10px",
            letterSpacing: "0.06em",
            color: `${primaryColor}CC`,
            opacity: 0,
            cursor: "pointer",
            transition: "opacity 0.2s, background 0.15s",
            fontFamily: "inherit",
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              `${primaryColor}20`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              `${primaryColor}10`;
          }}
        >
          <Pencil size={10} strokeWidth={1.75} />
          Editar
        </motion.button>
      </div>
    </motion.div>
  );
}
