"use client";

// components/dashboard/services/ServicesClient.tsx
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
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

export default function ServicesClient({
  salonId,
  salonName,
  primaryColor,
  initialServices,
}: ServicesClientProps) {
  const [services, setServices] = useState<ServiceItem[]>(initialServices);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const activeServices = services.filter((s) => s.is_active !== false);
  const inactiveServices = services.filter((s) => s.is_active === false);

  const filteredServices =
    filter === "active"
      ? activeServices
      : filter === "inactive"
      ? inactiveServices
      : services;

  const totalRevenuePotential = activeServices.reduce((sum, s) => sum + s.price, 0);

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
    // Optimistic update
    setServices((prev) =>
      prev.map((s) =>
        s.id === service.id ? { ...s, is_active: newActive } : s
      )
    );

    try {
      const res = await fetch("/api/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: service.id, is_active: newActive }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on error
      setServices((prev) =>
        prev.map((s) =>
          s.id === service.id ? { ...s, is_active: service.is_active } : s
        )
      );
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    // Soft delete — marca is_active = false vía API
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: false } : s))
    );

    try {
      await fetch(`/api/services?id=${id}`, { method: "DELETE" });
    } catch {
      // silently fail, data will re-sync on refresh
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <div className="max-w-5xl mx-auto">
      {/* ── Page Header ── */}
      <div className="px-6 pt-8 pb-6 md:px-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-5 h-[2px] rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
              <span
                className="text-xs font-semibold tracking-[0.15em] uppercase"
                style={{ color: primaryColor }}
              >
                Catálogo
              </span>
            </div>

            <h1 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl font-semibold text-[#2D2420] leading-none">
              Mis Servicios
            </h1>
            <p className="text-[#9C8E85] text-sm mt-2">
              Gestiona lo que ofrece{" "}
              <span className="text-[#2D2420] font-medium">{salonName}</span>
            </p>
          </div>

          {/* CTA */}
          <motion.button
            onClick={handleCreate}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-semibold
                       shadow-lg transition-shadow hover:shadow-xl shrink-0"
            style={{
              backgroundColor: primaryColor,
              boxShadow: `0 8px 24px ${primaryColor}30`,
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
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

      {/* ── Filter tabs ── */}
      {services.length > 0 && (
        <div className="px-6 md:px-10 mb-6">
          <div className="flex items-center gap-1 bg-white border border-[#EDE8E3] rounded-xl p-1 w-fit">
            {(["all", "active", "inactive"] as const).map((f) => {
              const labels = { all: "Todos", active: "Activos", inactive: "Inactivos" };
              const counts = {
                all: services.length,
                active: activeServices.length,
                inactive: inactiveServices.length,
              };
              const isActive = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="relative px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                  style={
                    isActive
                      ? { color: "#fff", backgroundColor: primaryColor }
                      : { color: "#9C8E85" }
                  }
                >
                  {labels[f]}
                  {counts[f] > 0 && (
                    <span
                      className={`ml-1.5 text-[10px] font-bold ${
                        isActive ? "text-white/70" : "text-[#C4B8B0]"
                      }`}
                    >
                      {counts[f]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="px-6 md:px-10 pb-16">
        {filteredServices.length === 0 && services.length === 0 ? (
          <ServicesEmptyState primaryColor={primaryColor} onCreate={handleCreate} />
        ) : filteredServices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-20 text-center"
          >
            <p className="text-[#9C8E85] text-sm">No hay servicios en esta categoría</p>
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
                className="group rounded-2xl border-2 border-dashed border-[#EDE8E3] 
                           flex flex-col items-center justify-center gap-3 p-8
                           transition-all duration-300 hover:border-transparent min-h-[180px]"
                style={{ ["--hover-bg" as string]: `${primaryColor}08` }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${primaryColor}40`;
                  (e.currentTarget as HTMLElement).style.backgroundColor = `${primaryColor}05`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#EDE8E3";
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center
                               transition-colors duration-200"
                  style={{ backgroundColor: `${primaryColor}14` }}
                >
                  <Plus size={20} style={{ color: primaryColor }} />
                </div>
                <span className="text-xs font-medium text-[#9C8E85] group-hover:text-[#2D2420] transition-colors">
                  Agregar servicio
                </span>
              </motion.button>
            </AnimatePresence>
          </motion.div>
        )}
      </div>
      </div>

      {/* ── Modal ── */}
      <ServiceModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingService(null); }}
        onSaved={handleSaved}
        salonId={salonId}
        primaryColor={primaryColor}
        editingService={editingService}
      />
    </div>
  );
}