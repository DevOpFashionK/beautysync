"use client";

// components/auth/RegisterStepper.tsx
// Lógica completa intacta: schemas Zod, rate limiting, OTP, signUp,
// verifyOtp, creación de salón, trial de 14 días.
// Solo se actualizan los colores internos duros al sistema Dark Atelier.

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  ShieldCheck,
  Mail,
  RefreshCw,
} from "lucide-react";

// ─── SANITIZACIÓN — intacta ───────────────────────────────────────────────────
function sanitizeText(value: string): string {
  return value
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/['"`;\\/]/g, "")
    .trim();
}

function sanitizeEmail(value: string): string {
  return value.toLowerCase().trim().replace(/\s/g, "");
}

// ─── SCHEMAS ZOD — intactos ───────────────────────────────────────────────────
const STRONG_PASSWORD =
  /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,72}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

const step1Schema = z
  .object({
    full_name: z
      .string()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100, "El nombre es demasiado largo")
      .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Solo puede contener letras y espacios")
      .transform(sanitizeText),
    email: z
      .string()
      .min(1, "El email es requerido")
      .max(254, "Email demasiado largo")
      .regex(EMAIL_REGEX, "Email inválido")
      .transform(sanitizeEmail),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .max(72, "Máximo 72 caracteres")
      .regex(
        STRONG_PASSWORD,
        "Debe tener mayúscula, número y carácter especial (!@#$...)",
      ),
    confirm_password: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Las contraseñas no coinciden",
    path: ["confirm_password"],
  });

