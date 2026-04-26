"use client";

// components/booking/BookingForm.tsx
// Fase 8.1 v2 — Formulario adaptado a la estética oscura premium

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

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = `
  .bf-title {
    font-family: var(--font-cormorant), Georgia, serif;
    font-size: 1.75rem;
    font-weight: 600;
    color: rgba(245, 242, 238, 0.95);
    line-height: 1.15;
    margin-bottom: 4px;
    letter-spacing: -0.01em;
  }

  .bf-subtitle {
    font-size: 13px;
    color: rgba(245, 242, 238, 0.4);
    font-family: var(--font-jakarta), sans-serif;
    margin-bottom: 20px;
  }

  /* Resumen de cita */
  .bf-summary {
    border-radius: 14px;
    padding: 14px 16px;
    margin-bottom: 20px;
  }

  .bf-summary-service {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .bf-summary-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .bf-summary-label {
    font-size: 11px;
    color: rgba(245, 242, 238, 0.35);
    margin-bottom: 2px;
    font-family: var(--font-jakarta), sans-serif;
  }

  .bf-summary-name {
    font-size: 15px;
    font-weight: 700;
    line-height: 1.2;
    font-family: var(--font-jakarta), sans-serif;
  }

  .bf-summary-divider {
    height: 1px;
    margin-bottom: 10px;
  }

  .bf-summary-meta {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .bf-summary-meta-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: rgba(245, 242, 238, 0.45);
    font-family: var(--font-jakarta), sans-serif;
    text-transform: capitalize;
  }

  /* Campos del formulario */
  .bf-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .bf-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    color: rgba(245, 242, 238, 0.45);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-family: var(--font-jakarta), sans-serif;
  }

  .bf-required {
    color: #EF4444;
    margin-left: 1px;
  }

  .bf-input {
    width: 100%;
    padding: 11px 14px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.09);
    background: rgba(255, 255, 255, 0.05);
    font-size: 14px;
    color: rgba(245, 242, 238, 0.9);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    box-sizing: border-box;
    font-family: var(--font-jakarta), sans-serif;
  }

  .bf-input::placeholder {
    color: rgba(245, 242, 238, 0.2);
  }

  .bf-input:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Prefijo teléfono */
  .bf-phone-wrap {
    display: flex;
    align-items: stretch;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.09);
    background: rgba(255, 255, 255, 0.05);
    overflow: hidden;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .bf-phone-prefix {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 11px 12px;
    background: rgba(255, 255, 255, 0.04);
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
  }

  .bf-phone-prefix-text {
    font-size: 13px;
    font-weight: 600;
    color: rgba(245, 242, 238, 0.45);
    font-family: var(--font-jakarta), sans-serif;
  }

  .bf-phone-input {
    flex: 1;
    padding: 11px 14px;
    font-size: 14px;
    color: rgba(245, 242, 238, 0.9);
    outline: none;
    background: transparent;
    border: none;
    font-family: var(--font-jakarta), sans-serif;
  }

  .bf-phone-input::placeholder {
    color: rgba(245, 242, 238, 0.2);
  }

  .bf-error-msg {
    font-size: 12px;
    color: #F87171;
    font-family: var(--font-jakarta), sans-serif;
  }

  /* Error de API */
  .bf-api-error {
    border-radius: 12px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    padding: 12px 16px;
    margin-bottom: 16px;
  }

  .bf-api-error-text {
    font-size: 13px;
    color: #FCA5A5;
    line-height: 1.5;
    font-family: var(--font-jakarta), sans-serif;
  }

  /* Botón submit */
  .bf-submit {
    width: 100%;
    padding: 14px 24px;
    border-radius: 12px;
    border: none;
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 4px;
    transition: opacity 0.15s, transform 0.15s;
    font-family: var(--font-jakarta), sans-serif;
    letter-spacing: 0.01em;
  }

  .bf-submit:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  /* Nota de privacidad */
  .bf-privacy {
    text-align: center;
    font-size: 11px;
    color: rgba(245, 242, 238, 0.22);
    padding-top: 4px;
    font-family: var(--font-jakarta), sans-serif;
    line-height: 1.5;
  }
`;

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
    <div className="bf-field">
      <label className="bf-label">
        {icon}
        {label}
        {required && <span className="bf-required">*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="bf-error-msg"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

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

  const handleFormSubmit = (values: FormValues) => {
    onSubmit({ ...values, client_phone: `+503 ${values.client_phone}` });
  };

  // Focus/blur handlers para inputs
  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = `${primaryColor}70`;
      e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}18`;
      e.currentTarget.style.background = "rgba(255,255,255,0.07)";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
    },
  };

  const phoneFocusHandlers = {
    onFocusCapture: (e: React.FocusEvent<HTMLDivElement>) => {
      e.currentTarget.style.borderColor = `${primaryColor}70`;
      e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}18`;
    },
    onBlurCapture: (e: React.FocusEvent<HTMLDivElement>) => {
      e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
      e.currentTarget.style.boxShadow = "none";
    },
  };

  return (
    <>
      <style>{styles}</style>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="bf-title">Tus datos</h2>
        <p className="bf-subtitle">Para confirmar tu reserva</p>
      </motion.div>

      {/* Resumen de la cita */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bf-summary"
        style={{
          background: `${primaryColor}0E`,
          border: `1px solid ${primaryColor}28`,
        }}
      >
        <div className="bf-summary-service">
          <div
            className="bf-summary-icon"
            style={{ background: `${primaryColor}18` }}
          >
            <Scissors size={15} style={{ color: primaryColor }} />
          </div>
          <div>
            <p className="bf-summary-label">Servicio seleccionado</p>
            <p className="bf-summary-name" style={{ color: primaryColor }}>
              {service.name}
            </p>
          </div>
        </div>

        <div
          className="bf-summary-divider"
          style={{ background: `${primaryColor}20` }}
        />

        <div className="bf-summary-meta">
          <span className="bf-summary-meta-item">
            <Calendar size={12} style={{ color: primaryColor, opacity: 0.7 }} />
            {selectedDateDisplay}
          </span>
          <span className="bf-summary-meta-item">
            <Clock size={12} style={{ color: primaryColor, opacity: 0.7 }} />
            {selectedTimeDisplay}
          </span>
        </div>
      </motion.div>

      {/* Error de API */}
      <AnimatePresence>
        {apiError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="bf-api-error"
          >
            <p className="bf-api-error-text">{apiError}</p>
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
            icon={<User size={11} />}
            error={errors.client_name?.message}
            required
          >
            <input
              {...register("client_name")}
              {...focusHandlers}
              type="text"
              placeholder="María García"
              autoComplete="name"
              className="bf-input"
            />
          </FieldWrapper>
        </motion.div>

        {/* Teléfono */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
        >
          <FieldWrapper
            label="Teléfono"
            icon={<Phone size={11} />}
            error={errors.client_phone?.message}
            required
          >
            <div className="bf-phone-wrap" {...phoneFocusHandlers}>
              <div className="bf-phone-prefix">
                <span style={{ fontSize: 14 }}>🇸🇻</span>
                <span className="bf-phone-prefix-text">+503</span>
              </div>
              <input
                {...register("client_phone")}
                type="tel"
                inputMode="numeric"
                maxLength={8}
                placeholder="7000 0000"
                autoComplete="tel-national"
                className="bf-phone-input"
                onKeyDown={(e) => {
                  const allowed = [
                    "Backspace",
                    "Delete",
                    "Tab",
                    "ArrowLeft",
                    "ArrowRight",
                  ];
                  if (!allowed.includes(e.key) && !/^\d$/.test(e.key))
                    e.preventDefault();
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
            icon={<Mail size={11} />}
            error={errors.client_email?.message}
          >
            <input
              {...register("client_email")}
              {...focusHandlers}
              type="email"
              placeholder="maria@ejemplo.com"
              autoComplete="email"
              className="bf-input"
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
            icon={<MessageSquare size={11} />}
            error={errors.client_notes?.message}
          >
            <textarea
              {...register("client_notes")}
              rows={3}
              placeholder="Alergias, preferencias, preguntas..."
              onFocus={(e) => {
                e.currentTarget.style.borderColor = `${primaryColor}70`;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}18`;
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
              className="bf-input"
              style={{ resize: "none", height: 88 }}
            />
          </FieldWrapper>
        </motion.div>

        {/* Submit */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          whileHover={!isLoading ? { scale: 1.015 } : {}}
          whileTap={!isLoading ? { scale: 0.985 } : {}}
          type="submit"
          disabled={isLoading}
          className="bf-submit"
          style={{
            backgroundColor: primaryColor,
            boxShadow: `0 8px 28px ${primaryColor}35`,
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

        {/* Privacidad */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
          className="bf-privacy"
        >
          🔒 Tus datos solo se usan para gestionar tu cita
        </motion.p>
      </form>
    </>
  );
}
