"use client";

// components/dashboard/clients/ClientsClient.tsx
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, TrendingUp, Star } from "lucide-react";
import ClientCard from "./ClientCard";
import ClientDetailModal from "./ClientDetailModal";
import ClientsEmptyState from "./ClientsEmptyState";

interface AppointmentRaw {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string;
  scheduled_at: string;
  status: string;
  services: { id: string; name: string; price: number } | null;
}

export interface ClientProfile {
  // Identificador único: teléfono (más confiable que nombre)
  phone: string;
  name: string;
  email: string | null;
  totalAppointments: number;
  totalSpent: number;
  lastVisit: string; // ISO string
  firstVisit: string; // ISO string
  favoriteService: string | null;
  isFrequent: boolean; // 3+ citas
  appointments: AppointmentRaw[];
}

interface ClientsClientProps {
  primaryColor: string;
  appointments: AppointmentRaw[];
}

type SortOption = "recent" | "frequent" | "spent";

const SORT_LABELS: Record<SortOption, string> = {
  recent: "Más recientes",
  frequent: "Más frecuentes",
  spent: "Mayor gasto",
};

function buildClientProfiles(appointments: AppointmentRaw[]): ClientProfile[] {
  const map = new Map<string, ClientProfile>();

  for (const appt of appointments) {
    const key = appt.client_phone;

    if (!map.has(key)) {
      map.set(key, {
        phone: appt.client_phone,
        name: appt.client_name,
        email: appt.client_email,
        totalAppointments: 0,
        totalSpent: 0,
        lastVisit: appt.scheduled_at,
        firstVisit: appt.scheduled_at,
        favoriteService: null,
        isFrequent: false,
        appointments: [],
      });
    }

    const profile = map.get(key)!;
    profile.totalAppointments++;
    profile.totalSpent += appt.services?.price ?? 0;
    profile.appointments.push(appt);

    // Actualizar última y primera visita
    if (appt.scheduled_at > profile.lastVisit) profile.lastVisit = appt.scheduled_at;
    if (appt.scheduled_at < profile.firstVisit) profile.firstVisit = appt.scheduled_at;

    // Usar el nombre más reciente (por si cambió)
    if (appt.scheduled_at >= profile.lastVisit) profile.name = appt.client_name;
    if (appt.client_email) profile.email = appt.client_email;
  }

  // Calcular servicio favorito e isFrequent
  for (const profile of map.values()) {
    const serviceCounts: Record<string, number> = {};
    for (const appt of profile.appointments) {
      if (appt.services?.name) {
        serviceCounts[appt.services.name] = (serviceCounts[appt.services.name] || 0) + 1;
      }
    }
    const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0];
    profile.favoriteService = topService?.[0] ?? null;
    profile.isFrequent = profile.totalAppointments >= 3;
  }

  return Array.from(map.values());
}

export default function ClientsClient({
  primaryColor,
  appointments,
}: ClientsClientProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);

  const clients = useMemo(() => buildClientProfiles(appointments), [appointments]);

  const filtered = useMemo(() => {
    let result = clients.filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false)
      );
    });

    result = [...result].sort((a, b) => {
      if (sortBy === "recent") return b.lastVisit.localeCompare(a.lastVisit);
      if (sortBy === "frequent") return b.totalAppointments - a.totalAppointments;
      if (sortBy === "spent") return b.totalSpent - a.totalSpent;
      return 0;
    });

    return result;
  }, [clients, search, sortBy]);

  // Métricas globales
  const totalRevenue = useMemo(
    () => clients.reduce((sum, c) => sum + c.totalSpent, 0),
    [clients]
  );
  const frequentCount = useMemo(
    () => clients.filter((c) => c.isFrequent).length,
    [clients]
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <div className="max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="px-6 pt-8 pb-6 md:px-10">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-[2px] rounded-full" style={{ backgroundColor: primaryColor }} />
            <span
              className="text-xs font-semibold tracking-[0.15em] uppercase"
              style={{ color: primaryColor }}
            >
              Directorio
            </span>
          </div>
          <h1 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl font-semibold text-[#2D2420] leading-none">
            Clientas
          </h1>
          <p className="text-[#9C8E85] text-sm mt-2">
            {clients.length} clientas registradas
          </p>
        </div>

        {/* Summary metrics */}
        {clients.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            {[
              {
                icon: <Users size={14} />,
                label: "Total clientas",
                value: clients.length,
                format: (v: number) => v.toString(),
              },
              {
                icon: <Star size={14} />,
                label: "Frecuentes",
                value: frequentCount,
                format: (v: number) => v.toString(),
              },
              {
                icon: <TrendingUp size={14} />,
                label: "Ingresos totales",
                value: totalRevenue,
                format: (v: number) =>
                  new Intl.NumberFormat("es-SV", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 0,
                  }).format(v),
              },
            ].map((metric, i) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="bg-white rounded-2xl border border-[#EDE8E3] p-3.5"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
                  style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
                >
                  {metric.icon}
                </div>
                <p
                  className="font-['Cormorant_Garamond'] text-xl font-bold leading-none"
                  style={{ color: primaryColor }}
                >
                  {metric.format(metric.value)}
                </p>
                <p className="text-[10px] text-[#9C8E85] mt-1">{metric.label}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Search + Sort */}
        {clients.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C4B8B0]"
              />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EDE8E3]
                           rounded-xl text-sm text-[#2D2420] placeholder:text-[#C4B8B0]
                           outline-none transition-all"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = primaryColor;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}15`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#EDE8E3";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Sort tabs */}
            <div className="flex items-center gap-1 bg-white border border-[#EDE8E3] rounded-xl p-1 w-fit">
              {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSortBy(opt)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                  style={
                    sortBy === opt
                      ? { backgroundColor: primaryColor, color: "#fff" }
                      : { color: "#9C8E85" }
                  }
                >
                  {SORT_LABELS[opt]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="px-6 md:px-10 pb-16">
        {clients.length === 0 ? (
          <ClientsEmptyState primaryColor={primaryColor} />
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-20 text-center"
          >
            <Search size={28} className="text-[#C4B8B0] mb-3" />
            <p className="text-[#2D2420] font-medium text-sm">Sin resultados</p>
            <p className="text-[#9C8E85] text-xs mt-1">
              Intenta con otro término
            </p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((client, i) => (
                <ClientCard
                  key={client.phone}
                  client={client}
                  primaryColor={primaryColor}
                  index={i}
                  onClick={() => setSelectedClient(client)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
      </div>

      {/* ── Detail Modal ── */}
      <ClientDetailModal
        client={selectedClient}
        primaryColor={primaryColor}
        onClose={() => setSelectedClient(null)}
      />
    </div>
  );
}