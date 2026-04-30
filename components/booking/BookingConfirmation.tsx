"use client";

// components/booking/BookingConfirmation.tsx
// Pantalla de confirmación tipo ticket premium. Lógica intacta.

import { motion } from "framer-motion";
import { Calendar, Clock, Scissors, Share2 } from "lucide-react";
import type { SelectedService } from "@/types/booking.types";

interface BookingConfirmationProps {
  salonName: string;
  salonPhone: string | null;
  service: SelectedService;
  selectedDateDisplay: string;
  selectedTimeDisplay: string;
  clientName: string;
  primaryColor: string;
  onBookAnother: () => void;
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = `
  .bc-root {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  /* Checkmark */
  .bc-check-wrap {
    position: relative;
    margin-bottom: 22px;
  }

  .bc-particle {
    position: absolute;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    pointer-events: none;
  }

  /* Heading */
  .bc-title {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 300;
    line-height: 1.1;
    margin-bottom: 5px;
    letter-spacing: -0.025em;
  }

  .bc-subtitle {
    font-size: 13px;
    color: rgba(245,242,238,0.35);
    margin-bottom: 24px;
    font-family: var(--font-body);
    letter-spacing: 0.02em;
  }

  /* Ticket */
  .bc-ticket {
    width: 100%;
    border-radius: 18px;
    overflow: hidden;
    margin-bottom: 14px;
  }

  .bc-ticket-top {
    padding: 18px 20px 14px;
  }

  .bc-ticket-salon {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 4px;
    font-family: var(--font-body);
    opacity: 0.55;
  }

  .bc-ticket-service {
    font-family: var(--font-display);
    font-size: 1.4rem;
    font-weight: 300;
    line-height: 1.15;
    letter-spacing: -0.02em;
  }

  /* Perforado */
  .bc-perf {
    display: flex;
    align-items: center;
    margin: 0 -1px;
  }

  .bc-perf-left {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--bg, #080706);
    flex-shrink: 0;
    margin-left: -7px;
  }

  .bc-perf-right {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--bg, #080706);
    flex-shrink: 0;
    margin-right: -7px;
  }

  .bc-perf-line {
    flex: 1;
    border-top: 1.5px dashed rgba(255,255,255,0.08);
  }

  .bc-ticket-bottom {
    padding: 14px 20px 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .bc-ticket-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .bc-ticket-icon {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .bc-ticket-label {
    font-size: 10px;
    color: rgba(245,242,238,0.3);
    margin-bottom: 2px;
    font-family: var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .bc-ticket-value {
    font-size: 13px;
    font-weight: 500;
    color: rgba(245,242,238,0.82);
    text-transform: capitalize;
    font-family: var(--font-body);
    letter-spacing: 0.01em;
  }

  /* Nota */
  .bc-note {
    width: 100%;
    border-radius: 13px;
    padding: 13px 15px;
    margin-bottom: 18px;
    text-align: left;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.06);
  }

  .bc-note-title {
    font-size: 12px;
    font-weight: 600;
    color: rgba(245,242,238,0.55);
    margin-bottom: 5px;
    font-family: var(--font-body);
  }

  .bc-note-text {
    font-size: 12px;
    color: rgba(245,242,238,0.28);
    line-height: 1.6;
    font-family: var(--font-body);
    letter-spacing: 0.01em;
  }

  .bc-phone-link {
    font-weight: 500;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  /* Acciones */
  .bc-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  @media (min-width: 380px) {
    .bc-actions { flex-direction: row; }
  }

  .bc-btn-primary {
    flex: 1;
    padding: 12px 20px;
    border-radius: 11px;
    border: none;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    cursor: pointer;
    font-family: var(--font-body);
    letter-spacing: 0.04em;
    transition: opacity 0.15s;
  }

  .bc-btn-primary:hover { opacity: 0.9; }

  .bc-btn-secondary {
    flex: 1;
    padding: 12px 20px;
    border-radius: 11px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    font-size: 13px;
    font-weight: 500;
    color: rgba(245,242,238,0.45);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-family: var(--font-body);
    letter-spacing: 0.04em;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }

  .bc-btn-secondary:hover {
    background: rgba(255,255,255,0.06);
    color: rgba(245,242,238,0.7);
    border-color: rgba(255,255,255,0.14);
  }
`;

// ─── Partículas — intactas ────────────────────────────────────────────────────
const PARTICLES = [
  { x: 15, y: 35, delay: 0.6 },
  { x: 50, y: 15, delay: 0.68 },
  { x: 85, y: 35, delay: 0.72 },
  { x: 25, y: 60, delay: 0.76 },
  { x: 75, y: 60, delay: 0.8 },
  { x: 50, y: 70, delay: 0.84 },
];

// ─── Checkmark animado — intacto ─────────────────────────────────────────────
function AnimatedCheck({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 52 52"
      style={{ width: "100%", height: "100%" }}
      fill="none"
    >
      <motion.circle
        cx="26"
        cy="26"
        r="24"
        stroke={color}
        strokeWidth="1.5"
        fill={`${color}14`}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      <motion.path
        d="M14 26 L22 34 L38 18"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
      />
    </svg>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function BookingConfirmation({
  salonName,
  salonPhone,
  service,
  selectedDateDisplay,
  selectedTimeDisplay,
  clientName,
  primaryColor,
  onBookAnother,
}: BookingConfirmationProps) {
  const firstName = clientName.split(" ")[0];

  // ── handleShare — lógica intacta ──────────────────────────────────────────
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Reserva en ${salonName}`,
          text: `Tengo cita para ${service.name} el ${selectedDateDisplay} a las ${selectedTimeDisplay} en ${salonName}`,
        });
      } catch {
        /* usuario canceló */
      }
    }
  };

  return (
    <>
      <style>{styles}</style>

      <div className="bc-root">
        {/* ── Checkmark con partículas ── */}
        <div className="bc-check-wrap">
          {PARTICLES.map((p, i) => (
            <motion.div
              key={i}
              className="bc-particle"
              style={{
                backgroundColor: primaryColor,
                left: `${p.x}%`,
                top: `${p.y}%`,
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 1, 0], opacity: [1, 1, 0], y: [-10, -55] }}
              transition={{ duration: 0.9, delay: p.delay, ease: "easeOut" }}
            />
          ))}

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 20,
              delay: 0.1,
            }}
            style={{ width: 72, height: 72 }}
          >
            <AnimatedCheck color={primaryColor} />
          </motion.div>
        </div>

        {/* ── Heading ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="bc-title" style={{ color: primaryColor }}>
            ¡Reserva confirmada!
          </h2>
          <p className="bc-subtitle">Te esperamos, {firstName} 🌸</p>
        </motion.div>

        {/* ── Ticket ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62 }}
          className="bc-ticket"
          style={{
            background: `${primaryColor}0E`,
            border: `1px solid ${primaryColor}22`,
          }}
        >
          {/* Top */}
          <div
            className="bc-ticket-top"
            style={{ borderBottom: `1px solid ${primaryColor}15` }}
          >
            <p className="bc-ticket-salon" style={{ color: primaryColor }}>
              {salonName}
            </p>
            <p
              className="bc-ticket-service"
              style={{ color: "rgba(245,242,238,0.88)" }}
            >
              {service.name}
            </p>
          </div>

          {/* Perforado */}
          <div className="bc-perf">
            <div className="bc-perf-left" />
            <div className="bc-perf-line" />
            <div className="bc-perf-right" />
          </div>

          {/* Bottom */}
          <div className="bc-ticket-bottom">
            <div className="bc-ticket-row">
              <div
                className="bc-ticket-icon"
                style={{ background: `${primaryColor}14` }}
              >
                <Calendar
                  size={14}
                  strokeWidth={1.75}
                  style={{ color: primaryColor }}
                />
              </div>
              <div style={{ textAlign: "left" }}>
                <p className="bc-ticket-label">Fecha</p>
                <p className="bc-ticket-value">{selectedDateDisplay}</p>
              </div>
            </div>

            <div className="bc-ticket-row">
              <div
                className="bc-ticket-icon"
                style={{ background: `${primaryColor}14` }}
              >
                <Clock
                  size={14}
                  strokeWidth={1.75}
                  style={{ color: primaryColor }}
                />
              </div>
              <div style={{ textAlign: "left" }}>
                <p className="bc-ticket-label">Hora</p>
                <p className="bc-ticket-value">{selectedTimeDisplay}</p>
              </div>
            </div>

            <div className="bc-ticket-row">
              <div
                className="bc-ticket-icon"
                style={{ background: `${primaryColor}14` }}
              >
                <Scissors
                  size={14}
                  strokeWidth={1.75}
                  style={{ color: primaryColor }}
                />
              </div>
              <div style={{ textAlign: "left" }}>
                <p className="bc-ticket-label">Duración aprox.</p>
                <p className="bc-ticket-value">
                  {service.duration_minutes < 60
                    ? `${service.duration_minutes} minutos`
                    : `${Math.floor(service.duration_minutes / 60)}h${service.duration_minutes % 60 > 0 ? ` ${service.duration_minutes % 60}min` : ""}`}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Nota ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.78 }}
          className="bc-note"
        >
          <p className="bc-note-title">📲 Te recordaremos tu cita</p>
          <p className="bc-note-text">
            Recibirás un recordatorio 24 horas antes. Si no confirmas, la
            reserva se cancelará automáticamente.
          </p>
          {salonPhone && (
            <p className="bc-note-text" style={{ marginTop: 6 }}>
              Para cancelar antes, contacta al salón:{" "}
              <a
                href={`tel:${salonPhone}`}
                className="bc-phone-link"
                style={{ color: primaryColor }}
              >
                {salonPhone}
              </a>
            </p>
          )}
        </motion.div>

        {/* ── Acciones ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.88 }}
          className="bc-actions"
        >
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button onClick={handleShare} className="bc-btn-secondary">
              <Share2 size={13} strokeWidth={1.75} />
              Compartir
            </button>
          )}
          <button
            onClick={onBookAnother}
            className="bc-btn-primary"
            style={{
              background: primaryColor,
              boxShadow: `0 8px 24px ${primaryColor}30`,
            }}
          >
            Nueva reserva
          </button>
        </motion.div>
      </div>
    </>
  );
}
