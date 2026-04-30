"use client";

import { useState, useRef, useCallback, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldAlert,
  Clock,
} from "lucide-react";
import Link from "next/link";

// ─── CONSTANTES DE SEGURIDAD ──────────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;

// ─── SANITIZACIÓN ─────────────────────────────────────────────────────────────
function sanitizeEmail(value: string): string {
  return value.toLowerCase().trim().replace(/\s/g, "");
}

// ─── SCHEMA ───────────────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El email es requerido")
    .max(254, "Email demasiado largo")
    .regex(EMAIL_REGEX, "Email inválido")
    .transform(sanitizeEmail),
  password: z
    .string()
    .min(1, "Ingresa tu contraseña")
    .max(72, "Contraseña demasiado larga"),
});

type LoginForm = z.infer<typeof loginSchema>;

// ─── HOOK RATE LIMITING / LOCKOUT ─────────────────────────────────────────────
function useBruteForceProtection() {
  const attempts = useRef<number[]>([]);
  const lockedUntil = useRef<number>(0);

  const checkAttempt = useCallback((): {
    allowed: boolean;
    lockedSeconds: number;
    attemptsLeft: number;
  } => {
    const now = Date.now();

    if (lockedUntil.current > now) {
      return {
        allowed: false,
        lockedSeconds: Math.ceil((lockedUntil.current - now) / 1000),
        attemptsLeft: 0,
      };
    }

    attempts.current = attempts.current.filter(
      (t) => now - t < ATTEMPT_WINDOW_MS,
    );

    if (attempts.current.length >= MAX_LOGIN_ATTEMPTS) {
      lockedUntil.current = now + LOCKOUT_DURATION_MS;
      attempts.current = [];
      return {
        allowed: false,
        lockedSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
        attemptsLeft: 0,
      };
    }

    attempts.current.push(now);
    return {
      allowed: true,
      lockedSeconds: 0,
      attemptsLeft: MAX_LOGIN_ATTEMPTS - attempts.current.length,
    };
  }, []);

  const resetAttempts = useCallback(() => {
    attempts.current = [];
    lockedUntil.current = 0;
  }, []);

  return { checkAttempt, resetAttempts };
}

