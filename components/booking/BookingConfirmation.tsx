"use client";

// components/booking/BookingConfirmation.tsx
import { motion } from "framer-motion";
import { Check, Calendar, Clock, Scissors, Phone, Share2 } from "lucide-react";
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

// Animated checkmark SVG
function AnimatedCheck({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 52 52" className="w-full h-full" fill="none">
      <motion.circle
        cx="26"
        cy="26"
        r="24"
        stroke={color}
        strokeWidth="2"
        fill={`${color}14`}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      <motion.path
        d="M14 26 L22 34 L38 18"
        stroke={color}
        strokeWidth="3"
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

// Floating particles
function Particle({ color, delay, x, y }: { color: string; delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full"
      style={{ backgroundColor: color, left: `${x}%`, top: `${y}%` }}
      initial={{ scale: 0, opacity: 1 }}
      animate={{
        scale: [0, 1, 0],
        opacity: [1, 1, 0],
        y: [-20, -60],
        x: [0, (Math.random() - 0.5) * 40],
      }}
      transition={{ duration: 1, delay, ease: "easeOut" }}
    />
  );
}

const particles = [
  { x: 20, y: 40 }, { x: 50, y: 20 }, { x: 80, y: 40 },
  { x: 30, y: 60 }, { x: 70, y: 60 }, { x: 45, y: 30 },
];

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
        // User cancelled
      }
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      {/* Animated icon */}
      <div className="relative mb-6">
        {particles.map((p, i) => (
          <Particle
            key={i}
            color={primaryColor}
            delay={0.6 + i * 0.08}
            x={p.x}
            y={p.y}
          />
        ))}

        <motion.div
          className="w-20 h-20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
        >
          <AnimatedCheck color={primaryColor} />
        </motion.div>
      </div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2
          className="font-['Cormorant_Garamond'] text-3xl font-semibold leading-tight"
          style={{ color: primaryColor }}
        >
          ¡Reserva confirmada!
        </h2>
        <p className="text-[#9C8E85] text-sm mt-2">
          Te esperamos, {firstName} 🌸
        </p>
      </motion.div>

      {/* Details card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="w-full mt-6 rounded-2xl border border-[#EDE8E3] bg-white p-5 text-left"
      >
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${primaryColor}14` }}
            >
              <Scissors size={16} style={{ color: primaryColor }} />
            </div>
            <div>
              <p className="text-xs text-[#9C8E85]">Servicio</p>
              <p className="text-sm font-semibold text-[#2D2420]">{service.name}</p>
            </div>
          </div>

          <div className="h-px bg-[#EDE8E3]" />

          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${primaryColor}14` }}
            >
              <Calendar size={16} style={{ color: primaryColor }} />
            </div>
            <div>
              <p className="text-xs text-[#9C8E85]">Fecha</p>
              <p className="text-sm font-semibold text-[#2D2420] capitalize">
                {selectedDateDisplay}
              </p>
            </div>
          </div>

          <div className="h-px bg-[#EDE8E3]" />

          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${primaryColor}14` }}
            >
              <Clock size={16} style={{ color: primaryColor }} />
            </div>
            <div>
              <p className="text-xs text-[#9C8E85]">Hora</p>
              <p className="text-sm font-semibold text-[#2D2420]">{selectedTimeDisplay}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Info note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="w-full mt-4 rounded-xl border border-[#EDE8E3] bg-[#FAF8F5] px-4 py-3 text-left"
      >
        <p className="text-xs font-semibold text-[#2D2420] mb-1">
          📲 Te recordaremos tu cita
        </p>
        <p className="text-xs text-[#9C8E85] leading-relaxed">
          Recibirás un recordatorio 24 horas antes. Si no confirmas,
          la reserva se cancelará automáticamente.
        </p>
        {salonPhone && (
          <p className="text-xs text-[#9C8E85] mt-2">
            Para cancelar antes, contacta al salón:{" "}
            <a
              href={`tel:${salonPhone}`}
              className="font-medium underline"
              style={{ color: primaryColor }}
            >
              {salonPhone}
            </a>
          </p>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="flex flex-col sm:flex-row gap-3 w-full mt-6"
      >
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                       border border-[#EDE8E3] text-sm font-medium text-[#9C8E85]
                       hover:bg-[#FAF8F5] transition-colors"
          >
            <Share2 size={15} />
            Compartir
          </button>
        )}

        <button
          onClick={onBookAnother}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white
                     transition-all duration-200 hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
        >
          Nueva reserva
        </button>
      </motion.div>
    </div>
  );
}