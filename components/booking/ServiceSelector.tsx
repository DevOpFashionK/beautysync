"use client";

// components/booking/ServiceSelector.tsx
// Fase 8.1 — Cards más ricas con precio destacado y mejor jerarquía visual

import { motion } from "framer-motion";
import { Clock, ChevronRight, Scissors, Sparkles } from "lucide-react";
import type { ServicePublicData, SelectedService } from "@/types/booking.types";

interface ServiceSelectorProps {
  services: ServicePublicData[];
  primaryColor: string;
  onSelect: (service: SelectedService) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(price);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyServices({ primaryColor }: { primaryColor: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 56,
        paddingBottom: 56,
        textAlign: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          backgroundColor: `${primaryColor}14`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 4,
        }}
      >
        <Scissors size={28} style={{ color: primaryColor }} />
      </div>
      <p
        style={{
          fontSize: "0.9375rem",
          fontWeight: 600,
          color: "#2D2420",
        }}
      >
        No hay servicios disponibles
      </p>
      <p style={{ fontSize: "0.8125rem", color: "#9C8E85" }}>
        Contacta al salón directamente
      </p>
    </div>
  );
}

// ─── Service Card ─────────────────────────────────────────────────────────────

interface ServiceCardProps {
  service: ServicePublicData;
  primaryColor: string;
  index: number;
  onSelect: (service: SelectedService) => void;
}

function ServiceCard({
  service,
  primaryColor,
  index,
  onSelect,
}: ServiceCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 + 0.1 }}
      onClick={() => onSelect(service as SelectedService)}
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.985 }}
      style={{
        width: "100%",
        textAlign: "left",
        background: "#fff",
        border: "1.5px solid #EDE8E3",
        borderRadius: 18,
        padding: "16px 18px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 14,
        transition: "border-color 0.2s, box-shadow 0.2s",
        fontFamily: "inherit",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${primaryColor}60`;
        e.currentTarget.style.boxShadow = `0 4px 20px ${primaryColor}14`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#EDE8E3";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Acento de color en el borde izquierdo */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "20%",
          bottom: "20%",
          width: 3,
          borderRadius: "0 3px 3px 0",
          backgroundColor: primaryColor,
          opacity: 0.7,
        }}
      />

      {/* Ícono */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: `${primaryColor}12`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Scissors size={20} style={{ color: primaryColor }} />
      </div>

      {/* Info central */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Nombre */}
        <p
          style={{
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: "#2D2420",
            lineHeight: 1.3,
            marginBottom: service.description ? 3 : 6,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {service.name}
        </p>

        {/* Descripción — máx 1 línea */}
        {service.description && (
          <p
            style={{
              fontSize: "0.75rem",
              color: "#9C8E85",
              marginBottom: 8,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {service.description}
          </p>
        )}

        {/* Meta: duración + precio */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Duración */}
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: "0.75rem",
              color: "#9C8E85",
            }}
          >
            <Clock size={11} />
            {formatDuration(service.duration_minutes)}
          </span>

          {/* Separador */}
          <span
            style={{
              width: 3,
              height: 3,
              borderRadius: "50%",
              backgroundColor: "#C4B8B0",
            }}
          />

          {/* Precio — destacado con color de marca */}
          <span
            style={{
              fontSize: "0.875rem",
              fontWeight: 700,
              color: primaryColor,
            }}
          >
            {formatPrice(service.price)}
          </span>
        </div>
      </div>

      {/* Flecha derecha */}
      <ChevronRight
        size={18}
        style={{
          color: primaryColor,
          opacity: 0.5,
          flexShrink: 0,
          transition: "opacity 0.15s, transform 0.15s",
        }}
      />
    </motion.button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ServiceSelector({
  services,
  primaryColor,
  onSelect,
}: ServiceSelectorProps) {
  const activeServices = services.filter((s) => s !== null);

  if (activeServices.length === 0) {
    return <EmptyServices primaryColor={primaryColor} />;
  }

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ marginBottom: 20 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <Sparkles size={14} style={{ color: primaryColor }} />
          <p
            style={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: primaryColor,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {activeServices.length}{" "}
            {activeServices.length === 1
              ? "servicio disponible"
              : "servicios disponibles"}
          </p>
        </div>

        <h2
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "1.625rem",
            fontWeight: 600,
            color: "#2D2420",
            lineHeight: 1.2,
            marginBottom: 4,
          }}
        >
          ¿Qué servicio deseas?
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "#9C8E85" }}>
          Selecciona uno para elegir fecha y hora
        </p>
      </motion.div>

      {/* Lista de servicios */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {activeServices.map((service, index) => (
          <ServiceCard
            key={service.id}
            service={service}
            primaryColor={primaryColor}
            index={index}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
