"use client";

// components/dashboard/services/ServiceModal.tsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  Loader2,
  Clock,
  DollarSign,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import type { ServiceItem } from "./ServicesClient";

// ─── Sugerencias por categoría ────────────────────────────────────────────────
const SERVICE_SUGGESTIONS = [
  {
    category: "🤨 Cejas & Pestañas",
    items: [
      { name: "Laminado de cejas", duration: 60, price: 35 },
      { name: "Corte y diseño de cejas", duration: 20, price: 8 },
      { name: "Tinte de cejas", duration: 20, price: 10 },
      { name: "Depilación de cejas con hilo", duration: 15, price: 6 },
      { name: "Depilación de cejas con cera", duration: 15, price: 7 },
      { name: "Microblading", duration: 120, price: 120 },
      { name: "Micropigmentación de cejas", duration: 150, price: 150 },
      { name: "Liftado de pestañas", duration: 60, price: 40 },
      { name: "Tinte de pestañas", duration: 30, price: 15 },
      { name: "Extensiones de pestañas clásicas", duration: 90, price: 45 },
      { name: "Extensiones de pestañas volumen", duration: 120, price: 65 },
    ],
  },

  {
    category: "✂️ Cabello",
    items: [
      { name: "Corte de damas", duration: 45, price: 15 },
      { name: "Corte de caballeros", duration: 30, price: 10 },
      { name: "Corte infantil", duration: 20, price: 8 },
      { name: "Tinte completo", duration: 120, price: 45 },
      { name: "Mechas / Balayage", duration: 150, price: 65 },
      { name: "Tratamiento de keratina", duration: 180, price: 80 },
      { name: "Alisado permanente", duration: 180, price: 70 },
      { name: "Hidratación profunda", duration: 60, price: 25 },
    ],
  },
  {
    category: "💅 Uñas",
    items: [
      { name: "Manicure clásico", duration: 45, price: 12 },
      { name: "Pedicure clásico", duration: 60, price: 15 },
      { name: "Manicure semipermanente", duration: 60, price: 20 },
      { name: "Uñas acrílicas", duration: 90, price: 35 },
      { name: "Uñas de gel", duration: 90, price: 35 },
      { name: "Nail art", duration: 30, price: 10 },
    ],
  },
  {
    category: "✨ Maquillaje",
    items: [
      { name: "Maquillaje social", duration: 60, price: 35 },
      { name: "Maquillaje de novia", duration: 120, price: 80 },
      { name: "Maquillaje artístico", duration: 90, price: 50 },
      { name: "Depilación de cejas", duration: 20, price: 8 },
    ],
  },
  {
    category: "🧖 Tratamientos",
    items: [
      { name: "Limpieza facial", duration: 60, price: 30 },
      { name: "Masaje relajante", duration: 60, price: 40 },
      { name: "Depilación laser zona pequeña", duration: 30, price: 25 },
      { name: "Microblading", duration: 120, price: 120 },
    ],
  },
];

const schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(80),
  duration_minutes: z
    .number({ invalid_type_error: "Ingresa un número" })
    .int()
    .min(15, "Mínimo 15 min")
    .max(480, "Máximo 8h"),
  price: z
    .number({ invalid_type_error: "Ingresa un precio" })
    .min(0, "Precio inválido")
    .max(99999),
  description: z.string().max(300).optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface ServiceModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (service: ServiceItem) => void;
  salonId: string;
  primaryColor: string;
  editingService: ServiceItem | null;
}

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 150, 180];

