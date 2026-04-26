"use client";

// components/booking/ServiceSelector.tsx
// Fase 8.1 v2 — Cards de servicio adaptadas a la estética oscura premium

import { motion } from "framer-motion";
import { Clock, ChevronRight, Sparkles } from "lucide-react";
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

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = `
  .ss-header {
    margin-bottom: 20px;
  }

  .ss-eyebrow {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }

  .ss-eyebrow-text {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-brand);
    font-family: var(--font-jakarta), sans-serif;
  }

  .ss-title {
    font-family: var(--font-cormorant), Georgia, serif;
    font-size: 1.75rem;
    font-weight: 600;
    color: rgba(245, 242, 238, 0.95);
    line-height: 1.15;
    margin-bottom: 4px;
    letter-spacing: -0.01em;
  }

  .ss-subtitle {
    font-size: 13px;
    color: rgba(245, 242, 238, 0.4);
    font-family: var(--font-jakarta), sans-serif;
  }

  /* ── Service card ── */
  .ss-card {
    width: 100%;
    text-align: left;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    padding: 16px 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 14px;
    transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
    font-family: inherit;
    position: relative;
    overflow: hidden;
  }

  .ss-card:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(255, 255, 255, 0.16);
  }

  /* Línea de acento izquierda */
  .ss-card-accent {
    position: absolute;
    left: 0;
    top: 18%;
    bottom: 18%;
    width: 3px;
    border-radius: 0 3px 3px 0;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .ss-card:hover .ss-card-accent {
    opacity: 1;
  }

  /* Ícono del servicio */
  .ss-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 20px;
    transition: transform 0.2s;
  }

  .ss-card:hover .ss-icon {
    transform: scale(1.05);
  }

  /* Info del servicio */
  .ss-info {
    flex: 1;
    min-width: 0;
  }

  .ss-name {
    font-size: 15px;
    font-weight: 600;
    color: rgba(245, 242, 238, 0.92);
    line-height: 1.3;
    margin-bottom: 3px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--font-jakarta), sans-serif;
  }

  .ss-description {
    font-size: 12px;
    color: rgba(245, 242, 238, 0.38);
    margin-bottom: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--font-jakarta), sans-serif;
  }

  .ss-meta {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .ss-duration {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: rgba(245, 242, 238, 0.38);
    font-family: var(--font-jakarta), sans-serif;
  }

  .ss-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: rgba(245, 242, 238, 0.2);
  }

  .ss-price {
    font-size: 15px;
    font-weight: 700;
    font-family: var(--font-jakarta), sans-serif;
  }

  /* Flecha derecha */
  .ss-arrow {
    flex-shrink: 0;
    opacity: 0.25;
    transition: opacity 0.2s, transform 0.2s;
    color: rgba(245, 242, 238, 0.8);
  }

  .ss-card:hover .ss-arrow {
    opacity: 0.7;
    transform: translateX(3px);
  }

  /* Empty state */
  .ss-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 56px 0;
    text-align: center;
    gap: 10px;
  }

  .ss-empty-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
    font-size: 24px;
  }

  .ss-empty-title {
    font-size: 15px;
    font-weight: 600;
    color: rgba(245, 242, 238, 0.7);
    font-family: var(--font-jakarta), sans-serif;
  }

  .ss-empty-sub {
    font-size: 13px;
    color: rgba(245, 242, 238, 0.3);
    font-family: var(--font-jakarta), sans-serif;
  }
`;

// ─── Íconos por servicio (emoji semántico según nombre) ───────────────────────
function getServiceEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("cejas") || lower.includes("brow")) return "🪄";
  if (
    lower.includes("cabello") ||
    lower.includes("pelo") ||
    lower.includes("corte")
  )
    return "✂️";
  if (
    lower.includes("manicure") ||
    lower.includes("uñas") ||
    lower.includes("nail")
  )
    return "💅";
  if (lower.includes("facial") || lower.includes("limpieza")) return "✨";
  if (lower.includes("pedicure")) return "🦶";
  if (lower.includes("tinte") || lower.includes("color")) return "🎨";
  if (lower.includes("depilación") || lower.includes("depilacion")) return "🌿";
  if (lower.includes("maquillaje") || lower.includes("makeup")) return "💄";
  if (lower.includes("masaje") || lower.includes("spa")) return "🧖‍♀️";
  if (lower.includes("laminado")) return "⭐";
  return "💇‍♀️";
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyServices({ primaryColor }: { primaryColor: string }) {
  return (
    <div className="ss-empty">
      <div
        className="ss-empty-icon"
        style={{ background: `${primaryColor}14` }}
      >
        💇‍♀️
      </div>
      <p className="ss-empty-title">Sin servicios disponibles</p>
      <p className="ss-empty-sub">Contacta al salón directamente</p>
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
  const emoji = getServiceEmoji(service.name);

  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.07 + 0.08 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => onSelect(service as SelectedService)}
      className="ss-card"
    >
      {/* Acento izquierdo */}
      <div
        className="ss-card-accent"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Ícono emoji */}
      <div className="ss-icon" style={{ background: `${primaryColor}16` }}>
        {emoji}
      </div>

      {/* Info */}
      <div className="ss-info">
        <p className="ss-name">{service.name}</p>

        {service.description && (
          <p className="ss-description">{service.description}</p>
        )}

        <div className="ss-meta">
          <span className="ss-duration">
            <Clock size={11} />
            {formatDuration(service.duration_minutes)}
          </span>
          <span className="ss-dot" />
          <span className="ss-price" style={{ color: primaryColor }}>
            {formatPrice(service.price)}
          </span>
        </div>
      </div>

      {/* Flecha */}
      <ChevronRight size={18} className="ss-arrow" />
    </motion.button>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ServiceSelector({
  services,
  primaryColor,
  onSelect,
}: ServiceSelectorProps) {
  const activeServices = services.filter((s) => s !== null);

  if (activeServices.length === 0) {
    return (
      <>
        <style>{styles}</style>
        <EmptyServices primaryColor={primaryColor} />
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="ss-header"
      >
        <div className="ss-eyebrow">
          <Sparkles size={11} color={primaryColor} />
          <span className="ss-eyebrow-text">
            {activeServices.length}{" "}
            {activeServices.length === 1
              ? "servicio disponible"
              : "servicios disponibles"}
          </span>
        </div>
        <h2 className="ss-title">¿Qué servicio deseas?</h2>
        <p className="ss-subtitle">Selecciona uno para continuar</p>
      </motion.div>

      {/* Lista */}
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
    </>
  );
}