const step2Schema = z.object({
  salon_name: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(100, "Nombre demasiado largo")
    .regex(
      /^[a-zA-ZÀ-ÿ0-9\s'&.,\-]+$/,
      "Nombre contiene caracteres no permitidos",
    )
    .transform(sanitizeText),
  address: z
    .string()
    .min(5, "Mínimo 5 caracteres")
    .max(200, "Dirección demasiado larga")
    .transform(sanitizeText),
  phone: z
    .string()
    .length(8, "El teléfono debe tener exactamente 8 dígitos")
    .regex(/^\d{8}$/, "Solo números, sin espacios ni guiones")
    .optional()
    .or(z.literal("")),
  primary_color: z.string().regex(HEX_COLOR_REGEX, "Color inválido"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

// ─── RATE LIMITING — intacto ──────────────────────────────────────────────────
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW = 60;

function useRateLimit() {
  const attempts = useRef<number[]>([]);
  const checkLimit = useCallback((): {
    allowed: boolean;
    waitSeconds: number;
  } => {
    const now = Date.now();
    const windowMs = RATE_LIMIT_WINDOW * 1000;
    attempts.current = attempts.current.filter((t) => now - t < windowMs);
    if (attempts.current.length >= RATE_LIMIT_MAX) {
      const oldest = attempts.current[0];
      const waitSeconds = Math.ceil((windowMs - (now - oldest)) / 1000);
      return { allowed: false, waitSeconds };
    }
    attempts.current.push(now);
    return { allowed: true, waitSeconds: 0 };
  }, []);
  return { checkLimit };
}

// ─── PASSWORD STRENGTH — intacto ─────────────────────────────────────────────
function getPasswordStrength(pwd: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) score++;
  const levels = [
    { score: 0, label: "", color: "" },
    { score: 1, label: "Muy débil", color: "#EF4444" },
    { score: 2, label: "Débil", color: "#F97316" },
    { score: 3, label: "Regular", color: "#EAB308" },
    { score: 4, label: "Fuerte", color: "#22C55E" },
    { score: 5, label: "Muy fuerte", color: "#10B981" },
  ];
  return levels[Math.min(score, 5)];
}

// ─── ANIMACIONES — intactas ───────────────────────────────────────────────────
const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
};
const transition = { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const };

// ─── Tokens Dark Atelier ──────────────────────────────────────────────────────
const T = {
  surface2: "#131110",
  border: "rgba(255,255,255,0.055)",
  borderMid: "rgba(255,255,255,0.09)",
  textPrimary: "rgba(245,242,238,0.9)",
  textMid: "rgba(245,242,238,0.45)",
  textDim: "rgba(245,242,238,0.18)",
  rose: "#FF2D55",
  roseDim: "rgba(255,45,85,0.55)",
  roseGhost: "rgba(255,45,85,0.08)",
  roseBorder: "rgba(255,45,85,0.22)",
};

// ─── InputField Dark ─────────────────────────────────────────────────────────
function InputField({
  label,
  type = "text",
  placeholder,
  error,
  registration,
  maxLength,
  autoComplete,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
  registration: object;
  maxLength?: number;
  autoComplete?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label
        style={{
          fontSize: "10px",
          fontWeight: 400,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: T.textDim,
        }}
      >
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={autoComplete}
        spellCheck={false}
        style={{
          width: "100%",
          padding: "11px 14px",
          borderRadius: "8px",
          border: `1px solid ${error ? "rgba(255,80,80,0.45)" : T.borderMid}`,
          background: T.surface2,
          fontSize: "14px",
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
          e.currentTarget.style.borderColor = error
            ? "rgba(255,80,80,0.45)"
            : T.borderMid;
          e.currentTarget.style.boxShadow = "none";
        }}
        {...registration}
      />
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: "11px", color: "rgba(255,110,110,0.85)" }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// ─── StepIndicator Dark ───────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        justifyContent: "center",
        marginBottom: "36px",
      }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{ display: "flex", alignItems: "center", gap: "12px" }}
        >
          <motion.div
            animate={{
              backgroundColor: i <= current ? T.rose : "rgba(255,255,255,0.07)",
              scale: i === current ? 1.1 : 1,
            }}
            transition={{ duration: 0.3 }}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: 400,
              color: i <= current ? "#fff" : "rgba(245,242,238,0.2)",
              boxShadow:
                i === current ? `0 0 14px rgba(255,45,85,0.45)` : "none",
            }}
          >
            {i < current ? <CheckCircle size={14} /> : i + 1}
          </motion.div>
          {i < total - 1 && (
            <motion.div
              animate={{
                backgroundColor:
                  i < current ? T.rose : "rgba(255,255,255,0.08)",
              }}
              transition={{ duration: 0.4 }}
              style={{
                height: "1.5px",
                width: "40px",
                borderRadius: "2px",
                opacity: i < current ? 0.7 : 1,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Botón ghost dark ─────────────────────────────────────────────────────────
function BtnGhost({
  onClick,
  disabled,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      whileTap={{ scale: disabled ? 1 : 0.99 }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: "12px 20px",
        borderRadius: "8px",
        border: `1px solid ${T.border}`,
        background: "transparent",
        color: T.textMid,
        fontSize: "13px",
        fontWeight: 400,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all 0.2s",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => {
        if (!disabled)
          (e.currentTarget as HTMLElement).style.borderColor = T.borderMid;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = T.border;
      }}
    >
      {children}
    </motion.button>
  );
}

// ─── Botón primario rose ──────────────────────────────────────────────────────
function BtnPrimary({
  onClick,
  disabled,
  type = "submit",
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  type?: "submit" | "button";
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ y: disabled ? 0 : -1 }}
      whileTap={{ scale: disabled ? 1 : 0.99 }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "7px",
        padding: "12px 20px",
        borderRadius: "8px",
        border: `1px solid ${T.roseBorder}`,
        background: T.roseGhost,
        color: T.roseDim,
        fontSize: "13px",
        fontWeight: 400,
        letterSpacing: "0.06em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all 0.2s",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLElement).style.background =
            "rgba(255,45,85,0.16)";
          (e.currentTarget as HTMLElement).style.borderColor =
            "rgba(255,45,85,0.42)";
          (e.currentTarget as HTMLElement).style.color = T.rose;
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = T.roseGhost;
        (e.currentTarget as HTMLElement).style.borderColor = T.roseBorder;
        (e.currentTarget as HTMLElement).style.color = T.roseDim;
      }}
    >
      {children}
    </motion.button>
  );
}