export default function ServiceModal({
  open,
  onClose,
  onSaved,
  salonId,
  primaryColor,
  editingService,
}: ServiceModalProps) {
  const isEditing = !!editingService;
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(!isEditing);
  const [openCategory, setOpenCategory] = useState<string | null>(
    SERVICE_SUGGESTIONS[0].category,
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      duration_minutes: 60,
      price: 0,
      description: "",
    },
  });

  const watchedDuration = watch("duration_minutes");

  useEffect(() => {
    if (open) {
      setApiError(null);
      setShowSuggestions(!editingService);
      if (editingService) {
        reset({
          name: editingService.name,
          duration_minutes: editingService.duration_minutes,
          price: editingService.price,
          description: editingService.description || "",
        });
      } else {
        reset({ name: "", duration_minutes: 60, price: 0, description: "" });
      }
    }
  }, [open, editingService, reset]);

  const applySuggestion = (suggestion: {
    name: string;
    duration: number;
    price: number;
  }) => {
    setValue("name", suggestion.name, { shouldValidate: true });
    setValue("duration_minutes", suggestion.duration, { shouldValidate: true });
    setValue("price", suggestion.price, { shouldValidate: true });
    setShowSuggestions(false);
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const payload = isEditing
        ? { id: editingService!.id, ...data }
        : { salon_id: salonId, ...data };

      const res = await fetch("/api/services", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json();

      if (!res.ok) {
        setApiError(body.error || "Error al guardar");
        return;
      }

      onSaved(body.service);
    } catch {
      setApiError("Error de conexión. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase = `
    w-full px-4 py-3 rounded-xl border border-[#EDE8E3] bg-white
    text-sm text-[#2D2420] placeholder:text-[#C4B8B0]
    outline-none transition-all duration-150
    focus:border-transparent focus:ring-2
  `;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[#2D2420]/20 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-x-4 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 
                       sm:-translate-x-1/2 sm:-translate-y-1/2
                       z-50 w-full sm:w-[520px] max-h-[92vh] sm:max-h-[85vh]
                       bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl
                       overflow-hidden flex flex-col"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div
                    className="w-4 h-[2px] rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <span
                    className="text-[10px] font-semibold tracking-[0.15em] uppercase"
                    style={{ color: primaryColor }}
                  >
                    {isEditing ? "Editar" : "Nuevo"}
                  </span>
                </div>
                <h2 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-[#2D2420]">
                  {isEditing ? editingService!.name : "Agregar servicio"}
                </h2>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center
                           text-[#9C8E85] hover:bg-[#FAF8F5] hover:text-[#2D2420]
                           transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 pb-6">
              {/* Suggestions toggle */}
              {!isEditing && (
                <button
                  onClick={() => setShowSuggestions((v) => !v)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl
                             border border-dashed border-[#EDE8E3] mb-5 text-left
                             hover:border-transparent transition-all group"
                  style={{
                    backgroundColor: showSuggestions
                      ? `${primaryColor}06`
                      : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!showSuggestions)
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        `${primaryColor}05`;
                  }}
                  onMouseLeave={(e) => {
                    if (!showSuggestions)
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        "transparent";
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} style={{ color: primaryColor }} />
                    <span className="text-xs font-semibold text-[#2D2420]">
                      Elegir de plantillas
                    </span>
                    <span className="text-[10px] text-[#9C8E85]">
                      — Rápido y fácil
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-[#9C8E85] transition-transform duration-200 ${
                      showSuggestions ? "rotate-180" : ""
                    }`}
                  />
                </button>
              )}

              {/* Suggestions panel */}
              <AnimatePresence>
                {showSuggestions && !isEditing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden mb-5"
                  >
                    <div className="flex flex-col gap-2">
                      {SERVICE_SUGGESTIONS.map((cat) => (
                        <div
                          key={cat.category}
                          className="rounded-xl border border-[#EDE8E3] overflow-hidden"
                        >
                          <button
                            onClick={() =>
                              setOpenCategory(
                                openCategory === cat.category
                                  ? null
                                  : cat.category,
                              )
                            }
                            className="w-full flex items-center justify-between px-4 py-3
                                       text-sm font-medium text-[#2D2420] hover:bg-[#FAF8F5]
                                       transition-colors text-left"
                          >
                            {cat.category}
                            <ChevronDown
                              size={14}
                              className={`text-[#9C8E85] transition-transform duration-200 ${
                                openCategory === cat.category
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </button>

                          <AnimatePresence>
                            {openCategory === cat.category && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-3 pb-3 flex flex-wrap gap-2">
                                  {cat.items.map((item) => (
                                    <button
                                      key={item.name}
                                      onClick={() => applySuggestion(item)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                                 border border-[#EDE8E3] text-xs text-[#2D2420]
                                                 hover:border-transparent transition-all duration-150"
                                      onMouseEnter={(e) => {
                                        (
                                          e.currentTarget as HTMLElement
                                        ).style.backgroundColor =
                                          `${primaryColor}10`;
                                        (
                                          e.currentTarget as HTMLElement
                                        ).style.borderColor =
                                          `${primaryColor}40`;
                                        (
                                          e.currentTarget as HTMLElement
                                        ).style.color = primaryColor;
                                      }}
                                      onMouseLeave={(e) => {
                                        (
                                          e.currentTarget as HTMLElement
                                        ).style.backgroundColor = "";
                                        (
                                          e.currentTarget as HTMLElement
                                        ).style.borderColor = "#EDE8E3";
                                        (
                                          e.currentTarget as HTMLElement
                                        ).style.color = "#2D2420";
                                      }}
                                    >
                                      <span>{item.name}</span>
                                      <span className="text-[#C4B8B0]">·</span>
                                      <span className="text-[#9C8E85]">
                                        ${item.price}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 my-5">
                      <div className="h-px flex-1 bg-[#EDE8E3]" />
                      <span className="text-xs text-[#C4B8B0] font-medium">
                        o personaliza
                      </span>
                      <div className="h-px flex-1 bg-[#EDE8E3]" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              {apiError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4"
                >
                  <p className="text-sm text-red-600">{apiError}</p>
                </motion.div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
                noValidate
              >
                {/* Name */}
                <div>
                  <label className="text-xs font-semibold text-[#9C8E85] tracking-wide uppercase mb-1.5 block">
                    Nombre del servicio <span className="text-red-400">*</span>
                  </label>
                  <input
                    {...register("name")}
                    placeholder="ej. Corte de damas"
                    className={inputBase}
                    style={{ ["--tw-ring-color" as string]: primaryColor }}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Duration */}
                <div>
                  <label className="text-xs font-semibold text-[#9C8E85] tracking-wide uppercase mb-1.5 block">
                    Duración <span className="text-red-400">*</span>
                  </label>
                  {/* Presets */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {DURATION_PRESETS.map((min) => {
                      const isSelected = watchedDuration === min;
                      return (
                        <button
                          key={min}
                          type="button"
                          onClick={() =>
                            setValue("duration_minutes", min, {
                              shouldValidate: true,
                            })
                          }
                          className="px-3 py-1 rounded-lg text-xs font-medium border transition-all duration-150"
                          style={
                            isSelected
                              ? {
                                  backgroundColor: primaryColor,
                                  color: "#fff",
                                  borderColor: primaryColor,
                                }
                              : {
                                  backgroundColor: "transparent",
                                  color: "#9C8E85",
                                  borderColor: "#EDE8E3",
                                }
                          }
                        >
                          {min < 60 ? `${min}m` : `${min / 60}h`}
                          {min % 60 !== 0 && min > 60 ? `${min % 60}m` : ""}
                        </button>
                      );
                    })}
                  </div>
                  <div className="relative">
                    <Clock
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C4B8B0]"
                    />
                    <Controller
                      name="duration_minutes"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min={15}
                          max={480}
                          step={5}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                          placeholder="60"
                          className={`${inputBase} pl-9`}
                          style={{
                            ["--tw-ring-color" as string]: primaryColor,
                          }}
                        />
                      )}
                    />
                  </div>
                  {errors.duration_minutes && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.duration_minutes.message}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className="text-xs font-semibold text-[#9C8E85] tracking-wide uppercase mb-1.5 block">
                    Precio (USD) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C4B8B0]"
                    />
                    <Controller
                      name="price"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min={0}
                          step={0.5}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.00"
                          className={`${inputBase} pl-9`}
                          style={{
                            ["--tw-ring-color" as string]: primaryColor,
                          }}
                        />
                      )}
                    />
                  </div>
                  {errors.price && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.price.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-[#9C8E85] tracking-wide uppercase mb-1.5 block">
                    Descripción{" "}
                    <span className="text-[#C4B8B0] font-normal normal-case tracking-normal">
                      (opcional)
                    </span>
                  </label>
                  <textarea
                    {...register("description")}
                    rows={2}
                    placeholder="Describe brevemente este servicio..."
                    className={`${inputBase} resize-none`}
                    style={{ ["--tw-ring-color" as string]: primaryColor }}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={!isLoading ? { scale: 1.01 } : {}}
                  whileTap={!isLoading ? { scale: 0.99 } : {}}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-white
                             transition-opacity disabled:opacity-60 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2 mt-2"
                  style={{
                    backgroundColor: primaryColor,
                    boxShadow: `0 8px 24px ${primaryColor}30`,
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>{isEditing ? "Guardar cambios" : "Crear servicio"}</>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
