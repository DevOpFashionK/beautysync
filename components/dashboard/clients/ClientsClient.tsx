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
  phone: string;
  name: string;
  email: string | null;
  totalAppointments: number;
  totalSpent: number;
  lastVisit: string;
  firstVisit: string;
  favoriteService: string | null;
  isFrequent: boolean;
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

// ── buildClientProfiles — lógica intacta ──────────────────────────────────────
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

    if (appt.scheduled_at > profile.lastVisit)
      profile.lastVisit = appt.scheduled_at;
    if (appt.scheduled_at < profile.firstVisit)
      profile.firstVisit = appt.scheduled_at;
    if (appt.scheduled_at >= profile.lastVisit) profile.name = appt.client_name;
    if (appt.client_email) profile.email = appt.client_email;
  }

  for (const profile of map.values()) {
    const serviceCounts: Record<string, number> = {};
    for (const appt of profile.appointments) {
      if (appt.services?.name) {
        serviceCounts[appt.services.name] =
          (serviceCounts[appt.services.name] || 0) + 1;
      }
    }
    const topService = Object.entries(serviceCounts).sort(
      (a, b) => b[1] - a[1],
    )[0];
    profile.favoriteService = topService?.[0] ?? null;
    profile.isFrequent = profile.totalAppointments >= 3;
  }

  return Array.from(map.values());
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  bg: "#080706",
  surface: "#0E0C0B",
  border: "rgba(255,255,255,0.055)",
  borderMid: "rgba(255,255,255,0.09)",
  textPrimary: "rgba(245,242,238,0.9)",
  textMid: "rgba(245,242,238,0.45)",
  textDim: "rgba(245,242,238,0.18)",
  roseDim: "rgba(255,45,85,0.55)",
  roseGhost: "rgba(255,45,85,0.08)",
  roseBorder: "rgba(255,45,85,0.22)",
};

export default function ClientsClient({
  primaryColor,
  appointments,
}: ClientsClientProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(
    null,
  );

  const clients = useMemo(
    () => buildClientProfiles(appointments),
    [appointments],
  );

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
      if (sortBy === "frequent")
        return b.totalAppointments - a.totalAppointments;
      if (sortBy === "spent") return b.totalSpent - a.totalSpent;
      return 0;
    });
    return result;
  }, [clients, search, sortBy]);

  const totalRevenue = useMemo(
    () => clients.reduce((sum, c) => sum + c.totalSpent, 0),
    [clients],
  );
  const frequentCount = useMemo(
    () => clients.filter((c) => c.isFrequent).length,
    [clients],
  );

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("es-SV", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(v);

  return (
    <div style={{ minHeight: "100vh", background: T.bg }}>
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        {/* ── Header ───────────────────────────────────────────────── */}
        <div style={{ padding: "40px 24px 24px" }}>
          <div style={{ marginBottom: "24px" }}>
            {/* Eyebrow */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "10px",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "14px",
                  height: "1px",
                  background: T.roseDim,
                }}
              />
              <span
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: T.roseDim,
                }}
              >
                Directorio
              </span>
            </div>
            <h1
              style={{
                fontFamily:
                  "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
                fontSize: "clamp(2.5rem, 5vw, 4rem)",
                fontWeight: 300,
                color: T.textPrimary,
                lineHeight: 1.04,
                letterSpacing: "-0.035em",
                margin: 0,
              }}
            >
              Clientas
            </h1>
            <p
              style={{
                fontSize: "12px",
                color: T.textDim,
                marginTop: "6px",
                letterSpacing: "0.04em",
              }}
            >
              {clients.length} clientas registradas
            </p>
          </div>

          {/* Summary metrics */}
          {clients.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "10px",
                marginBottom: "24px",
              }}
            >
              {[
                {
                  icon: <Users size={13} />,
                  label: "Total clientas",
                  value: clients.length,
                  fmt: String,
                },
                {
                  icon: <Star size={13} />,
                  label: "Frecuentes",
                  value: frequentCount,
                  fmt: String,
                },
                {
                  icon: <TrendingUp size={13} />,
                  label: "Ingresos totales",
                  value: totalRevenue,
                  fmt: formatCurrency,
                },
              ].map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  style={{
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: "10px",
                    padding: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: `${primaryColor}12`,
                      color: `${primaryColor}CC`,
                      marginBottom: "8px",
                    }}
                  >
                    {m.icon}
                  </div>
                  <p
                    style={{
                      fontFamily:
                        "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
                      fontSize: "1.3rem",
                      fontWeight: 300,
                      lineHeight: 1,
                      color: `${primaryColor}CC`,
                      margin: 0,
                    }}
                  >
                    {m.fmt(m.value)}
                  </p>
                  <p
                    style={{
                      fontSize: "9px",
                      color: T.textDim,
                      marginTop: "4px",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {m.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Search + Sort */}
          {clients.length > 0 && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <div style={{ position: "relative" }}>
                <Search
                  size={14}
                  strokeWidth={1.5}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: T.textDim,
                  }}
                />
                <input
                  type="text"
                  placeholder="Buscar por nombre, teléfono o email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: "100%",
                    paddingLeft: "36px",
                    paddingRight: "14px",
                    paddingTop: "10px",
                    paddingBottom: "10px",
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: T.textPrimary,
                    outline: "none",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = T.roseBorder;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${T.roseGhost}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = T.border;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Sort tabs */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px",
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: "8px",
                  padding: "3px",
                }}
              >
                {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => {
                  const isActive = sortBy === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setSortBy(opt)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        letterSpacing: "0.04em",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        border: isActive
                          ? `1px solid ${T.roseBorder}`
                          : "1px solid transparent",
                        background: isActive ? T.roseGhost : "transparent",
                        color: isActive ? T.roseDim : T.textDim,
                        fontFamily: "inherit",
                      }}
                    >
                      {SORT_LABELS[opt]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Content ──────────────────────────────────────────────── */}
        <div style={{ padding: "0 24px 80px" }}>
          {clients.length === 0 ? (
            <ClientsEmptyState primaryColor={primaryColor} />
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "64px 0",
                textAlign: "center",
              }}
            >
              <Search
                size={24}
                strokeWidth={1.25}
                style={{ color: T.textDim, marginBottom: "12px" }}
              />
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 400,
                  color: T.textMid,
                  margin: "0 0 4px",
                }}
              >
                Sin resultados
              </p>
              <p style={{ fontSize: "12px", color: T.textDim, margin: 0 }}>
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

      {/* ── Detail Modal ─────────────────────────────────────────────── */}
      <ClientDetailModal
        client={selectedClient}
        primaryColor={primaryColor}
        onClose={() => setSelectedClient(null)}
      />
    </div>
  );
}
