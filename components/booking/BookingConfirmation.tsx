"use client";

// components/booking/BookingConfirmation.tsx
// Fase 8.1 v2 — Pantalla de confirmación tipo "ticket de reserva" premium

import { motion } from "framer-motion";
import { Calendar, Clock, Scissors, Share2, Phone } from "lucide-react";
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

  /* Checkmark animado */
  .bc-check-wrap {
    position: relative;
    margin-bottom: 20px;
  }

  .bc-check-ring {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  /* Partículas */
  .bc-particle {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    pointer-events: none;
  }

  /* Heading */
  .bc-title {
    font-family: var(--font-cormorant), Georgia, serif;
    font-size: 2rem;
    font-weight: 600;
    line-height: 1.15;
    margin-bottom: 6px;
    letter-spacing: -0.01em;
  }

  .bc-subtitle {
    font-size: 14px;
    color: rgba(245, 242, 238, 0.45);
    margin-bottom: 24px;
    font-family: var(--font-jakarta), sans-serif;
  }

  /* Ticket de reserva */
  .bc-ticket {
    width: 100%;
    border-radius: 20px;
    overflow: hidden;
    margin-bottom: 16px;
  }

  /* Sección superior del ticket */
  .bc-ticket-top {
    padding: 20px 20px 16px;
  }

  .bc-ticket-salon {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 4px;
    font-family: var(--font-jakarta), sans-serif;
    opacity: 0.6;
  }

  .bc-ticket-service {
    font-family: var(--font-cormorant), Georgia, serif;
    font-size: 1.375rem;
    font-weight: 600;
    line-height: 1.2;
    margin-bottom: 0;
  }

  /* Separador tipo perforado */
  .bc-ticket-perf {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 0 -8px;
    margin: 0 -1px;
  }

  .bc-perf-circle-left {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--bg-base, #0D0C0B);
    flex-shrink: 0;
    margin-left: -8px;
  }

  .bc-perf-circle-right {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--bg-base, #0D0C0B);
    flex-shrink: 0;
    margin-right: -8px;
  }

  .bc-perf-line {
    flex: 1;
    border-top: 1.5px dashed rgba(255,255,255,0.1);
  }

  /* Sección inferior del ticket */
  .bc-ticket-bottom {
    padding: 16px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .bc-ticket-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .bc-ticket-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .bc-ticket-label {
    font-size: 11px;
    color: rgba(245, 242, 238, 0.35);
    margin-bottom: 2px;
    font-family: var(--font-jakarta), sans-serif;
  }

  .bc-ticket-value {
    font-size: 14px;
    font-weight: 600;
    color: rgba(245, 242, 238, 0.88);
    text-transform: capitalize;
    font-family: var(--font-jakarta), sans-serif;
  }

  /* Nota informativa */
  .bc-note {
    width: 100%;
    border-radius: 14px;
    padding: 14px 16px;
    margin-bottom: 20px;
    text-align: left;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
  }

  .bc-note-title {
    font-size: 12px;
    font-weight: 700;
    color: rgba(245, 242, 238, 0.7);
    margin-bottom: 5px;
    font-family: var(--font-jakarta), sans-serif;
  }

  .bc-note-text {
    font-size: 12px;
    color: rgba(245, 242, 238, 0.35);
    line-height: 1.6;
    font-family: var(--font-jakarta), sans-serif;
  }

  .bc-note-phone {
    font-weight: 600;
    text-decoration: underline;
  }

  /* Acciones */
  .bc-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  @media (min-width: 400px) {
    .bc-actions { flex-direction: row; }
  }

  .bc-btn-primary {
    flex: 1;
    padding: 12px 20px;
    border-radius: 12px;
    border: none;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.15s;
    font-family: var(--font-jakarta), sans-serif;
  }

  .bc-btn-primary:hover { opacity: 0.9; }

  .bc-btn-secondary {
    flex: 1;
    padding: 12px 20px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    font-size: 14px;
    font-weight: 500;
    color: rgba(245, 242, 238, 0.55);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: background 0.15s, color 0.15s;
    font-family: var(--font-jakarta), sans-serif;
  }

  .bc-btn-secondary:hover {
    background: rgba(255,255,255,0.07);
    color: rgba(245, 242, 238, 0.8);
  }
`;

// ─── Partículas de celebración ────────────────────────────────────────────────
const PARTICLES = [
  { x: 15, y: 35, delay: 0.6 },
  { x: 50, y: 15, delay: 0.68 },
  { x: 85, y: 35, delay: 0.72 },
  { x: 25, y: 60, delay: 0.76 },
  { x: 75, y: 60, delay: 0.8 },
  { x: 50, y: 70, delay: 0.84 },
];

// ─── Checkmark animado ────────────────────────────────────────────────────────
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
        fill={`${color}16`}
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
              animate={{
                scale: [0, 1, 0],
                opacity: [1, 1, 0],
                y: [-10, -50],
              }}
              transition={{ duration: 0.9, delay: p.delay, ease: "easeOut" }}
            />
          ))}

          <motion.div
            className="bc-check-ring"
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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="bc-title" style={{ color: primaryColor }}>
            ¡Reserva confirmada!
          </h2>
          <p className="bc-subtitle">Te esperamos, {firstName} 🌸</p>
        </motion.div>

        {/* ── Ticket de reserva ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62 }}
          className="bc-ticket"
          style={{
            background: `${primaryColor}10`,
            border: `1px solid ${primaryColor}28`,
          }}
        >
          {/* Top del ticket */}
          <div
            className="bc-ticket-top"
            style={{ borderBottom: `1px solid ${primaryColor}18` }}
          >
            <p className="bc-ticket-salon" style={{ color: primaryColor }}>
              {salonName}
            </p>
            <p
              className="bc-ticket-service"
              style={{ color: "rgba(245,242,238,0.92)" }}
            >
              {service.name}
            </p>
          </div>

          {/* Separador perforado */}
          <div className="bc-ticket-perf">
            <div className="bc-perf-circle-left" />
            <div className="bc-perf-line" />
            <div className="bc-perf-circle-right" />
          </div>

          {/* Bottom del ticket */}
          <div className="bc-ticket-bottom">
            {/* Fecha */}
            <div className="bc-ticket-row">
              <div
                className="bc-ticket-icon"
                style={{ background: `${primaryColor}16` }}
              >
                <Calendar size={15} style={{ color: primaryColor }} />
              </div>
              <div style={{ textAlign: "left" }}>
                <p className="bc-ticket-label">Fecha</p>
                <p className="bc-ticket-value">{selectedDateDisplay}</p>
              </div>
            </div>

            {/* Hora */}
            <div className="bc-ticket-row">
              <div
                className="bc-ticket-icon"
                style={{ background: `${primaryColor}16` }}
              >
                <Clock size={15} style={{ color: primaryColor }} />
              </div>
              <div style={{ textAlign: "left" }}>
                <p className="bc-ticket-label">Hora</p>
                <p className="bc-ticket-value">{selectedTimeDisplay}</p>
              </div>
            </div>

            {/* Servicio */}
            <div className="bc-ticket-row">
              <div
                className="bc-ticket-icon"
                style={{ background: `${primaryColor}16` }}
              >
                <Scissors size={15} style={{ color: primaryColor }} />
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

        {/* ── Nota informativa ── */}
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
                className="bc-note-phone"
                style={{ color: primaryColor }}
              >
                {salonPhone}
              </a>
            </p>
          )}
        </motion.div>

        {/* ── Acciones ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.88 }}
          className="bc-actions"
        >
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button onClick={handleShare} className="bc-btn-secondary">
              <Share2 size={14} />
              Compartir
            </button>
          )}

          <button
            onClick={onBookAnother}
            className="bc-btn-primary"
            style={{
              backgroundColor: primaryColor,
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
