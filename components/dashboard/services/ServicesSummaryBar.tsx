"use client";

// components/dashboard/services/ServicesSummaryBar.tsx
import { motion } from "framer-motion";
import { Layers, Eye, EyeOff } from "lucide-react";

interface ServicesSummaryBarProps {
  totalServices: number;
  inactiveCount: number;
  primaryColor: string;
}

export default function ServicesSummaryBar({
  totalServices,
  inactiveCount,
  primaryColor,
}: ServicesSummaryBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="flex items-center gap-4 mt-6 pt-5 border-t border-[#EDE8E3]"
    >
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}12` }}
        >
          <Eye size={14} style={{ color: primaryColor }} />
        </div>
        <div>
          <p
            className="font-['Cormorant_Garamond'] text-xl font-bold leading-none"
            style={{ color: primaryColor }}
          >
            {totalServices}
          </p>
          <p className="text-[10px] text-[#9C8E85] font-medium">
            {totalServices === 1 ? "servicio activo" : "servicios activos"}
          </p>
        </div>
      </div>

      {inactiveCount > 0 && (
        <>
          <div className="w-px h-8 bg-[#EDE8E3]" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#FAF8F5]">
              <EyeOff size={14} className="text-[#C4B8B0]" />
            </div>
            <div>
              <p className="font-['Cormorant_Garamond'] text-xl font-bold leading-none text-[#C4B8B0]">
                {inactiveCount}
              </p>
              <p className="text-[10px] text-[#C4B8B0] font-medium">inactivos</p>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}