// ─── Error banner dark ────────────────────────────────────────────────────────
function ErrorBanner({ msg }: { msg: string | null }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.18)",
            borderRadius: "8px",
            padding: "10px 14px",
          }}
        >
          <p style={{ fontSize: "12px", color: "rgba(252,165,165,0.85)" }}>
            {msg}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const SectionTitle = ({ title, sub }: { title: string; sub: string }) => (
  <div style={{ marginBottom: "4px" }}>
    <h2
      style={{
        fontFamily:
          "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
        fontSize: "2rem",
        fontWeight: 300,
        color: T.textPrimary,
        letterSpacing: "-0.025em",
        lineHeight: 1.1,
        margin: "0 0 6px",
      }}
    >
      {title}
    </h2>
    <p style={{ fontSize: "13px", color: T.textDim, letterSpacing: "0.02em" }}>
      {sub}
    </p>
  </div>
);

// ─── PASO 1 ───────────────────────────────────────────────────────────────────
function Step1({ onNext }: { onNext: (d: Step1Data) => void }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    mode: "onBlur",
  });
  const password = watch("password", "");
  const strength = getPasswordStrength(password);

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      style={{ display: "flex", flexDirection: "column", gap: "18px" }}
      noValidate
    >
      <SectionTitle
        title="Tu cuenta"
        sub="Comencemos con tus datos personales"
      />

      <InputField
        label="Nombre completo"
        placeholder="María García"
        error={errors.full_name?.message}
        registration={register("full_name")}
        maxLength={100}
        autoComplete="name"
      />
      <InputField
        label="Email"
        type="email"
        placeholder="maria@misalon.com"
        error={errors.email?.message}
        registration={register("email")}
        maxLength={254}
        autoComplete="email"
      />

      {/* Contraseña con strength indicator */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label
          style={{
            fontSize: "10px",
            fontWeight: 400,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: T.textDim,
          }}
        >
          Contraseña
        </label>
        <input
          type="password"
          placeholder="Mínimo 8 caracteres"
          maxLength={72}
          autoComplete="new-password"
          style={{
            width: "100%",
            padding: "11px 14px",
            borderRadius: "8px",
            border: `1px solid ${errors.password ? "rgba(255,80,80,0.45)" : T.borderMid}`,
            background: T.surface2,
            fontSize: "14px",
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
          {...(() => {
            const reg = register("password");
            return {
              ...reg,
              onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
                e.currentTarget.style.borderColor = errors.password
                  ? "rgba(255,80,80,0.45)"
                  : T.borderMid;
                e.currentTarget.style.boxShadow = "none";
                reg.onBlur(e);
              },
            };
          })()}
        />
        {password.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "2px",
            }}
          >
            <div style={{ display: "flex", gap: "4px", flex: 1 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  style={{
                    height: "3px",
                    flex: 1,
                    borderRadius: "2px",
                    transition: "background 0.3s",
                    background:
                      i <= strength.score
                        ? strength.color
                        : "rgba(255,255,255,0.07)",
                  }}
                />
              ))}
            </div>
            {strength.label && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 400,
                  color: strength.color,
                  letterSpacing: "0.06em",
                  whiteSpace: "nowrap",
                }}
              >
                {strength.label}
              </span>
            )}
          </div>
        )}
        {errors.password && (
          <p style={{ fontSize: "11px", color: "rgba(255,110,110,0.85)" }}>
            {errors.password.message}
          </p>
        )}
        <p
          style={{
            fontSize: "10px",
            color: T.textDim,
            letterSpacing: "0.03em",
          }}
        >
          Usa mayúsculas, números y símbolos (!@#$...)
        </p>
      </div>

      <InputField
        label="Confirmar contraseña"
        type="password"
        placeholder="Repite tu contraseña"
        error={errors.confirm_password?.message}
        registration={register("confirm_password")}
        maxLength={72}
        autoComplete="new-password"
      />

      <BtnPrimary type="submit">
        Continuar <ArrowRight size={14} strokeWidth={1.75} />
      </BtnPrimary>
    </form>
  );
}

