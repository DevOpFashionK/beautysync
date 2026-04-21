"use client";

// components/dashboard/services/ServiceCard.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, DollarSign, Pencil, Power, MoreVertical } from "lucide-react";
import type { ServiceItem } from "./ServicesClient";

interface ServiceCardProps {
  service: ServiceItem;
  primaryColor: string;
  index: number;
  onEdit: (service: ServiceItem) => void;
  onToggleActive: (service: ServiceItem) => void;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(price);
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// Genera un color de acento suave basado en el nombre del servicio
function getServiceAccent(name: string, primary: string): string {
  // Usamos el primary color con diferentes opacidades según inicial
  return primary;
}

export default function ServiceCard({
  service,
  primaryColor,
  index,
  onEdit,
  onToggleActive,
}: ServiceCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = service.is_active !== false;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
      className={`
        group relative bg-white rounded-2xl border overflow-hidden
        transition-all duration-300
        ${isActive
          ? "border-[#EDE8E3] hover:shadow-lg hover:shadow-[#2D2420]/5 hover:-translate-y-0.5"
          : "border-[#EDE8E3] opacity-60"
        }
      `}
    >
      {/* Top accent bar */}
      <div
        className="h-1 w-full transition-all duration-300"
        style={{
          background: isActive
            ? `linear-gradient(90deg, ${primaryColor}, ${primaryColor}60)`
            : "#EDE8E3",
        }}
      />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            {/* Status badge */}
            {!isActive && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold
                               text-[#9C8E85] bg-[#FAF8F5] border border-[#EDE8E3]
                               px-2 py-0.5 rounded-full mb-2">
                Inactivo
              </span>
            )}
            <h3 className="font-['Cormorant_Garamond'] text-xl font-semibold text-[#2D2420] leading-tight truncate">
              {service.name}
            </h3>
          </div>

          {/* Menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 rounded-lg flex items-center justify-center
                         text-[#C4B8B0] hover:text-[#9C8E85] hover:bg-[#FAF8F5]
                         transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical size={15} />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-9 z-20 bg-white border border-[#EDE8E3]
                             rounded-xl shadow-xl shadow-[#2D2420]/10 overflow-hidden w-40"
                >
                  <button
                    onClick={() => { onEdit(service); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                               text-[#2D2420] hover:bg-[#FAF8F5] transition-colors text-left"
                  >
                    <Pencil size={13} className="text-[#9C8E85]" />
                    Editar
                  </button>
                  <div className="h-px bg-[#EDE8E3] mx-3" />
                  <button
                    onClick={() => { onToggleActive(service); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                               text-[#2D2420] hover:bg-[#FAF8F5] transition-colors text-left"
                  >
                    <Power size={13} className={isActive ? "text-amber-400" : "text-emerald-500"} />
                    {isActive ? "Desactivar" : "Activar"}
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {service.description && (
          <p className="text-xs text-[#9C8E85] leading-relaxed mb-4 line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-auto pt-3 border-t border-[#EDE8E3]">
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}14` }}
            >
              <Clock size={11} style={{ color: primaryColor }} />
            </div>
            <span className="text-xs text-[#9C8E85] font-medium">
              {formatDuration(service.duration_minutes)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}14` }}
            >
              <DollarSign size={11} style={{ color: primaryColor }} />
            </div>
            <span
              className="text-xs font-bold"
              style={{ color: primaryColor }}
            >
              {formatPrice(service.price)}
            </span>
          </div>
        </div>

        {/* Quick edit button — visible on hover */}
        <motion.button
          onClick={() => onEdit(service)}
          className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5
                     rounded-lg text-xs font-medium text-white
                     opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ backgroundColor: primaryColor }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Pencil size={11} />
          Editar
        </motion.button>
      </div>
    </motion.div>
  );
}