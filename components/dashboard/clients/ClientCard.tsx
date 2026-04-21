"use client";

// components/dashboard/clients/ClientCard.tsx
import { motion } from "framer-motion";
import { Phone, Scissors, Star, ChevronRight, Clock } from "lucide-react";
import type { ClientProfile } from "./ClientsClient";

interface ClientCardProps {
  client: ClientProfile;
  primaryColor: string;
  index: number;
  onClick: () => void;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(price);
}

function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem.`;
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
  return `Hace ${Math.floor(diffDays / 365)} año(s)`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// Genera un color de avatar basado en el nombre
function getAvatarColor(name: string, primary: string): string {
  return primary;
}

export default function ClientCard({
  client,
  primaryColor,
  index,
  onClick,
}: ClientCardProps) {
  const initials = getInitials(client.name);

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      onClick={onClick}
      className="group w-full text-left bg-white rounded-2xl border border-[#EDE8E3]
                 p-5 transition-all duration-200
                 hover:shadow-lg hover:shadow-[#2D2420]/5 hover:-translate-y-0.5
                 hover:border-transparent"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center
                       text-white text-sm font-bold shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            {initials}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-[#2D2420] truncate">
                {client.name}
              </p>
              {client.isFrequent && (
                <Star
                  size={12}
                  className="shrink-0 fill-amber-400 text-amber-400"
                />
              )}
            </div>
            <p className="text-xs text-[#9C8E85] flex items-center gap-1 mt-0.5">
              <Phone size={10} />
              {client.phone}
            </p>
          </div>
        </div>

        <ChevronRight
          size={16}
          className="text-[#C4B8B0] shrink-0 mt-1
                     group-hover:translate-x-0.5 transition-transform"
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center">
          <p
            className="font-['Cormorant_Garamond'] text-xl font-bold leading-none"
            style={{ color: primaryColor }}
          >
            {client.totalAppointments}
          </p>
          <p className="text-[10px] text-[#9C8E85] mt-0.5">
            {client.totalAppointments === 1 ? "cita" : "citas"}
          </p>
        </div>

        <div className="text-center border-x border-[#EDE8E3]">
          <p
            className="font-['Cormorant_Garamond'] text-xl font-bold leading-none"
            style={{ color: primaryColor }}
          >
            {formatPrice(client.totalSpent)}
          </p>
          <p className="text-[10px] text-[#9C8E85] mt-0.5">gastado</p>
        </div>

        <div className="text-center">
          <p className="text-[10px] font-semibold text-[#2D2420] leading-tight">
            {formatRelativeDate(client.lastVisit)}
          </p>
          <p className="text-[10px] text-[#9C8E85] mt-0.5">última visita</p>
        </div>
      </div>

      {/* Favorite service */}
      {client.favoriteService && (
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg w-fit"
          style={{ backgroundColor: `${primaryColor}10` }}
        >
          <Scissors size={10} style={{ color: primaryColor }} />
          <span className="text-[11px] font-medium" style={{ color: primaryColor }}>
            {client.favoriteService}
          </span>
        </div>
      )}
    </motion.button>
  );
}