// ─── PASO 2 ───────────────────────────────────────────────────────────────────
function Step2({
  onNext,
  onBack,
}: {
  onNext: (d: Step2Data) => void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { primary_color: "#FF2D55" },
    mode: "onBlur",
  });
  const primaryColor = watch("primary_color");

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      style={{ display: "flex", flexDirection: "column", gap: "18px" }}
      noValidate
    >
      <SectionTitle title="Tu salón" sub="Cuéntanos sobre tu espacio" />

      <InputField
        label="Nombre del salón"
        placeholder="Beauty & Co."
        error={errors.salon_name?.message}
        registration={register("salon_name")}
        maxLength={100}
        autoComplete="organization"
      />
      <InputField
        label="Dirección"
        placeholder="Calle Principal 123, Ciudad"
        error={errors.address?.message}
        registration={register("address")}
        maxLength={200}
        autoComplete="street-address"
      />

      {/* Teléfono */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label
          style={{
            fontSize: "10px",
            fontWeight: 400,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: T.textDim,
          }}
        >
          Teléfono (opcional)
        </label>
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            borderRadius: "8px",
            border: `1px solid ${T.borderMid}`,
            background: T.surface2,
            overflow: "hidden",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          onFocusCapture={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = T.roseBorder;
            (e.currentTarget as HTMLElement).style.boxShadow =
              `0 0 0 3px ${T.roseGhost}`;
          }}
          onBlurCapture={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = T.borderMid;
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "11px 12px",
              background: "rgba(255,255,255,0.03)",
              borderRight: `1px solid ${T.border}`,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: "13px" }}>🇸🇻</span>
            <span style={{ fontSize: "13px", color: T.textDim }}>+503</span>
          </div>
          <input
            {...register("phone")}
            type="tel"
            inputMode="numeric"
            maxLength={8}
            placeholder="7000 0000"
            autoComplete="tel-national"
            style={{
              flex: 1,
              padding: "11px 14px",
              fontSize: "14px",
              color: T.textPrimary,
              outline: "none",
              background: "transparent",
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
              if (!allowed.includes(e.key) && !/^\d$/.test(e.key))
                e.preventDefault();
            }}
          />
        </div>
        {errors.phone && (
          <p style={{ fontSize: "11px", color: "rgba(255,110,110,0.85)" }}>
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* Color de marca */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label
          style={{
            fontSize: "10px",
            fontWeight: 400,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: T.textDim,
          }}
        >
          Color de marca
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="color"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "8px",
              border: `1px solid ${T.borderMid}`,
              cursor: "pointer",
              padding: "4px",
              background: T.surface2,
            }}
            {...register("primary_color")}
          />
          <div
            style={{
              flex: 1,
              height: "48px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.88)",
              fontWeight: 400,
              transition: "background 0.2s",
              background: HEX_COLOR_REGEX.test(primaryColor)
                ? primaryColor
                : "#FF2D55",
            }}
          >
            {primaryColor}
          </div>
        </div>
        {errors.primary_color && (
          <p style={{ fontSize: "11px", color: "rgba(255,110,110,0.85)" }}>
            {errors.primary_color.message}
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
        <BtnGhost onClick={onBack}>
          <ArrowLeft size={14} strokeWidth={1.75} /> Atrás
        </BtnGhost>
        <div style={{ flex: 2 }}>
          <BtnPrimary type="submit">
            Continuar <ArrowRight size={14} strokeWidth={1.75} />
          </BtnPrimary>
        </div>
      </div>
    </form>
  );
}

