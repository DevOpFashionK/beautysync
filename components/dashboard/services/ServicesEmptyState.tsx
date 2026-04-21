"use client";

// components/dashboard/services/ServicesEmptyState.tsx
import { motion } from "framer-motion";
import { Plus, Scissors } from "lucide-react";

interface ServicesEmptyStateProps {
  primaryColor: string;
  onCreate: () => void;
}

export default function ServicesEmptyState({ primaryColor, onCreate }: ServicesEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-24 text-center max-w-sm mx-auto"
    >
      {/* Decorative icon */}
      <div className="relative mb-8">
        {/* Outer ring */}
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
          <Scissors size={28} style={{ color: primaryColor }} strokeWidth={1.5} />
        </div>
      </div>

      <h3 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-[#2D2420] mb-2">
        Aún no tienes servicios
      </h3>
      <p className="text-[#9C8E85] text-sm leading-relaxed mb-8">
        Agrega los servicios que ofrece tu salón para que tus clientas puedan reservar en línea.
      </p>

      <motion.button
        onClick={onCreate}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold text-sm"
        style={{
          backgroundColor: primaryColor,
          boxShadow: `0 12px 32px ${primaryColor}35`,
        }}
      >
        <Plus size={16} strokeWidth={2.5} />
        Agregar primer servicio
      </motion.button>

      {/* Hint */}
      <p className="text-xs text-[#C4B8B0] mt-6">
        Puedes usar nuestras plantillas para empezar más rápido
      </p>
    </motion.div>
  );
}