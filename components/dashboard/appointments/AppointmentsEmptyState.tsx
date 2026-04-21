"use client";

// components/dashboard/appointments/AppointmentsEmptyState.tsx
import { motion } from "framer-motion";
import { CalendarX } from "lucide-react";

interface AppointmentsEmptyStateProps {
  primaryColor: string;
}

export default function AppointmentsEmptyState({ primaryColor }: AppointmentsEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-24 text-center max-w-sm mx-auto"
    >
      <div className="relative mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-dashed"
          style={{ borderColor: `${primaryColor}30`, width: 80, height: 80, margin: -8 }}
        />
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}10` }}
        >
          <CalendarX size={28} style={{ color: primaryColor }} strokeWidth={1.5} />
        </div>
      </div>

      <h3 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-[#2D2420] mb-2">
        Sin citas aún
      </h3>
      <p className="text-[#9C8E85] text-sm leading-relaxed">
        Las reservas que hagan tus clientas aparecerán aquí. Comparte tu enlace de reservas para empezar a recibir citas.
      </p>
    </motion.div>
  );
}