"use client";

// components/booking/ServiceSelector.tsx
import { motion } from "framer-motion";
import { Clock, DollarSign, ChevronRight, Scissors } from "lucide-react";
import type { ServicePublicData, SelectedService } from "@/types/booking.types";

interface ServiceSelectorProps {
  services: ServicePublicData[];
  primaryColor: string;
  onSelect: (service: SelectedService) => void;
}

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

export default function ServiceSelector({
  services,
  primaryColor,
  onSelect,
}: ServiceSelectorProps) {
  const activeServices = services.filter((s) => s !== null);

  if (activeServices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: `${primaryColor}14` }}
        >
          <Scissors size={28} style={{ color: primaryColor }} />
        </div>
        <p className="text-[#2D2420] font-medium">No hay servicios disponibles</p>
        <p className="text-[#9C8E85] text-sm mt-1">Contacta al salón directamente</p>
      </div>
    );
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h2 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-[#2D2420] leading-tight">
          ¿Qué servicio deseas?
        </h2>
        <p className="text-[#9C8E85] text-sm mt-1">
          Selecciona uno para continuar
        </p>
      </motion.div>

      <div className="flex flex-col gap-3">
        {activeServices.map((service, index) => (
          <motion.button
            key={service.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.07 + 0.1 }}
            onClick={() => onSelect(service as SelectedService)}
            className="group w-full text-left rounded-2xl border border-[#EDE8E3] bg-white p-4
                       transition-all duration-200 hover:shadow-md hover:border-transparent
                       focus:outline-none focus-visible:ring-2"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center justify-between gap-3">
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${primaryColor}14` }}
              >
                <Scissors size={18} style={{ color: primaryColor }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#2D2420] text-sm leading-snug truncate">
                  {service.name}
                </p>
                {service.description && (
                  <p className="text-[#9C8E85] text-xs mt-0.5 line-clamp-1">
                    {service.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-xs text-[#9C8E85]">
                    <Clock size={11} />
                    {formatDuration(service.duration_minutes)}
                  </span>
                  <span
                    className="flex items-center gap-1 text-xs font-semibold"
                    style={{ color: primaryColor }}
                  >
                    <DollarSign size={11} />
                    {formatPrice(service.price)}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight
                size={18}
                className="text-[#C4B8B0] group-hover:translate-x-0.5 transition-transform duration-200 shrink-0"
                style={{ color: primaryColor }}
              />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}