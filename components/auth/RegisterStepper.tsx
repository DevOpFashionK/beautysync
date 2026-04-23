"use client";

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

// ─── SANITIZACIÓN ─────────────────────────────────────────────────────────────
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

// ─── SCHEMAS ZOD ──────────────────────────────────────────────────────────────
const STRONG_PASSWORD =
  /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,72}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,8}$/;
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

// ─── RATE LIMITING ────────────────────────────────────────────────────────────
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

// ─── PASSWORD STRENGTH ────────────────────────────────────────────────────────
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

// ─── ANIMACIONES ──────────────────────────────────────────────────────────────
const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
};
const transition = { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const };

// ─── INPUT FIELD ──────────────────────────────────────────────────────────────
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
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-neutral-600">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={autoComplete}
        spellCheck={false}
        className={`input-base ${error ? "border-red-400" : ""}`}
        {...registration}
      />
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

// ─── STEP INDICATOR ──────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-3 justify-center mb-10">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <motion.div
            animate={{
              backgroundColor:
                i <= current ? "#FF2D55" : "rgba(255,255,255,0.1)",
              scale: i === current ? 1.1 : 1,
            }}
            transition={{ duration: 0.3 }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
            style={{
              color: i <= current ? "#fff" : "rgba(255,255,255,0.3)",
              boxShadow:
                i === current ? "0 0 12px rgba(255,45,85,0.5)" : "none",
            }}
          >
            {i < current ? <CheckCircle size={16} /> : i + 1}
          </motion.div>
          {i < total - 1 && (
            <motion.div
              animate={{
                backgroundColor:
                  i < current ? "#FF2D55" : "rgba(255,255,255,0.1)",
              }}
              transition={{ duration: 0.4 }}
              className="h-0.5 w-12 rounded-full"
            />
          )}
        </div>
      ))}
    </div>
  );
}

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
      className="flex flex-col gap-5"
      noValidate
    >
      <div>
        <h2 className="font-display text-3xl text-neutral-800 mb-1">
          Tu cuenta
        </h2>
        <p className="text-sm text-neutral-400">
          Comencemos con tus datos personales
        </p>
      </div>

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

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-600">
          Contraseña
        </label>
        <input
          type="password"
          placeholder="Mínimo 8 caracteres"
          maxLength={72}
          autoComplete="new-password"
          className={`input-base ${errors.password ? "border-red-400" : ""}`}
          {...register("password")}
        />
        {password.length > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex gap-1 flex-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor:
                      i <= strength.score
                        ? strength.color
                        : "rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </div>
            {strength.label && (
              <span
                className="text-xs font-medium"
                style={{ color: strength.color }}
              >
                {strength.label}
              </span>
            )}
          </div>
        )}
        {errors.password && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-500"
          >
            {errors.password.message}
          </motion.p>
        )}
        <p className="text-xs text-neutral-400 mt-0.5">
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

      <motion.button
        type="submit"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="btn-primary flex items-center justify-center gap-2 mt-2"
      >
        Continuar <ArrowRight size={16} />
      </motion.button>
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
    defaultValues: { primary_color: "#D4375F" },
    mode: "onBlur",
  });
  const primaryColor = watch("primary_color");

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      className="flex flex-col gap-5"
      noValidate
    >
      <div>
        <h2 className="font-display text-3xl text-neutral-800 mb-1">
          Tu salón
        </h2>
        <p className="text-sm text-neutral-400">Cuéntanos sobre tu espacio</p>
      </div>

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
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-600">
          Teléfono (opcional)
        </label>
        <div
          className="flex items-center rounded-xl overflow-hidden transition-all duration-150"
          style={{ border: "1.5px solid rgba(255,255,255,0.12)" }}
          onFocusCapture={(e) => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.borderColor = "rgba(112,0,255,0.6)";
            el.style.boxShadow = "0 0 0 3px rgba(112,0,255,0.1)";
          }}
          onBlurCapture={(e) => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.borderColor = "rgba(255,255,255,0.12)";
            el.style.boxShadow = "none";
          }}
        >
          {/* Prefijo fijo */}
          <div
            className="flex items-center gap-1.5 px-3 py-2.5 shrink-0"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderRight: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span className="text-sm">🇸🇻</span>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--muted-lavender)" }}
            >
              +503
            </span>
          </div>

          {/* Input solo 8 dígitos */}
          <input
            {...register("phone")}
            type="tel"
            inputMode="numeric"
            maxLength={8}
            placeholder="7000 0000"
            autoComplete="tel-national"
            className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent"
            style={{ color: "#fff" }}
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
        {errors.phone && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-500"
          >
            {errors.phone.message}
          </motion.p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-600">
          Color de marca
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            className="w-12 h-12 rounded-xl border border-neutral-200 cursor-pointer p-1"
            {...register("primary_color")}
          />
          <div
            className="flex-1 h-12 rounded-xl flex items-center justify-center text-white text-sm font-medium transition-all"
            style={{
              backgroundColor: HEX_COLOR_REGEX.test(primaryColor)
                ? primaryColor
                : "#D4375F",
            }}
          >
            {primaryColor}
          </div>
        </div>
        {errors.primary_color && (
          <p className="text-xs text-red-500">{errors.primary_color.message}</p>
        )}
      </div>

      <div className="flex gap-3 mt-2">
        <motion.button
          type="button"
          onClick={onBack}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-neutral-200 text-neutral-600 font-medium hover:bg-neutral-50 transition-colors"
        >
          <ArrowLeft size={16} /> Atrás
        </motion.button>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="flex-[2] btn-primary flex items-center justify-center gap-2"
        >
          Continuar <ArrowRight size={16} />
        </motion.button>
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
        options: {
          data: { full_name: sanitizeText(step1Data.full_name) },
        },
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

      // ✅ signUp exitoso — Supabase envió el OTP al correo
      // NO creamos el salón aquí — lo hacemos DESPUÉS de verificar el OTP
      onOtpSent(authData.user.id);
    } catch {
      setError("Ocurrió un error inesperado. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-3xl text-neutral-800 mb-1">
          ¡Todo listo!
        </h2>
        <p className="text-sm text-neutral-400">
          Confirma tu información antes de comenzar
        </p>
      </div>

      {/* Resumen */}
      <div className="bg-neutral-50 rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            Tu perfil
          </p>
          <p className="font-semibold text-neutral-800">
            {step1Data.full_name}
          </p>
          <p className="text-sm text-neutral-500">
            {step1Data.email.replace(/(.{2}).+(@.+)/, "$1•••$2")}
          </p>
        </div>
        <div className="h-px bg-neutral-200" />
        <div>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            Tu salón
          </p>
          <p className="font-semibold text-neutral-800">
            {step2Data.salon_name}
          </p>
          <p className="text-sm text-neutral-500">{step2Data.address}</p>
          {step2Data.phone && (
            <p className="text-sm text-neutral-500">{step2Data.phone}</p>
          )}
        </div>
        <div className="h-px bg-neutral-200" />
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg"
            style={{ backgroundColor: step2Data.primary_color }}
          />
          <span className="text-sm text-neutral-600">
            Color: {step2Data.primary_color}
          </span>
        </div>
      </div>

      {/* Badge seguridad */}
      <div className="flex items-start gap-3 bg-pink-50 rounded-2xl p-4 border border-pink-100">
        <ShieldCheck size={18} className="text-blush mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-neutral-700">
            Datos protegidos
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            Tu contraseña se cifra con bcrypt. Nunca la almacenamos en texto
            plano.
          </p>
        </div>
      </div>

      {/* Badge trial */}
      <div
        className="flex items-start gap-3 rounded-2xl p-4"
        style={{
          background: "rgba(0, 210, 120, 0.12)",
          border: "1px solid rgba(0, 210, 120, 0.25)",
        }}
      >
        <Sparkles
          size={18}
          className="mt-0.5 shrink-0"
          style={{ color: "#00D278" }}
        />
        <div>
          <p className="text-sm font-semibold text-white">
            14 días de prueba gratuita
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            Sin tarjeta de crédito. Cancela cuando quieras.
          </p>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600"
        >
          {error}
        </motion.div>
      )}

      <div className="flex gap-3">
        <motion.button
          type="button"
          onClick={onBack}
          disabled={loading}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-neutral-200 text-neutral-600 font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          <ArrowLeft size={16} /> Atrás
        </motion.button>
        <motion.button
          onClick={handleConfirm}
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: loading ? 1 : 0.99 }}
          className="flex-[2] btn-primary flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Creando tu salón…
            </>
          ) : (
            <>
              <Sparkles size={16} /> Comenzar ahora
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

// ─── PASO 4 — VERIFICACIÓN OTP ────────────────────────────────────────────────
const OTP_LENGTH = 6;

function Step4({ email, step2Data }: { email: string; step2Data: Step2Data }) {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown para reenvío
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Auto-focus primer input al montar
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Solo permitir dígitos
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError(null);

    // Auto-avanzar al siguiente input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit cuando están todos los dígitos
    if (digit && index === OTP_LENGTH - 1) {
      const fullOtp = [...newOtp.slice(0, OTP_LENGTH - 1), digit].join("");
      if (fullOtp.length === OTP_LENGTH) {
        handleVerify(fullOtp);
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Retroceder al anterior si el campo está vacío
      inputRefs.current[index - 1]?.focus();
    }
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
    // Focus al último dígito pegado
    const lastIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[lastIndex]?.focus();
    // Auto-submit si se pegaron todos los dígitos
    if (pasted.length === OTP_LENGTH) handleVerify(pasted);
  };

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

      // Verificar OTP con Supabase
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
        // Limpiar inputs para reintentar
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        return;
      }

      // ✅ OTP verificado — verificar si ya existe salón (protección contra reintentos)
      const { data: existingSalon } = await supabase
        .from("salons")
        .select("id")
        .eq("owner_id", verifyData.user.id)
        .maybeSingle();

      if (existingSalon) {
        router.push("/dashboard?welcome=true");
        return;
      }

      // ✅ OTP verificado — ahora sí creamos el salón con sesión activa
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

      // Obtener el id del salón recién creado
      const { data: newSalon } = await supabase
        .from("salons")
        .select("id")
        .eq("owner_id", verifyData.user.id)
        .single();

      // ✅ Activar trial de 14 días
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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-3">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: "rgba(255,45,85,0.12)",
            border: "1px solid rgba(255,45,85,0.2)",
          }}
        >
          <Mail size={28} style={{ color: "#FF2D55" }} />
        </motion.div>
        <div>
          <h2 className="font-display text-3xl text-neutral-800 mb-1">
            Revisa tu correo
          </h2>
          <p className="text-sm text-neutral-500 leading-relaxed">
            Enviamos un código de {OTP_LENGTH} dígitos a{" "}
            <span className="font-semibold text-neutral-700">
              {maskedEmail}
            </span>
          </p>
        </div>
      </div>

      {/* Inputs OTP */}
      <div className="flex gap-2 justify-center" onPaste={handlePaste}>
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
            className="w-12 h-14 text-center text-xl font-bold rounded-2xl border-2 outline-none transition-all duration-200 disabled:opacity-50"
            style={{
              background: otp[i]
                ? "rgba(255,45,85,0.08)"
                : "rgba(255,255,255,0.05)",
              borderColor: error
                ? "#EF4444"
                : otp[i]
                  ? "#FF2D55"
                  : "rgba(255,255,255,0.15)",
              color: "#ffffff",
              boxShadow:
                otp[i] && !error ? "0 0 0 3px rgba(255,45,85,0.15)" : "none",
            }}
          />
        ))}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 text-center"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón verificar */}
      <motion.button
        onClick={() => handleVerify()}
        disabled={!isComplete || loading}
        whileHover={{ scale: !isComplete || loading ? 1 : 1.01 }}
        whileTap={{ scale: !isComplete || loading ? 1 : 0.99 }}
        className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Verificando…
          </>
        ) : (
          <>
            <CheckCircle size={16} /> Verificar código
          </>
        )}
      </motion.button>

      {/* Reenviar código */}
      <div className="text-center">
        <p className="text-sm text-neutral-500">
          ¿No llegó el código?{" "}
          {resendCooldown > 0 ? (
            <span className="text-neutral-400">
              Reenviar en{" "}
              <span className="font-semibold text-neutral-600">
                {resendCooldown}s
              </span>
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="font-semibold inline-flex items-center gap-1 transition-colors disabled:opacity-50"
              style={{ color: "#FF2D55" }}
            >
              {resending ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Enviando…
                </>
              ) : (
                <>
                  <RefreshCw size={12} /> Reenviar
                </>
              )}
            </button>
          )}
        </p>
        <p className="text-xs text-neutral-400 mt-2">
          Revisa también tu carpeta de spam
        </p>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function RegisterStepper() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  // El email se guarda por separado para usarlo en el OTP sin exponer step1Data completo
  const [pendingEmail, setPendingEmail] = useState<string>("");

  const goNext = () => {
    setDirection(1);
    setStep((s) => s + 1);
  };
  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  // Total de pasos en el indicador: 3 (el OTP es paso especial, no cuenta en el stepper visual)
  const showStepper = step < 3;

  return (
    <div className="w-full max-w-md mx-auto">
      {showStepper && <StepIndicator current={step} total={3} />}

      <div className="relative overflow-hidden">
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
                  // userId disponible por si se necesita más adelante
                  void userId;
                  setPendingEmail(step1Data.email);
                  goNext(); // → Step4
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