// ─── PASO 3 — CONFIRMACIÓN ────────────────────────────────────────────────────
function Step3({
  step1Data,
  step2Data,
  onBack,
  onOtpSent,
}: {
  step1Data: Step1Data;
  step2Data: Step2Data;
  onBack: () => void;
  onOtpSent: (userId: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { checkLimit } = useRateLimit();

  // ── handleConfirm — lógica intacta ────────────────────────────────────────
  const handleConfirm = async () => {
    const { allowed, waitSeconds } = checkLimit();
    if (!allowed) {
      setError(`Demasiados intentos. Espera ${waitSeconds} segundos.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: step1Data.email,
        password: step1Data.password,
        options: { data: { full_name: sanitizeText(step1Data.full_name) } },
      });

      if (authError) {
        if (
          authError.message.includes("already registered") ||
          authError.message.includes("already exists")
        ) {
          setError(
            "Hubo un problema al crear tu cuenta. Verifica tus datos e intenta de nuevo.",
          );
        } else {
          setError("No se pudo crear la cuenta. Intenta de nuevo más tarde.");
        }
        return;
      }

      if (!authData.user) {
        setError("No se pudo crear la cuenta. Intenta de nuevo más tarde.");
        return;
      }

      onOtpSent(authData.user.id);
    } catch {
      setError("Ocurrió un error inesperado. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <SectionTitle
        title="¡Todo listo!"
        sub="Confirma tu información antes de comenzar"
      />

      {/* Resumen dark */}
      <div
        style={{
          background: "rgba(255,255,255,0.025)",
          border: `1px solid ${T.border}`,
          borderRadius: "10px",
          padding: "18px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "9px",
              fontWeight: 400,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: T.textDim,
              marginBottom: "6px",
            }}
          >
            Tu perfil
          </p>
          <p
            style={{
              fontSize: "14px",
              color: T.textPrimary,
              margin: "0 0 2px",
            }}
          >
            {step1Data.full_name}
          </p>
          <p style={{ fontSize: "12px", color: T.textMid, margin: 0 }}>
            {step1Data.email.replace(/(.{2}).+(@.+)/, "$1•••$2")}
          </p>
        </div>
        <div style={{ height: "1px", background: T.border }} />
        <div>
          <p
            style={{
              fontSize: "9px",
              fontWeight: 400,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: T.textDim,
              marginBottom: "6px",
            }}
          >
            Tu salón
          </p>
          <p
            style={{
              fontSize: "14px",
              color: T.textPrimary,
              margin: "0 0 2px",
            }}
          >
            {step2Data.salon_name}
          </p>
          <p style={{ fontSize: "12px", color: T.textMid, margin: 0 }}>
            {step2Data.address}
          </p>
          {step2Data.phone && (
            <p
              style={{ fontSize: "12px", color: T.textMid, margin: "2px 0 0" }}
            >
              {step2Data.phone}
            </p>
          )}
        </div>
        <div style={{ height: "1px", background: T.border }} />
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "6px",
              background: step2Data.primary_color,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "12px", color: T.textMid }}>
            {step2Data.primary_color}
          </span>
        </div>
      </div>

      {/* Badge seguridad */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${T.border}`,
          borderRadius: "10px",
          padding: "14px 16px",
        }}
      >
        <ShieldCheck
          size={16}
          strokeWidth={1.75}
          style={{ color: T.roseDim, flexShrink: 0, marginTop: 1 }}
        />
        <div>
          <p
            style={{
              fontSize: "12px",
              fontWeight: 400,
              color: T.textMid,
              margin: "0 0 3px",
            }}
          >
            Datos protegidos
          </p>
          <p style={{ fontSize: "11px", color: T.textDim, lineHeight: 1.6 }}>
            Tu contraseña se cifra con bcrypt. Nunca la almacenamos en texto
            plano.
          </p>
        </div>
      </div>

      {/* Badge trial */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          background: T.roseGhost,
          border: `1px solid ${T.roseBorder}`,
          borderRadius: "10px",
          padding: "14px 16px",
        }}
      >
        <Sparkles
          size={16}
          strokeWidth={1.75}
          style={{ color: T.roseDim, flexShrink: 0, marginTop: 1 }}
        />
        <div>
          <p
            style={{
              fontSize: "12px",
              fontWeight: 400,
              color: T.roseDim,
              margin: "0 0 3px",
            }}
          >
            14 días de prueba gratuita
          </p>
          <p
            style={{
              fontSize: "11px",
              color: T.textDim,
              lineHeight: 1.6,
            }}
          >
            Sin tarjeta de crédito. Cancela cuando quieras.
          </p>
        </div>
      </div>

      <ErrorBanner msg={error} />

      <div style={{ display: "flex", gap: "10px" }}>
        <BtnGhost onClick={onBack} disabled={loading}>
          <ArrowLeft size={14} strokeWidth={1.75} /> Atrás
        </BtnGhost>
        <div style={{ flex: 2 }}>
          <BtnPrimary type="button" onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Creando tu salón…
              </>
            ) : (
              <>
                <Sparkles size={14} strokeWidth={1.75} /> Comenzar ahora
              </>
            )}
          </BtnPrimary>
        </div>
      </div>
    </div>
  );
}

