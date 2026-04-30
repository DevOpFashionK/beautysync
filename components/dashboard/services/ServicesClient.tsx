"use client";

// components/dashboard/services/ServicesClient.tsx
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import ServiceCard from "./ServiceCard";
import ServiceModal from "./ServiceModal";
import ServicesEmptyState from "./ServicesEmptyState";
import ServicesSummaryBar from "./ServicesSummaryBar";

export interface ServiceItem {
  id: string;
  salon_id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

interface ServicesClientProps {
  salonId: string;
  salonName: string;
  primaryColor: string;
  initialServices: ServiceItem[];
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

export default function ServicesClient({
  salonId,
  salonName,
  primaryColor,
  initialServices,
}: ServicesClientProps) {
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(
    null,
  );
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const activeServices = services.filter((s) => s.is_active !== false);
  const inactiveServices = services.filter((s) => s.is_active === false);
  const filteredServices =
    filter === "active"
      ? activeServices
      : filter === "inactive"
        ? inactiveServices
        : services;

  // ── CRUD handlers — lógica intacta ────────────────────────────────────────
  const handleCreate = useCallback(() => {
    setEditingService(null);
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((service: ServiceItem) => {
    setEditingService(service);
    setModalOpen(true);
  }, []);

  const handleSaved = useCallback((saved: ServiceItem) => {
    setServices((prev) => {
      const exists = prev.find((s) => s.id === saved.id);
      if (exists) return prev.map((s) => (s.id === saved.id ? saved : s));
      return [...prev, saved];
    });
    setModalOpen(false);
    setEditingService(null);
  }, []);

  const handleToggleActive = useCallback(async (service: ServiceItem) => {
    const newActive = !service.is_active;
    setServices((prev) =>
      prev.map((s) =>
        s.id === service.id ? { ...s, is_active: newActive } : s,
      ),
    );
    try {
      const res = await fetch("/api/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: service.id, is_active: newActive }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setServices((prev) =>
        prev.map((s) =>
          s.id === service.id ? { ...s, is_active: service.is_active } : s,
        ),
      );
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: false } : s)),
    );
    try {
      await fetch(`/api/services?id=${id}`, { method: "DELETE" });
    } catch {
      // silently fail — se re-sincroniza en refresh
    }
  }, []);

  const filterLabels = {
    all: "Todos",
    active: "Activos",
    inactive: "Inactivos",
  };
  const filterCounts = {
    all: services.length,
    active: activeServices.length,
    inactive: inactiveServices.length,
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg }}>
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        {/* ── Header ───────────────────────────────────────────────── */}
        <div style={{ padding: "40px 24px 24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div>
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
                  Catálogo
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
                Mis Servicios
              </h1>
              <p
                style={{
                  fontSize: "13px",
                  color: T.textDim,
                  marginTop: "6px",
                  letterSpacing: "0.02em",
                }}
              >
                Gestiona lo que ofrece{" "}
                <span style={{ color: T.textMid }}>{salonName}</span>
              </p>
            </div>

            {/* CTA */}
            <motion.button
              onClick={handleCreate}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "10px 18px",
                borderRadius: "8px",
                border: `1px solid ${T.roseBorder}`,
                background: T.roseGhost,
                color: T.roseDim,
                fontSize: "11px",
                fontWeight: 400,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.2s",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(255,45,85,0.16)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(255,45,85,0.42)";
                (e.currentTarget as HTMLElement).style.color = "#FF2D55";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = T.roseGhost;
                (e.currentTarget as HTMLElement).style.borderColor =
                  T.roseBorder;
                (e.currentTarget as HTMLElement).style.color = T.roseDim;
              }}
            >
              <Plus size={13} strokeWidth={2} />
              Nuevo servicio
            </motion.button>
          </div>

          {/* Summary bar */}
          {services.length > 0 && (
            <ServicesSummaryBar
              totalServices={activeServices.length}
              inactiveCount={inactiveServices.length}
              primaryColor={primaryColor}
            />
          )}
        </div>

        {/* ── Filter tabs ──────────────────────────────────────────── */}
        {services.length > 0 && (
          <div style={{ padding: "0 24px 20px" }}>
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
              {(["all", "active", "inactive"] as const).map((f) => {
                const isActive = filter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      letterSpacing: "0.04em",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      fontFamily: "inherit",
                      background: isActive ? T.roseGhost : "transparent",
                      color: isActive ? T.roseDim : T.textDim,
                      ...(isActive
                        ? { border: `1px solid ${T.roseBorder}` }
                        : { border: "1px solid transparent" }),
                    }}
                  >
                    {filterLabels[f]}
                    {filterCounts[f] > 0 && (
                      <span
                        style={{
                          marginLeft: "5px",
                          fontSize: "10px",
                          opacity: 0.6,
                        }}
                      >
                        {filterCounts[f]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Content ──────────────────────────────────────────────── */}
        <div style={{ padding: "0 24px 80px" }}>
          {filteredServices.length === 0 && services.length === 0 ? (
            <ServicesEmptyState
              primaryColor={primaryColor}
              onCreate={handleCreate}
            />
          ) : filteredServices.length === 0 ? (
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
              <p style={{ fontSize: "13px", color: T.textDim }}>
                No hay servicios en esta categoría
              </p>
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {filteredServices.map((service, i) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    primaryColor={primaryColor}
                    index={i}
                    onEdit={handleEdit}
                    onToggleActive={handleToggleActive}
                  />
                ))}

                {/* Add card */}
                <motion.button
                  key="add-card"
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handleCreate}
                  style={{
                    borderRadius: "10px",
                    border: `2px dashed ${T.border}`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    padding: "32px 16px",
                    minHeight: "160px",
                    cursor: "pointer",
                    background: "transparent",
                    transition: "border-color 0.2s, background 0.2s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      `${primaryColor}40`;
                    (e.currentTarget as HTMLElement).style.background =
                      `${primaryColor}04`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      T.border;
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: `${primaryColor}12`,
                      border: `1px solid ${primaryColor}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Plus
                      size={16}
                      strokeWidth={1.75}
                      style={{ color: `${primaryColor}AA` }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      color: T.textDim,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    Agregar servicio
                  </span>
                </motion.button>
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Modal ────────────────────────────────────────────────────── */}
      <ServiceModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingService(null);
        }}
        onSaved={handleSaved}
        salonId={salonId}
        primaryColor={primaryColor}
        editingService={editingService}
      />
    </div>
  );
}
