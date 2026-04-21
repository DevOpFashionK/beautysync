"use client";

// components/dashboard/clients/ClientsEmptyState.tsx
import { motion } from "framer-motion";
import { Users } from "lucide-react";

export default function ClientsEmptyState({ primaryColor }: { primaryColor: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
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
          <Users size={28} style={{ color: primaryColor }} strokeWidth={1.5} />
        </div>
      </div>

      <h3 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-[#2D2420] mb-2">
        Sin clientas aún
      </h3>
      <p className="text-[#9C8E85] text-sm leading-relaxed">
        Las clientas aparecerán aquí automáticamente cuando comiencen a hacer reservas a través de tu widget.
      </p>
    </motion.div>
  );
}