// ─── PASO 4 — OTP ─────────────────────────────────────────────────────────────
const OTP_LENGTH = 6;

function Step4({ email, step2Data }: { email: string; step2Data: Step2Data }) {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown reenvío — intacto
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // ── Handlers OTP — lógica intacta ─────────────────────────────────────────
  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError(null);
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    if (digit && index === OTP_LENGTH - 1) {
      const fullOtp = [...newOtp.slice(0, OTP_LENGTH - 1), digit].join("");
      if (fullOtp.length === OTP_LENGTH) handleVerify(fullOtp);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowLeft" && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1)
      inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newOtp = [...Array(OTP_LENGTH).fill("")];
    pasted.split("").forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    const lastIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[lastIndex]?.focus();
    if (pasted.length === OTP_LENGTH) handleVerify(pasted);
  };

  // ── handleVerify — lógica intacta ─────────────────────────────────────────
  const handleVerify = async (code?: string) => {
    const otpCode = code ?? otp.join("");
    if (otpCode.length < OTP_LENGTH) {
      setError(`Ingresa los ${OTP_LENGTH} dígitos del código`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: verifyData, error: verifyError } =
        await supabase.auth.verifyOtp({
          email,
          token: otpCode,
          type: "signup",
        });

      if (verifyError || !verifyData.user) {
        setError(
          "Código incorrecto o expirado. Revisa tu correo e intenta de nuevo.",
        );
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        return;
      }

      // Protección contra reintentos — intacta
      const { data: existingSalon } = await supabase
        .from("salons")
        .select("id")
        .eq("owner_id", verifyData.user.id)
        .maybeSingle();
      if (existingSalon) {
        router.push("/dashboard?welcome=true");
        return;
      }

      // Crear salón — intacto
      const slug = sanitizeText(step2Data.salon_name)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 50);

      const { error: salonError } = await supabase.from("salons").insert({
        owner_id: verifyData.user.id,
        name: sanitizeText(step2Data.salon_name),
        slug: `${slug}-${Date.now().toString(36)}`,
        address: sanitizeText(step2Data.address),
        phone: step2Data.phone ? `+503 ${step2Data.phone}` : null,
        primary_color: step2Data.primary_color,
        timezone: "America/El_Salvador",
      });

      if (salonError) {
        setError(
          "Tu cuenta fue verificada pero ocurrió un error al crear el salón. Contáctanos.",
        );
        return;
      }

      const { data: newSalon } = await supabase
        .from("salons")
        .select("id")
        .eq("owner_id", verifyData.user.id)
        .single();

      // Trial 14 días — intacto
      try {
        await fetch("/api/onboarding/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ salonId: newSalon?.id }),
        });
      } catch {
        console.error("[Onboarding] No se pudo crear el trial");
      }

      router.push("/dashboard?welcome=true");
    } catch {
      setError("Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // ── handleResend — intacto ────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      const supabase = createClient();
      await supabase.auth.resend({ type: "signup", email });
      setResendCooldown(60);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch {
      setError("No se pudo reenviar el código. Intenta en unos segundos.");
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = email.replace(/(.{2}).+(@.+)/, "$1•••$2");
  const isComplete = otp.every((d) => d !== "");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "12px",
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: T.roseGhost,
            border: `1px solid ${T.roseBorder}`,
          }}
        >
          <Mail size={26} strokeWidth={1.5} style={{ color: T.rose }} />
        </motion.div>
        <div>
          <h2
            style={{
              fontFamily:
                "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "1.8rem",
              fontWeight: 300,
              color: T.textPrimary,
              letterSpacing: "-0.025em",
              margin: "0 0 6px",
            }}
          >
            Revisa tu correo
          </h2>
          <p style={{ fontSize: "13px", color: T.textDim, lineHeight: 1.65 }}>
            Enviamos un código de {OTP_LENGTH} dígitos a{" "}
            <span style={{ color: T.textMid }}>{maskedEmail}</span>
          </p>
        </div>
      </div>

      {/* Inputs OTP */}
      <div
        style={{ display: "flex", gap: "8px", justifyContent: "center" }}
        onPaste={handlePaste}
      >
        {Array.from({ length: OTP_LENGTH }).map((_, i) => (
          <motion.input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={otp[i]}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={loading}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            style={{
              width: "46px",
              height: "56px",
              textAlign: "center",
              fontSize: "20px",
              fontWeight: 500,
              borderRadius: "10px",
              border: `1.5px solid ${error ? "rgba(255,80,80,0.5)" : otp[i] ? T.roseBorder : T.border}`,
              outline: "none",
              transition: "all 0.2s",
              background: otp[i] ? T.roseGhost : "rgba(255,255,255,0.04)",
              color: T.textPrimary,
              boxShadow:
                otp[i] && !error ? `0 0 0 3px rgba(255,45,85,0.12)` : "none",
              opacity: loading ? 0.5 : 1,
              fontFamily: "inherit",
              cursor: loading ? "not-allowed" : "text",
            }}
          />
        ))}
      </div>

      <ErrorBanner msg={error} />

      {/* Botón verificar */}
      <BtnPrimary
        type="button"
        onClick={() => handleVerify()}
        disabled={!isComplete || loading}
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Verificando…
          </>
        ) : (
          <>
            <CheckCircle size={14} strokeWidth={1.75} /> Verificar código
          </>
        )}
      </BtnPrimary>

      {/* Reenviar */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "12px", color: T.textDim }}>
          ¿No llegó el código?{" "}
          {resendCooldown > 0 ? (
            <span style={{ color: T.textDim }}>
              Reenviar en{" "}
              <span style={{ color: T.textMid, fontWeight: 500 }}>
                {resendCooldown}s
              </span>
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              style={{
                color: T.rose,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                opacity: resending ? 0.5 : 1,
                fontFamily: "inherit",
              }}
            >
              {resending ? (
                <>
                  <Loader2 size={11} className="animate-spin" /> Enviando…
                </>
              ) : (
                <>
                  <RefreshCw size={11} strokeWidth={1.75} /> Reenviar
                </>
              )}
            </button>
          )}
        </p>
        <p
          style={{
            fontSize: "11px",
            color: T.textDim,
            marginTop: "4px",
            letterSpacing: "0.03em",
          }}
        >
          Revisa también tu carpeta de spam
        </p>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL — intacto ───────────────────────────────────────────
export default function RegisterStepper() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string>("");

  const goNext = () => {
    setDirection(1);
    setStep((s) => s + 1);
  };
  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const showStepper = step < 3;

  return (
    <div style={{ width: "100%", maxWidth: "420px", margin: "0 auto" }}>
      {showStepper && <StepIndicator current={step} total={3} />}

      <div style={{ position: "relative", overflow: "hidden" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
          >
            {step === 0 && (
              <Step1
                onNext={(d) => {
                  setStep1Data(d);
                  goNext();
                }}
              />
            )}
            {step === 1 && (
              <Step2
                onNext={(d) => {
                  setStep2Data(d);
                  goNext();
                }}
                onBack={goBack}
              />
            )}
            {step === 2 && step1Data && step2Data && (
              <Step3
                step1Data={step1Data}
                step2Data={step2Data}
                onBack={goBack}
                onOtpSent={(userId) => {
                  void userId;
                  setPendingEmail(step1Data.email);
                  goNext();
                }}
              />
            )}
            {step === 3 && step2Data && pendingEmail && (
              <Step4 email={pendingEmail} step2Data={step2Data} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
