"use client";

// components/booking/BookingForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { User, Mail, Phone, MessageSquare, Loader2, Calendar, Clock } from "lucide-react";
import type { BookingFormData, SelectedService } from "@/types/booking.types";

// ─── Schema ───────────────────────────────────────────────────────────────────
// client_phone aquí guarda solo los 8 dígitos — el prefijo +503 se agrega al enviar
const bookingFormSchema = z.object({
  client_name: z
    .string()
    .min(2, "Nombre muy corto")
    .max(100, "Nombre muy largo")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/, "Solo letras y espacios"),
  client_email: z
    .string()
    .email("Email inválido")
    .max(254)
    .optional()
    .or(z.literal("")),
  client_phone: z
    .string()
    .length(8, "El teléfono debe tener exactamente 8 dígitos")
    .regex(/^\d{8}$/, "Solo números, sin espacios ni guiones"),
  client_notes: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
});

// Tipo interno del form (8 dígitos)
type FormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  service: SelectedService;
  selectedDateDisplay: string;
  selectedTimeDisplay: string;
  primaryColor: string;
  onSubmit: (data: BookingFormData) => void;
  isLoading: boolean;
  apiError: string | null;
}

interface FieldWrapperProps {
  label: string;
  icon: React.ReactNode;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function FieldWrapper({ label, icon, error, required, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-[#9C8E85]">
        {icon}
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-500"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

export default function BookingForm({
  service,
  selectedDateDisplay,
  selectedTimeDisplay,
  primaryColor,
  onSubmit,
  isLoading,
  apiError,
}: BookingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      client_name: "",
      client_email: "",
      client_phone: "",
      client_notes: "",
    },
  });

  // Al hacer submit, concatenamos +503 antes de pasar al padre
  const handleFormSubmit = (values: FormValues) => {
    onSubmit({
      ...values,
      client_phone: `+503 ${values.client_phone}`,
    });
  };

  // Estilos base para inputs — sin outline nativo, ring controlado por inline style
  const inputBase: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "12px",
    border: `1.5px solid #EDE8E3`,
    backgroundColor: "#fff",
    fontSize: "14px",
    color: "#2D2420",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    boxSizing: "border-box",
  };

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = primaryColor;
      e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = "#EDE8E3";
      e.currentTarget.style.boxShadow = "none";
    },
  };

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        <h2 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-[#2D2420]">
          Tus datos
        </h2>
        <p className="text-[#9C8E85] text-sm mt-1">Para confirmar tu reserva</p>
      </motion.div>

      {/* Resumen de la cita */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border border-[#EDE8E3] bg-[#FAF8F5] p-3.5 mb-5"
      >
        <p className="text-xs font-medium text-[#9C8E85] mb-2">Tu reserva</p>
        <p className="font-semibold text-sm" style={{ color: primaryColor }}>
          {service.name}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-xs text-[#9C8E85]">
            <Calendar size={11} />
            {selectedDateDisplay}
          </span>
          <span className="flex items-center gap-1 text-xs text-[#9C8E85]">
            <Clock size={11} />
            {selectedTimeDisplay}
          </span>
        </div>
      </motion.div>

      {/* API Error */}
      {apiError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-4"
        >
          <p className="text-sm text-red-600">{apiError}</p>
        </motion.div>
      )}

      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        {/* Nombre */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <FieldWrapper
            label="Nombre completo"
            icon={<User size={12} />}
            error={errors.client_name?.message}
            required
          >
            <input
              {...register("client_name")}
              {...focusHandlers}
              type="text"
              placeholder="María García"
              autoComplete="name"
              style={inputBase}
            />
          </FieldWrapper>
        </motion.div>

        {/* Teléfono con prefijo fijo */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
        >
          <FieldWrapper
            label="Teléfono"
            icon={<Phone size={12} />}
            error={errors.client_phone?.message}
            required
          >
            <div
              className="flex items-center rounded-xl border border-[#EDE8E3] bg-white
                         overflow-hidden transition-all duration-150"
              style={{ boxSizing: "border-box" }}
              onFocusCapture={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = primaryColor;
                el.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
              }}
              onBlurCapture={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "#EDE8E3";
                el.style.boxShadow = "none";
              }}
            >
              {/* Prefijo fijo */}
              <div className="flex items-center gap-1.5 px-3 py-2.5 bg-[#FAF8F5]
                              border-r border-[#EDE8E3] shrink-0">
                <span className="text-sm">🇸🇻</span>
                <span className="text-sm font-medium text-[#9C8E85]">+503</span>
              </div>

              {/* Input solo 8 dígitos */}
              <input
                {...register("client_phone")}
                type="tel"
                inputMode="numeric"
                maxLength={8}
                placeholder="7000 0000"
                autoComplete="tel-national"
                className="flex-1 px-3 py-2.5 text-sm text-[#2D2420]
                           placeholder:text-[#C4B8B0] outline-none bg-transparent"
                // Permitir solo dígitos mientras escribe
                onKeyDown={(e) => {
                  const allowed = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight"];
                  if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </div>
          </FieldWrapper>
        </motion.div>

        {/* Email */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          <FieldWrapper
            label="Email (opcional)"
            icon={<Mail size={12} />}
            error={errors.client_email?.message}
          >
            <input
              {...register("client_email")}
              {...focusHandlers}
              type="email"
              placeholder="maria@ejemplo.com"
              autoComplete="email"
              style={inputBase}
            />
          </FieldWrapper>
        </motion.div>

        {/* Notas */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.19 }}
        >
          <FieldWrapper
            label="Notas adicionales (opcional)"
            icon={<MessageSquare size={12} />}
            error={errors.client_notes?.message}
          >
            <textarea
              {...register("client_notes")}
              rows={3}
              placeholder="Alergias, preferencias, preguntas..."
              onFocus={(e) => {
                e.currentTarget.style.borderColor = primaryColor;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#EDE8E3";
                e.currentTarget.style.boxShadow = "none";
              }}
              style={{
                ...inputBase,
                resize: "none",
                height: "88px",
              }}
            />
          </FieldWrapper>
        </motion.div>

        {/* Submit */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl font-semibold text-sm text-white
                     flex items-center justify-center gap-2 mt-1
                     disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
          style={{
            backgroundColor: primaryColor,
            boxShadow: `0 8px 24px ${primaryColor}30`,
          }}
          whileHover={!isLoading ? { scale: 1.01 } : {}}
          whileTap={!isLoading ? { scale: 0.99 } : {}}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Confirmando reserva...
            </>
          ) : (
            "Confirmar reserva"
          )}
        </motion.button>
      </form>
    </div>
  );
}