// ─── TIMEOUT BANNER — Fase 7.5 ────────────────────────────────────────────────
// Separado porque useSearchParams() requiere Suspense en Next.js 16
function TimeoutBanner() {
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("timeout") === "true";

  if (!sessionExpired) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="la-timeout-banner"
    >
      <Clock size={15} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>
        Tu sesión se cerró por inactividad. Inicia sesión de nuevo para
        continuar.
      </span>
    </motion.div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [attemptWarning, setAttemptWarning] = useState<string | null>(null);
  const { checkAttempt, resetAttempts } = useBruteForceProtection();

  const startCountdown = useCallback((seconds: number) => {
    setLockoutSeconds(seconds);
    const interval = setInterval(() => {
      setLockoutSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setAuthError(null);
          setAttemptWarning(null);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: LoginForm) => {
    const { allowed, lockedSeconds, attemptsLeft } = checkAttempt();

    if (!allowed) {
      setAuthError(
        `Demasiados intentos fallidos. Espera ${Math.ceil(lockedSeconds / 60)} min ${lockedSeconds % 60} seg antes de intentar de nuevo.`,
      );
      startCountdown(lockedSeconds);
      return;
    }

    if (attemptsLeft <= 2 && attemptsLeft > 0) {
      setAttemptWarning(
        `Atención: te quedan ${attemptsLeft} intento${attemptsLeft !== 1 ? "s" : ""} antes del bloqueo temporal.`,
      );
    } else {
      setAttemptWarning(null);
    }

    setAuthError(null);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        // CRÍTICO: mensaje genérico — previene User Enumeration Attack
        setAuthError(
          "Credenciales incorrectas. Verifica tu email y contraseña.",
        );
        return;
      }

      resetAttempts();
      router.push("/dashboard");
      router.refresh();
    } catch {
      setAuthError(
        "No se pudo conectar. Verifica tu conexión e intenta de nuevo.",
      );
    }
  };

  const isLocked = lockoutSeconds > 0;

  return (
    <>
      <style>{`

        /* ── TOKENS Dark Atelier ─────────────────────────────────── */
        .la-root {
          --bg:           #080706;
          --surface:      #0E0C0B;
          --surface2:     #131110;
          --rose:         #FF2D55;
          --rose-dim:     rgba(255,45,85,0.55);
          --rose-ghost:   rgba(255,45,85,0.08);
          --rose-border:  rgba(255,45,85,0.22);
          --border:       rgba(255,255,255,0.055);
          --border-mid:   rgba(255,255,255,0.09);
          --text-primary: rgba(245,242,238,0.9);
          --text-mid:     rgba(245,242,238,0.45);
          --text-dim:     rgba(245,242,238,0.18);
          --serif:        var(--font-cormorant, 'Cormorant Garamond', Georgia, serif);
          --sans:         var(--font-jakarta, 'Plus Jakarta Sans', system-ui, sans-serif);
        }

        /* ── ROOT ────────────────────────────────────────────────── */
        .la-root {
          min-height: 100vh;
          display: flex;
          background: var(--bg);
          font-family: var(--sans);
          position: relative;
          overflow: hidden;
        }
        .la-root::before {
          content: '';
          position: fixed;
          width: 650px; height: 650px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,45,85,0.07) 0%, transparent 65%);
          top: -220px; right: -180px;
          pointer-events: none; z-index: 0;
        }
        .la-root::after {
          content: '';
          position: fixed;
          width: 450px; height: 450px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,45,85,0.04) 0%, transparent 65%);
          bottom: -160px; left: -80px;
          pointer-events: none; z-index: 0;
        }

        /* ── PANEL IZQUIERDO ─────────────────────────────────────── */
        .la-left {
          display: none;
          width: 400px; flex-shrink: 0;
          flex-direction: column; justify-content: space-between;
          padding: 3.5rem 3rem;
          position: relative; z-index: 1;
          border-right: 1px solid var(--border);
        }
        @media (min-width: 1024px) { .la-left { display: flex; } }

        /* Grid sutil */
        .la-left::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 56px 56px;
          pointer-events: none;
        }

        .la-left-top { position: relative; z-index: 1; }
        .la-logo-row {
          display: flex; align-items: center; gap: 10px; margin-bottom: 6px;
        }
        .la-logo-box {
          width: 30px; height: 30px;
          border: 1px solid var(--rose-border); border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .la-logo-box span {
          font-size: 9px; font-weight: 500;
          color: var(--rose); letter-spacing: -0.03em;
        }
        .la-logo-name {
          font-size: 13px; color: rgba(245,242,238,0.55);
          letter-spacing: 0.08em; font-weight: 400; text-transform: uppercase;
        }
        .la-tagline {
          font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--text-dim); margin-left: 40px;
        }

        .la-left-mid { position: relative; z-index: 1; }

        .la-eyebrow-row {
          display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
        }
        .la-eyebrow-line {
          width: 18px; height: 1px; background: var(--rose-dim); display: inline-block;
        }
        .la-eyebrow-text {
          font-size: 10px; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--rose-dim);
        }

        .la-welcome {
          font-family: var(--serif);
          font-size: 3.2rem; font-weight: 300;
          line-height: 1.06; letter-spacing: -0.03em;
          color: var(--text-primary);
          margin: 0 0 12px;
        }
        .la-welcome em {
          font-style: normal; display: block; color: var(--rose);
        }
        .la-desc {
          font-size: 13px; color: var(--text-mid);
          line-height: 1.75; margin: 0 0 36px; font-weight: 300;
        }

        /* Stats grid */
        .la-stats {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
        }
        .la-stat {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px; padding: 18px 16px;
          transition: border-color 0.2s; position: relative; overflow: hidden;
        }
        .la-stat::after {
          content: '';
          position: absolute; bottom: 0; left: 0;
          width: 0; height: 1px;
          background: var(--rose-border);
          transition: width 0.35s ease;
        }
        .la-stat:hover::after { width: 100%; }
        .la-stat:hover { border-color: rgba(255,255,255,0.09); }
        .la-stat-val {
          font-family: var(--serif);
          font-size: 2.2rem; font-weight: 300;
          color: var(--text-primary); line-height: 1;
          letter-spacing: -0.03em; margin-bottom: 6px;
        }
        .la-stat-val.rose { color: var(--rose); }
        .la-stat-label {
          font-size: 9px; font-weight: 400;
          color: var(--text-dim); text-transform: uppercase;
          letter-spacing: 0.1em; line-height: 1.4;
        }

        .la-left-bottom { position: relative; z-index: 1; }
        .la-secure {
          display: flex; align-items: center; gap: 8px;
          font-size: 10px; color: var(--text-dim); letter-spacing: 0.06em;
        }
        .la-secure-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #22c55e; flex-shrink: 0;
        }

        /* ── PANEL DERECHO ───────────────────────────────────────── */
        .la-right {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 3rem 2rem; position: relative; z-index: 1;
        }
        .la-right-inner { width: 100%; max-width: 420px; }

        /* Mobile logo */
        .la-mobile-logo {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; margin-bottom: 2rem;
        }
        @media (min-width: 1024px) { .la-mobile-logo { display: none; } }

        /* Header */
        .la-header { margin-bottom: 28px; }
        .la-header-eyebrow {
          display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
        }
        .la-header-eyebrow span:first-child {
          display: inline-block; width: 16px; height: 1px; background: var(--rose-dim);
        }
        .la-header-eyebrow span:last-child {
          font-size: 10px; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--rose-dim);
        }
        .la-header-h1 {
          font-family: var(--serif);
          font-size: 2.4rem; font-weight: 300;
          color: var(--text-primary); line-height: 1.1;
          letter-spacing: -0.025em; margin: 0 0 8px;
        }
        .la-header-h1 em { font-style: normal; color: var(--rose); }
        .la-header-sub {
          font-size: 13px; color: var(--text-dim); letter-spacing: 0.02em; margin: 0;
        }

        /* ── FORM CARD ───────────────────────────────────────────── */
        .la-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2rem;
          position: relative; overflow: hidden;
        }
        /* Acento esquina superior derecha */
        .la-card::before {
          content: '';
          position: absolute; top: 0; right: 0;
          width: 16px; height: 16px;
          border-top: 1px solid var(--rose-border);
          border-right: 1px solid var(--rose-border);
          border-top-right-radius: 16px;
          pointer-events: none;
        }
        /* Radial interior sutil */
        .la-card::after {
          content: '';
          position: absolute; top: -40px; right: -40px;
          width: 180px; height: 180px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,45,85,0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        /* ── CAMPOS ──────────────────────────────────────────────── */
        .la-field {
          display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px;
        }
        .la-label-row {
          display: flex; align-items: center; justify-content: space-between;
        }
        .la-label {
          font-size: 10px; font-weight: 400;
          color: var(--text-mid); letter-spacing: 0.1em; text-transform: uppercase;
        }
        .la-forgot {
          font-size: 10px; color: var(--rose-dim);
          text-decoration: none; letter-spacing: 0.06em;
          transition: color 0.2s;
        }
        .la-forgot:hover { color: var(--rose); }

        .la-input-wrap { position: relative; }
        .la-input {
          width: 100%; padding: 12px 14px;
          background: var(--surface2);
          border: 1px solid var(--border-mid);
          border-radius: 8px;
          font-size: 14px; color: var(--text-primary);
          outline: none; font-family: var(--sans);
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .la-input::placeholder { color: var(--text-dim); }
        .la-input:focus {
          border-color: var(--rose-border);
          background: rgba(255,45,85,0.04);
          box-shadow: 0 0 0 3px rgba(255,45,85,0.08);
        }
        .la-input.pw { padding-right: 42px; }
        .la-input.err { border-color: rgba(255,80,80,0.45); }
        .la-input:disabled { opacity: 0.35; cursor: not-allowed; }

        .la-toggle {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: var(--text-dim); padding: 0;
          display: flex; align-items: center;
          transition: color 0.2s;
        }
        .la-toggle:hover { color: var(--rose-dim); }
        .la-toggle:disabled { cursor: not-allowed; }

        .la-err-msg {
          font-size: 11px; color: rgba(255,110,110,0.85); margin-top: 2px;
        }

        /* ── BANNERS ─────────────────────────────────────────────── */
        .la-timeout-banner {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 8px; padding: 12px 14px;
          font-size: 12px; color: rgba(245,242,238,0.45);
          margin-bottom: 18px;
          display: flex; align-items: flex-start; gap: 8px; line-height: 1.55;
        }
        .la-err-banner {
          background: var(--rose-ghost);
          border: 1px solid var(--rose-border);
          border-radius: 8px; padding: 12px 14px;
          font-size: 12px; color: rgba(255,120,120,0.9);
          margin-bottom: 18px; line-height: 1.55;
        }
        .la-warn-banner {
          background: rgba(234,179,8,0.07);
          border: 1px solid rgba(234,179,8,0.18);
          border-radius: 8px; padding: 10px 14px;
          font-size: 12px; color: rgba(251,191,36,0.8);
          margin-bottom: 18px;
          display: flex; align-items: center; gap: 8px; line-height: 1.5;
        }
        .la-lockout-banner {
          background: rgba(239,68,68,0.07);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 8px; padding: 14px;
          font-size: 12px; color: rgba(252,165,165,0.85);
          margin-bottom: 18px;
          display: flex; align-items: flex-start; gap: 10px; line-height: 1.55;
        }
        .la-lockout-countdown {
          font-family: var(--serif);
          font-size: 1.8rem; font-weight: 300;
          color: rgba(252,165,165,0.9);
          display: block; margin-top: 4px; letter-spacing: -0.02em;
        }

        /* ── CTA ─────────────────────────────────────────────────── */
        .la-cta {
          width: 100%; margin-top: 6px;
          padding: 13px 20px;
          background: var(--rose-ghost);
          border: 1px solid var(--rose-border);
          border-radius: 8px;
          font-family: var(--sans);
          font-size: 12px; font-weight: 400;
          color: var(--rose-dim);
          letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s;
        }
        .la-cta:hover:not(:disabled) {
          background: rgba(255,45,85,0.16);
          border-color: rgba(255,45,85,0.42);
          color: var(--rose);
        }
        .la-cta:active:not(:disabled) { opacity: 0.85; }
        .la-cta:disabled {
          opacity: 0.35; cursor: not-allowed;
        }

        /* ── DIVIDER + REGISTRO ──────────────────────────────────── */
        .la-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 22px 0 16px;
          font-size: 11px; color: var(--text-dim); letter-spacing: 0.04em;
        }
        .la-divider-line {
          flex: 1; height: 1px; background: var(--border);
        }
        .la-register-block {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 8px; padding: 14px 16px;
          text-align: center;
          font-size: 12px; color: var(--text-dim); letter-spacing: 0.03em;
        }
        .la-register-block a {
          color: var(--rose-dim); font-weight: 400;
          text-decoration: none; transition: color 0.2s;
        }
        .la-register-block a:hover { color: var(--rose); }

      `}</style>

      <div className="la-root">
        {/* ── Panel izquierdo ─────────────────────────────────────── */}
        <aside className="la-left">
          <div className="la-left-top">
            <div className="la-logo-row">
              <div className="la-logo-box">
                <span>BS</span>
              </div>
              <span className="la-logo-name">BeautySync</span>
            </div>
            <p className="la-tagline">El salón que trabaja solo</p>
          </div>

          <div className="la-left-mid">
            <div className="la-eyebrow-row">
              <span className="la-eyebrow-line" />
              <span className="la-eyebrow-text">Tu dashboard te espera</span>
            </div>

            <h2 className="la-welcome">
              Bienvenida<em>de vuelta.</em>
            </h2>
            <p className="la-desc">
              Todas tus citas, métricas y clientas,
              <br />
              exactamente donde las dejaste.
            </p>

            <div className="la-stats">
              {[
                { val: "24/7", label: "Agenda activa", rose: false },
                { val: "14", label: "Días de prueba", rose: true },
                { val: "0", label: "Config. técnica", rose: false },
                { val: "∞", label: "Citas disponibles", rose: true },
              ].map((s) => (
                <div key={s.label} className="la-stat">
                  <p className={`la-stat-val${s.rose ? " rose" : ""}`}>
                    {s.val}
                  </p>
                  <p className="la-stat-label">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="la-left-bottom">
            <div className="la-secure">
              <span className="la-secure-dot" />
              Conexión segura y encriptada
            </div>
          </div>
        </aside>

        {/* ── Panel derecho ────────────────────────────────────────── */}
        <main className="la-right">
          <div className="la-right-inner">
            {/* Mobile logo */}
            <div className="la-mobile-logo">
              <div className="la-logo-box">
                <span>BS</span>
              </div>
              <span className="la-logo-name">BeautySync</span>
            </div>

            {/* Header */}
            <div className="la-header">
              <div className="la-header-eyebrow">
                <span />
                <span>Acceso seguro</span>
              </div>
              <h1 className="la-header-h1">
                Inicia
                <br />
                <em>sesión.</em>
              </h1>
              <p className="la-header-sub">
                Entra a tu dashboard de BeautySync
              </p>
            </div>

            {/* Form card */}
            <motion.div
              className="la-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                autoComplete="on"
              >
                {/* Banner timeout — Fase 7.5 */}
                <Suspense fallback={null}>
                  <TimeoutBanner />
                </Suspense>

                {/* Banner lockout */}
                {isLocked && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="la-lockout-banner"
                  >
                    <ShieldAlert
                      size={18}
                      style={{ flexShrink: 0, marginTop: 1 }}
                    />
                    <div>
                      <p>
                        Cuenta bloqueada temporalmente por múltiples intentos
                        fallidos.
                      </p>
                      <span className="la-lockout-countdown">
                        {Math.floor(lockoutSeconds / 60)}:
                        {String(lockoutSeconds % 60).padStart(2, "0")}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Advertencia de intentos */}
                {attemptWarning && !isLocked && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="la-warn-banner"
                  >
                    <span>⚠</span> {attemptWarning}
                  </motion.div>
                )}

                {/* Email */}
                <div className="la-field">
                  <div className="la-label-row">
                    <label className="la-label">Email</label>
                  </div>
                  <input
                    type="email"
                    placeholder="maria@misalon.com"
                    maxLength={254}
                    autoComplete="email"
                    className={`la-input${errors.email ? " err" : ""}`}
                    disabled={isLocked}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="la-err-msg">{errors.email.message}</p>
                  )}
                </div>

                {/* Contraseña */}
                <div className="la-field">
                  <div className="la-label-row">
                    <label className="la-label">Contraseña</label>
                    <Link href="/forgot-password" className="la-forgot">
                      ¿La olvidaste?
                    </Link>
                  </div>
                  <div className="la-input-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Tu contraseña"
                      maxLength={72}
                      autoComplete="current-password"
                      className={`la-input pw${errors.password ? " err" : ""}`}
                      disabled={isLocked}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      className="la-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      disabled={isLocked}
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="la-err-msg">{errors.password.message}</p>
                  )}
                </div>

                {/* Error de auth — genérico, sin detallar (previene user enumeration) */}
                {authError && !isLocked && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="la-err-banner"
                  >
                    {authError}
                  </motion.div>
                )}

                {/* CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting || isLocked}
                  className="la-cta"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />{" "}
                      Verificando…
                    </>
                  ) : isLocked ? (
                    <>
                      <ShieldAlert size={14} /> Bloqueado temporalmente
                    </>
                  ) : (
                    <>
                      Entrar al dashboard <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>

              <div className="la-divider">
                <div className="la-divider-line" />
                <span>¿Primera vez en BeautySync?</span>
                <div className="la-divider-line" />
              </div>

              <div className="la-register-block">
                Crea tu cuenta gratis —{" "}
                <Link href="/register">Registrarse</Link>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </>
  );
}
