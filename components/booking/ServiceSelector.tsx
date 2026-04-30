"use client";

// components/booking/ServiceSelector.tsx
// Diseño premium único — cards con identidad visual fuerte.
// Lógica 100% intacta.

import { motion } from "framer-motion";
import { Clock, ChevronRight, Sparkles, DollarSign } from "lucide-react";
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

function getServiceEmoji(name: string): string {
  const l = name.toLowerCase();
  if (l.includes("cejas") || l.includes("brow")) return "🪄";
  if (l.includes("cabello") || l.includes("pelo") || l.includes("corte"))
    return "✂️";
  if (l.includes("manicure") || l.includes("uñas") || l.includes("nail"))
    return "💅";
  if (l.includes("facial") || l.includes("limpieza")) return "✨";
  if (l.includes("pedicure")) return "🦶";
  if (l.includes("tinte") || l.includes("color")) return "🎨";
  if (l.includes("depilación") || l.includes("depilacion")) return "🌿";
  if (l.includes("maquillaje") || l.includes("makeup")) return "💄";
  if (l.includes("masaje") || l.includes("spa")) return "🧖‍♀️";
  if (l.includes("laminado")) return "⭐";
  return "💇‍♀️";
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = `
  .ss-header {
    margin-bottom: 24px;
  }

  .ss-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--brand-subtle, rgba(255,45,85,0.08));
    border: 1px solid var(--brand-border, rgba(255,45,85,0.22));
    border-radius: 100px;
    padding: 4px 12px 4px 8px;
    margin-bottom: 14px;
  }

  .ss-eyebrow-text {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--brand);
    font-family: var(--font-body);
  }

  .ss-title {
    font-family: var(--font-display);
    font-size: 1.8rem;
    font-weight: 300;
    color: rgba(245,242,238,0.92);
    line-height: 1.1;
    margin-bottom: 6px;
    letter-spacing: -0.025em;
  }

  .ss-subtitle {
    font-size: 13px;
    color: rgba(245,242,238,0.3);
    font-family: var(--font-body);
    letter-spacing: 0.02em;
  }

  /* ── Card ── */
  .ss-card {
    width: 100%;
    text-align: left;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 16px 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 14px;
    font-family: inherit;
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s, background 0.2s;
  }

  .ss-card:hover {
    border-color: rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.045);
  }

  /* Línea de acento izquierda */
  .ss-accent {
    position: absolute;
    left: 0;
    top: 16%;
    bottom: 16%;
    width: 2px;
    border-radius: 0 2px 2px 0;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .ss-card:hover .ss-accent { opacity: 0.7; }

  /* Ícono */
  .ss-icon {
    width: 46px;
    height: 46px;
    border-radius: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 22px;
    transition: transform 0.2s;
  }

  .ss-card:hover .ss-icon { transform: scale(1.06); }

  /* Info */
  .ss-info { flex: 1; min-width: 0; }

  .ss-name {
    font-size: 14px;
    font-weight: 500;
    color: rgba(245,242,238,0.88);
    line-height: 1.3;
    margin-bottom: 3px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--font-body);
  }

  .ss-desc {
    font-size: 11px;
    color: rgba(245,242,238,0.28);
    margin-bottom: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--font-body);
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
    font-size: 11px;
    color: rgba(245,242,238,0.3);
    font-family: var(--font-body);
  }

  .ss-sep {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: rgba(245,242,238,0.15);
  }

  /* Precio — protagonista */
  .ss-price-wrap {
    flex-shrink: 0;
    text-align: right;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }

  .ss-price {
    font-family: var(--font-display);
    font-size: 1.35rem;
    font-weight: 300;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  /* Flecha */
  .ss-arrow {
    flex-shrink: 0;
    opacity: 0.18;
    transition: opacity 0.2s, transform 0.2s;
  }

  .ss-card:hover .ss-arrow {
    opacity: 0.55;
    transform: translateX(3px);
  }

  /* Empty */
  .ss-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
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
    font-size: 24px;
    margin-bottom: 4px;
  }

  .ss-empty-title {
    font-size: 15px;
    color: rgba(245,242,238,0.5);
    font-family: var(--font-body);
  }

  .ss-empty-sub {
    font-size: 12px;
    color: rgba(245,242,238,0.2);
    font-family: var(--font-body);
  }
`;

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
function ServiceCard({
  service,
  primaryColor,
  index,
  onSelect,
}: {
  service: ServicePublicData;
  primaryColor: string;
  index: number;
  onSelect: (service: SelectedService) => void;
}) {
  const emoji = getServiceEmoji(service.name);

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 + 0.06 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => onSelect(service as SelectedService)}
      className="ss-card"
    >
      {/* Acento lateral */}
      <div className="ss-accent" style={{ background: primaryColor }} />

      {/* Emoji icon */}
      <div className="ss-icon" style={{ background: `${primaryColor}14` }}>
        {emoji}
      </div>

      {/* Info */}
      <div className="ss-info">
        <p className="ss-name">{service.name}</p>
        {service.description && (
          <p className="ss-desc">{service.description}</p>
        )}
        <div className="ss-meta">
          <span className="ss-duration">
            <Clock size={10} strokeWidth={1.75} />
            {formatDuration(service.duration_minutes)}
          </span>
        </div>
      </div>

      {/* Precio */}
      <div className="ss-price-wrap">
        <span className="ss-price" style={{ color: primaryColor }}>
          {formatPrice(service.price)}
        </span>
      </div>

      {/* Flecha */}
      <ChevronRight
        size={16}
        strokeWidth={1.5}
        className="ss-arrow"
        style={{ color: "rgba(245,242,238,0.8)" }}
      />
    </motion.button>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ServiceSelector({
  services,
  primaryColor,
  onSelect,
}: ServiceSelectorProps) {
  const active = services.filter((s) => s !== null);

  if (active.length === 0) {
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
          <Sparkles
            size={10}
            strokeWidth={1.75}
            style={{ color: primaryColor }}
          />
          <span className="ss-eyebrow-text">
            {active.length} {active.length === 1 ? "servicio" : "servicios"}
          </span>
        </div>
        <h2 className="ss-title">¿Qué servicio deseas?</h2>
        <p className="ss-subtitle">Selecciona uno para continuar</p>
      </motion.div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {active.map((service, i) => (
          <ServiceCard
            key={service.id}
            service={service}
            primaryColor={primaryColor}
            index={i}
            onSelect={onSelect}
          />
        ))}
      </div>
    </>
  );
}
