"use client";

// components/booking/BookingForm.tsx
// Fase 8.1 — Ajustes visuales: consistencia con el sistema de diseño del widget

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MessageSquare,
  Loader2,
  Calendar,
  Clock,
  Scissors,
} from "lucide-react";
import type { BookingFormData, SelectedService } from "@/types/booking.types";

// ─── Schema ───────────────────────────────────────────────────────────────────
// client_phone guarda solo los 8 dígitos — el prefijo +503 se agrega al enviar
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

type FormValues = z.infer<typeof bookingFormSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────
interface BookingFormProps {
  service: SelectedService;
  selectedDateDisplay: string;
  selectedTimeDisplay: string;
  primaryColor: string;
  onSubmit: (data: BookingFormData) => void;
  isLoading: boolean;
  apiError: string | null;
}

// ─── FieldWrapper ─────────────────────────────────────────────────────────────
interface FieldWrapperProps {
  label: string;
  icon: React.ReactNode;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function FieldWrapper({
  label,
  icon,
  error,
  required,
  children,
}: FieldWrapperProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "#9C8E85",
          letterSpacing: "0.02em",
        }}
      >
        {icon}
        {label}
        {required && <span style={{ color: "#EF4444", marginLeft: 1 }}>*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            style={{
              fontSize: "0.75rem",
              color: "#EF4444",
              margin: 0,
            }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Estilos base de inputs ───────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1.5px solid #EDE8E3",
  backgroundColor: "#FDFCFB",
  fontSize: "14px",
  color: "#2D2420",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s, background-color 0.15s",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

// ─── Componente principal ─────────────────────────────────────────────────────
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

  // Al hacer submit concatenamos +503 antes de pasar al padre
  const handleFormSubmit = (values: FormValues) => {
    onSubmit({
      ...values,
      client_phone: `+503 ${values.client_phone}`,
    });
  };

  // Focus/blur handlers para inputs — aplican color de marca
  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = primaryColor;
      e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}18`;
      e.currentTarget.style.backgroundColor = "#fff";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = "#EDE8E3";
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.backgroundColor = "#FDFCFB";
    },
  };

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 20 }}
      >
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "1.625rem",
            fontWeight: 600,
            color: "#2D2420",
            lineHeight: 1.2,
            marginBottom: 4,
          }}
        >
          Tus datos
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "#9C8E85" }}>
          Para confirmar tu reserva
        </p>
      </motion.div>

      {/* Resumen de la cita */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{
          borderRadius: 14,
          border: `1.5px solid ${primaryColor}30`,
          backgroundColor: `${primaryColor}06`,
          padding: "14px 16px",
          marginBottom: 20,
        }}
      >
        {/* Servicio */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: `${primaryColor}14`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Scissors size={14} style={{ color: primaryColor }} />
          </div>
          <div>
            <p
              style={{
                fontSize: "0.6875rem",
                color: "#9C8E85",
                marginBottom: 1,
              }}
            >
              Servicio seleccionado
            </p>
            <p
              style={{
                fontSize: "0.9375rem",
                fontWeight: 700,
                color: primaryColor,
                lineHeight: 1.2,
              }}
            >
              {service.name}
            </p>
          </div>
        </div>

        {/* Separador */}
        <div
          style={{
            height: 1,
            backgroundColor: `${primaryColor}20`,
            marginBottom: 10,
          }}
        />

        {/* Fecha y hora */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: "0.75rem",
              color: "#9C8E85",
            }}
          >
            <Calendar size={12} style={{ color: primaryColor, opacity: 0.7 }} />
            <span style={{ textTransform: "capitalize" }}>
              {selectedDateDisplay}
            </span>
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: "0.75rem",
              color: "#9C8E85",
            }}
          >
            <Clock size={12} style={{ color: primaryColor, opacity: 0.7 }} />
            {selectedTimeDisplay}
          </span>
        </div>
      </motion.div>

      {/* Error de API */}
      <AnimatePresence>
        {apiError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            style={{
              borderRadius: 12,
              backgroundColor: "#FEF2F2",
              border: "1.5px solid #FECACA",
              padding: "12px 16px",
              marginBottom: 16,
            }}
          >
            <p
              style={{
                fontSize: "0.8125rem",
                color: "#DC2626",
                lineHeight: 1.5,
              }}
            >
              {apiError}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulario */}
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
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

        {/* Teléfono con prefijo fijo +503 */}
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
              style={{
                display: "flex",
                alignItems: "stretch",
                borderRadius: 12,
                border: "1.5px solid #EDE8E3",
                backgroundColor: "#FDFCFB",
                overflow: "hidden",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocusCapture={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = primaryColor;
                el.style.boxShadow = `0 0 0 3px ${primaryColor}18`;
              }}
              onBlurCapture={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "#EDE8E3";
                el.style.boxShadow = "none";
              }}
            >
              {/* Prefijo fijo */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 12px",
                  backgroundColor: "#FAF8F5",
                  borderRight: "1.5px solid #EDE8E3",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: "14px" }}>🇸🇻</span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#9C8E85",
                  }}
                >
                  +503
                </span>
              </div>

              {/* Input — solo 8 dígitos */}
              <input
                {...register("client_phone")}
                type="tel"
                inputMode="numeric"
                maxLength={8}
                placeholder="7000 0000"
                autoComplete="tel-national"
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  fontSize: "14px",
                  color: "#2D2420",
                  outline: "none",
                  backgroundColor: "transparent",
                  border: "none",
                  fontFamily: "inherit",
                }}
                onKeyDown={(e) => {
                  const allowed = [
                    "Backspace",
                    "Delete",
                    "Tab",
                    "ArrowLeft",
                    "ArrowRight",
                  ];
                  if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </div>
          </FieldWrapper>
        </motion.div>

        {/* Email — opcional */}
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

        {/* Notas — opcional */}
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
                e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}18`;
                e.currentTarget.style.backgroundColor = "#fff";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#EDE8E3";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.backgroundColor = "#FDFCFB";
              }}
              style={{
                ...inputBase,
                resize: "none",
                height: 88,
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
          whileHover={!isLoading ? { scale: 1.015 } : {}}
          whileTap={!isLoading ? { scale: 0.985 } : {}}
          style={{
            width: "100%",
            padding: "13px 24px",
            borderRadius: 12,
            border: "none",
            backgroundColor: primaryColor,
            color: "#fff",
            fontSize: "0.9375rem",
            fontWeight: 700,
            cursor: isLoading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 4,
            opacity: isLoading ? 0.65 : 1,
            boxShadow: `0 8px 24px ${primaryColor}30`,
            transition: "opacity 0.15s",
            fontFamily: "inherit",
            letterSpacing: "0.01em",
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Confirmando reserva...
            </>
          ) : (
            "Confirmar reserva →"
          )}
        </motion.button>

        {/* Nota de privacidad */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
          style={{
            textAlign: "center",
            fontSize: "0.6875rem",
            color: "#C4B8B0",
            lineHeight: 1.5,
          }}
        >
          🔒 Tus datos solo se usan para gestionar tu cita
        </motion.p>
      </form>
    </div>
  );
}
