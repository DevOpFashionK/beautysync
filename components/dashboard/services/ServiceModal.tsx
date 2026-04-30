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

// ─── Sugerencias por categoría — datos intactos ───────────────────────────────
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

// ─── Schema — intacto ─────────────────────────────────────────────────────────
const schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(80),
  duration_minutes: z
    .number({ message: "Ingresa un número" })
    .int()
    .min(15, "Mínimo 15 min")
    .max(480, "Máximo 8h"),
  price: z
    .number({ message: "Ingresa un precio" })
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

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  surface: "#0E0C0B",
  surface2: "#131110",
  border: "rgba(255,255,255,0.055)",
  borderMid: "rgba(255,255,255,0.09)",
  textPrimary: "rgba(245,242,238,0.9)",
  textMid: "rgba(245,242,238,0.45)",
  textDim: "rgba(245,242,238,0.18)",
  roseDim: "rgba(255,45,85,0.55)",
  roseGhost: "rgba(255,45,85,0.08)",
  roseBorder: "rgba(255,45,85,0.22)",
};

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

  // ── Reset al abrir — lógica intacta ───────────────────────────────────────
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

  // ── onSubmit — lógica intacta ─────────────────────────────────────────────
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

  const FieldLabel = ({
    children,
    required,
  }: {
    children: React.ReactNode;
    required?: boolean;
  }) => (
    <label
      style={{
        fontSize: "10px",
        fontWeight: 400,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: T.textDim,
        display: "block",
        marginBottom: "8px",
      }}
    >
      {children}
      {required && (
        <span style={{ color: "rgba(255,45,85,0.55)", marginLeft: "3px" }}>
          *
        </span>
      )}
    </label>
  );

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "8px",
    border: `1px solid ${T.borderMid}`,
    background: T.surface2,
    fontSize: "14px",
    color: T.textPrimary,
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const inputFocus = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = T.roseBorder;
      e.currentTarget.style.boxShadow = `0 0 0 3px ${T.roseGhost}`;
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = T.borderMid;
      e.currentTarget.style.boxShadow = "none";
    },
  };

  const ErrMsg = ({ msg }: { msg?: string }) =>
    msg ? (
      <p
        style={{
          fontSize: "11px",
          color: "rgba(255,110,110,0.85)",
          marginTop: "5px",
        }}
      >
        {msg}
      </p>
    ) : null;

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
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
              background: "rgba(8,7,6,0.8)",
              backdropFilter: "blur(6px)",
            }}
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
                       overflow-hidden flex flex-col"
            style={{
              background: T.surface,
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "14px 14px 0 0",
              boxShadow: "0 32px 80px rgba(0,0,0,0.65)",
            }}
          >
            {/* Acento top */}
            <div
              style={{
                height: "2px",
                background: `linear-gradient(90deg, ${primaryColor}88, transparent)`,
                flexShrink: 0,
              }}
            />

            {/* Acento esquina */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "14px",
                height: "14px",
                borderTop: "1px solid rgba(255,45,85,0.35)",
                borderRight: "1px solid rgba(255,45,85,0.35)",
                borderTopRightRadius: "14px",
                pointerEvents: "none",
              }}
            />

            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 22px 16px",
                flexShrink: 0,
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "6px",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "12px",
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
                    {isEditing ? "Editar" : "Nuevo"}
                  </span>
                </div>
                <h2
                  style={{
                    fontFamily:
                      "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
                    fontSize: "1.4rem",
                    fontWeight: 300,
                    color: T.textPrimary,
                    letterSpacing: "-0.02em",
                    margin: 0,
                  }}
                >
                  {isEditing ? editingService!.name : "Agregar servicio"}
                </h2>
              </div>

              <button
                onClick={onClose}
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "7px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: T.textDim,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLElement).style.color = T.textMid;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "none";
                  (e.currentTarget as HTMLElement).style.color = T.textDim;
                }}
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Body — scrollable */}
            <div
              style={{ overflowY: "auto", flex: 1, padding: "20px 22px 24px" }}
            >
              {/* Suggestions toggle */}
              {!isEditing && (
                <button
                  onClick={() => setShowSuggestions((v) => !v)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: `1px dashed ${showSuggestions ? T.roseBorder : T.border}`,
                    background: showSuggestions ? T.roseGhost : "transparent",
                    marginBottom: "18px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    if (!showSuggestions) {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(255,255,255,0.02)";
                      (e.currentTarget as HTMLElement).style.borderColor =
                        T.borderMid;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!showSuggestions) {
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                      (e.currentTarget as HTMLElement).style.borderColor =
                        T.border;
                    }
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Sparkles
                      size={13}
                      strokeWidth={1.75}
                      style={{ color: T.roseDim }}
                    />
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 400,
                        color: T.textMid,
                      }}
                    >
                      Elegir de plantillas
                    </span>
                    <span style={{ fontSize: "11px", color: T.textDim }}>
                      — Rápido y fácil
                    </span>
                  </div>
                  <ChevronDown
                    size={13}
                    strokeWidth={1.5}
                    style={{
                      color: T.textDim,
                      transform: showSuggestions
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
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
                    style={{ overflow: "hidden", marginBottom: "18px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      {SERVICE_SUGGESTIONS.map((cat) => (
                        <div
                          key={cat.category}
                          style={{
                            borderRadius: "8px",
                            border: `1px solid ${T.border}`,
                            overflow: "hidden",
                          }}
                        >
                          <button
                            onClick={() =>
                              setOpenCategory(
                                openCategory === cat.category
                                  ? null
                                  : cat.category,
                              )
                            }
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 14px",
                              fontSize: "12px",
                              color: T.textMid,
                              background:
                                openCategory === cat.category
                                  ? "rgba(255,255,255,0.03)"
                                  : "transparent",
                              border: "none",
                              cursor: "pointer",
                              textAlign: "left",
                              transition: "background 0.15s",
                              fontFamily: "inherit",
                            }}
                            onMouseEnter={(e) => {
                              (
                                e.currentTarget as HTMLElement
                              ).style.background = "rgba(255,255,255,0.03)";
                            }}
                            onMouseLeave={(e) => {
                              if (openCategory !== cat.category)
                                (
                                  e.currentTarget as HTMLElement
                                ).style.background = "transparent";
                            }}
                          >
                            {cat.category}
                            <ChevronDown
                              size={12}
                              strokeWidth={1.5}
                              style={{
                                color: T.textDim,
                                transform:
                                  openCategory === cat.category
                                    ? "rotate(180deg)"
                                    : "rotate(0deg)",
                                transition: "transform 0.2s",
                              }}
                            />
                          </button>

                          <AnimatePresence>
                            {openCategory === cat.category && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ overflow: "hidden" }}
                              >
                                <div
                                  style={{
                                    padding: "8px 12px 12px",
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "6px",
                                  }}
                                >
                                  {cat.items.map((item) => (
                                    <button
                                      key={item.name}
                                      onClick={() => applySuggestion(item)}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "5px",
                                        padding: "5px 10px",
                                        borderRadius: "6px",
                                        border: `1px solid ${T.border}`,
                                        fontSize: "11px",
                                        color: T.textMid,
                                        background: "transparent",
                                        cursor: "pointer",
                                        transition: "all 0.15s",
                                        fontFamily: "inherit",
                                      }}
                                      onMouseEnter={(e) => {
                                        (
                                          e.currentTarget as HTMLElement
                                        ).style.background =
                                          `${primaryColor}10`;
                                        (
                                          e.currentTarget as HTMLElement
                                        ).style.borderColor =
                                          `${primaryColor}35`;
                                        (
                                          e.currentTarget as HTMLElement
                                        ).style.color = `${primaryColor}CC`;
                                      }}
                                      onMouseLeave={(e) => {
                                        (
                                          e.currentTarget as HTMLElement
                                        ).style.background = "transparent";
                                        (
                                          e.currentTarget as HTMLElement
                                        ).style.borderColor = T.border;
                                        (
                                          e.currentTarget as HTMLElement
                                        ).style.color = T.textMid;
                                      }}
                                    >
                                      <span>{item.name}</span>
                                      <span style={{ color: T.textDim }}>
                                        ·
                                      </span>
                                      <span style={{ color: T.textDim }}>
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

                    {/* Divider */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        margin: "18px 0",
                      }}
                    >
                      <div
                        style={{ flex: 1, height: "1px", background: T.border }}
                      />
                      <span
                        style={{
                          fontSize: "11px",
                          color: T.textDim,
                          letterSpacing: "0.06em",
                        }}
                      >
                        o personaliza
                      </span>
                      <div
                        style={{ flex: 1, height: "1px", background: T.border }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error de API */}
              {apiError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    background: "rgba(239,68,68,0.07)",
                    border: "1px solid rgba(239,68,68,0.18)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    marginBottom: "16px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "12px",
                      color: "rgba(252,165,165,0.85)",
                      margin: 0,
                    }}
                  >
                    {apiError}
                  </p>
                </motion.div>
              )}

              {/* Form */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
                noValidate
              >
                {/* Nombre */}
                <div>
                  <FieldLabel required>Nombre del servicio</FieldLabel>
                  <input
                    {...register("name")}
                    placeholder="ej. Corte de damas"
                    style={inputStyle}
                    {...inputFocus}
                  />
                  <ErrMsg msg={errors.name?.message} />
                </div>

                {/* Duración */}
                <div>
                  <FieldLabel required>Duración</FieldLabel>
                  {/* Presets */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      marginBottom: "8px",
                    }}
                  >
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
                          style={{
                            padding: "5px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 400,
                            border: `1px solid ${isSelected ? `${primaryColor}40` : T.border}`,
                            background: isSelected
                              ? `${primaryColor}15`
                              : "transparent",
                            color: isSelected ? `${primaryColor}CC` : T.textDim,
                            cursor: "pointer",
                            transition: "all 0.15s",
                            fontFamily: "inherit",
                          }}
                        >
                          {min < 60 ? `${min}m` : `${min / 60}h`}
                          {min % 60 !== 0 && min > 60 ? `${min % 60}m` : ""}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ position: "relative" }}>
                    <Clock
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
                          style={{ ...inputStyle, paddingLeft: "34px" }}
                          {...inputFocus}
                        />
                      )}
                    />
                  </div>
                  <ErrMsg msg={errors.duration_minutes?.message} />
                </div>

                {/* Precio */}
                <div>
                  <FieldLabel required>Precio (USD)</FieldLabel>
                  <div style={{ position: "relative" }}>
                    <DollarSign
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
                          style={{ ...inputStyle, paddingLeft: "34px" }}
                          {...inputFocus}
                        />
                      )}
                    />
                  </div>
                  <ErrMsg msg={errors.price?.message} />
                </div>

                {/* Descripción */}
                <div>
                  <label
                    style={{
                      fontSize: "10px",
                      fontWeight: 400,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: T.textDim,
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Descripción{" "}
                    <span
                      style={{
                        color: "rgba(245,242,238,0.12)",
                        fontWeight: 300,
                        textTransform: "none",
                        letterSpacing: 0,
                      }}
                    >
                      (opcional)
                    </span>
                  </label>
                  <textarea
                    {...register("description")}
                    rows={2}
                    placeholder="Describe brevemente este servicio..."
                    style={{
                      ...inputStyle,
                      resize: "none",
                      height: "auto",
                    }}
                    {...inputFocus}
                  />
                  <ErrMsg msg={errors.description?.message} />
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={!isLoading ? { y: -1 } : {}}
                  whileTap={!isLoading ? { scale: 0.99 } : {}}
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: "8px",
                    border: `1px solid ${T.roseBorder}`,
                    background: T.roseGhost,
                    color: T.roseDim,
                    fontSize: "12px",
                    fontWeight: 400,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "7px",
                    opacity: isLoading ? 0.5 : 1,
                    transition: "all 0.2s",
                    marginTop: "4px",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(255,45,85,0.16)";
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "rgba(255,45,85,0.42)";
                      (e.currentTarget as HTMLElement).style.color = "#FF2D55";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      T.roseGhost;
                    (e.currentTarget as HTMLElement).style.borderColor =
                      T.roseBorder;
                    (e.currentTarget as HTMLElement).style.color = T.roseDim;
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />{" "}
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
