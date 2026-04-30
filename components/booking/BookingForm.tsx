"use client";

// components/booking/BookingForm.tsx
// Lógica de validación Zod, focusHandlers y handleFormSubmit 100% intactos.

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

// ─── Schema — intacto ─────────────────────────────────────────────────────────
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
    font-family: var(--font-display);
    font-size: 1.8rem;
    font-weight: 300;
    color: rgba(245,242,238,0.92);
    line-height: 1.1;
    margin-bottom: 5px;
    letter-spacing: -0.025em;
  }

  .bf-subtitle {
    font-size: 13px;
    color: rgba(245,242,238,0.3);
    font-family: var(--font-body);
    letter-spacing: 0.02em;
    margin-bottom: 20px;
  }

  /* Resumen de cita — mini ticket */
  .bf-summary {
    border-radius: 14px;
    padding: 16px;
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
  }

  .bf-summary::before {
    content: '';
    position: absolute;
    top: 0;
    left: 10%;
    right: 10%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
    pointer-events: none;
  }

  .bf-sum-service {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  .bf-sum-icon {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .bf-sum-label {
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(245,242,238,0.28);
    margin-bottom: 3px;
    font-family: var(--font-body);
  }

  .bf-sum-name {
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: 300;
    line-height: 1.15;
    letter-spacing: -0.01em;
  }

  .bf-sum-divider {
    height: 1px;
    margin-bottom: 12px;
  }

  .bf-sum-meta {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .bf-sum-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: rgba(245,242,238,0.38);
    font-family: var(--font-body);
    text-transform: capitalize;
    letter-spacing: 0.02em;
  }

  /* Campos */
  .bf-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .bf-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    font-weight: 500;
    color: rgba(245,242,238,0.35);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-family: var(--font-body);
  }

  .bf-required {
    color: rgba(255,45,85,0.6);
    margin-left: 1px;
  }

  .bf-input {
    width: 100%;
    padding: 11px 14px;
    border-radius: 11px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    font-size: 14px;
    color: rgba(245,242,238,0.88);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    box-sizing: border-box;
    font-family: var(--font-body);
  }

  .bf-input::placeholder {
    color: rgba(245,242,238,0.18);
  }

  .bf-input:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Teléfono */
  .bf-phone-wrap {
    display: flex;
    align-items: stretch;
    border-radius: 11px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    overflow: hidden;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .bf-phone-prefix {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 11px 12px;
    background: rgba(255,255,255,0.03);
    border-right: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
  }

  .bf-prefix-text {
    font-size: 13px;
    font-weight: 500;
    color: rgba(245,242,238,0.35);
    font-family: var(--font-body);
  }

  .bf-phone-input {
    flex: 1;
    padding: 11px 14px;
    font-size: 14px;
    color: rgba(245,242,238,0.88);
    outline: none;
    background: transparent;
    border: none;
    font-family: var(--font-body);
  }

  .bf-phone-input::placeholder {
    color: rgba(245,242,238,0.18);
  }

  .bf-error {
    font-size: 11px;
    color: rgba(255,100,100,0.8);
    font-family: var(--font-body);
    letter-spacing: 0.02em;
  }

  /* API error */
  .bf-api-error {
    border-radius: 11px;
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.18);
    padding: 12px 14px;
    margin-bottom: 14px;
  }

  .bf-api-error-text {
    font-size: 12px;
    color: rgba(252,165,165,0.85);
    line-height: 1.55;
    font-family: var(--font-body);
  }

  /* Submit */
  .bf-submit {
    width: 100%;
    padding: 14px 24px;
    border-radius: 11px;
    border: none;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 4px;
    transition: opacity 0.15s, transform 0.12s;
    font-family: var(--font-body);
    letter-spacing: 0.04em;
  }

  .bf-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .bf-privacy {
    text-align: center;
    font-size: 11px;
    color: rgba(245,242,238,0.18);
    padding-top: 4px;
    font-family: var(--font-body);
    letter-spacing: 0.04em;
  }
`;

// ─── FieldWrapper ─────────────────────────────────────────────────────────────
function FieldWrapper({
  label,
  icon,
  error,
  required,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
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
            className="bf-error"
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

  // ── Handlers — lógica intacta ──────────────────────────────────────────────
  const handleFormSubmit = (values: FormValues) => {
    onSubmit({ ...values, client_phone: `+503 ${values.client_phone}` });
  };

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = `${primaryColor}60`;
      e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}14`;
      e.currentTarget.style.background = "rgba(255,255,255,0.06)";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
    },
  };

  const phoneFocusHandlers = {
    onFocusCapture: (e: React.FocusEvent<HTMLDivElement>) => {
      e.currentTarget.style.borderColor = `${primaryColor}60`;
      e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}14`;
    },
    onBlurCapture: (e: React.FocusEvent<HTMLDivElement>) => {
      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
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

      {/* Resumen de cita — mini ticket */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bf-summary"
        style={{
          background: `${primaryColor}0D`,
          border: `1px solid ${primaryColor}22`,
        }}
      >
        <div className="bf-sum-service">
          <div
            className="bf-sum-icon"
            style={{ background: `${primaryColor}18` }}
          >
            <Scissors
              size={14}
              strokeWidth={1.75}
              style={{ color: primaryColor }}
            />
          </div>
          <div>
            <p className="bf-sum-label">Servicio seleccionado</p>
            <p className="bf-sum-name" style={{ color: primaryColor }}>
              {service.name}
            </p>
          </div>
        </div>
        <div
          className="bf-sum-divider"
          style={{ background: `${primaryColor}18` }}
        />
        <div className="bf-sum-meta">
          <span className="bf-sum-item">
            <Calendar
              size={11}
              strokeWidth={1.75}
              style={{ color: primaryColor, opacity: 0.6 }}
            />
            {selectedDateDisplay}
          </span>
          <span className="bf-sum-item">
            <Clock
              size={11}
              strokeWidth={1.75}
              style={{ color: primaryColor, opacity: 0.6 }}
            />
            {selectedTimeDisplay}
          </span>
        </div>
      </motion.div>

      {/* API error */}
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
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
        noValidate
      >
        {/* Nombre */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <FieldWrapper
            label="Nombre completo"
            icon={<User size={10} strokeWidth={1.75} />}
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
        >
          <FieldWrapper
            label="Teléfono"
            icon={<Phone size={10} strokeWidth={1.75} />}
            error={errors.client_phone?.message}
            required
          >
            <div className="bf-phone-wrap" {...phoneFocusHandlers}>
              <div className="bf-phone-prefix">
                <span style={{ fontSize: 13 }}>🇸🇻</span>
                <span className="bf-prefix-text">+503</span>
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          <FieldWrapper
            label="Email (opcional)"
            icon={<Mail size={10} strokeWidth={1.75} />}
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.19 }}
        >
          <FieldWrapper
            label="Notas adicionales (opcional)"
            icon={<MessageSquare size={10} strokeWidth={1.75} />}
            error={errors.client_notes?.message}
          >
            <textarea
              {...register("client_notes")}
              rows={3}
              placeholder="Alergias, preferencias, preguntas..."
              onFocus={(e) => {
                e.currentTarget.style.borderColor = `${primaryColor}60`;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${primaryColor}14`;
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
              className="bf-input"
              style={{ resize: "none", height: 84 }}
            />
          </FieldWrapper>
        </motion.div>

        {/* Submit */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          whileHover={!isLoading ? { scale: 1.012 } : {}}
          whileTap={!isLoading ? { scale: 0.988 } : {}}
          type="submit"
          disabled={isLoading}
          className="bf-submit"
          style={{
            background: primaryColor,
            boxShadow: `0 8px 28px ${primaryColor}35`,
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Confirmando
              reserva...
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
