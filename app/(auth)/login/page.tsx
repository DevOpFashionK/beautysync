"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
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
import { useSearchParams } from "next/navigation";

// ─── CONSTANTES DE SEGURIDAD ──────────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5; // intentos antes de bloqueo temporal
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutos
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000; // ventana de 10 minutos

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
    .max(72, "Contraseña demasiado larga"), // bcrypt limit, evita DoS
});

type LoginForm = z.infer<typeof loginSchema>;

// ─── HOOK RATE LIMITING / LOCKOUT ────────────────────────────────────────────
// Protección contra fuerza bruta en el cliente
// (complementa la protección server-side de Supabase Auth)
function useBruteForceProtection() {
  const attempts = useRef<number[]>([]);
  const lockedUntil = useRef<number>(0);

  const checkAttempt = useCallback((): {
    allowed: boolean;
    lockedSeconds: number;
    attemptsLeft: number;
  } => {
    const now = Date.now();

    // ¿Está en período de bloqueo?
    if (lockedUntil.current > now) {
      return {
        allowed: false,
        lockedSeconds: Math.ceil((lockedUntil.current - now) / 1000),
        attemptsLeft: 0,
      };
    }

    // Limpiar intentos fuera de la ventana
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

export default function LoginPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [attemptWarning, setAttemptWarning] = useState<string | null>(null);
  const { checkAttempt, resetAttempts } = useBruteForceProtection();

  // ─── SESSION TIMEOUT PARAM ── Fase 7.5 ───────────────────────────────────
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("timeout") === "true";

  // Countdown del lockout
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
    // Verificar rate limit frontend
    const { allowed, lockedSeconds, attemptsLeft } = checkAttempt();

    if (!allowed) {
      setAuthError(
        `Demasiados intentos fallidos. Espera ${Math.ceil(lockedSeconds / 60)} min ${lockedSeconds % 60} seg antes de intentar de nuevo.`,
      );
      startCountdown(lockedSeconds);
      return;
    }

    // Advertencia de intentos restantes
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
        // CRÍTICO: Mensaje genérico — no revelar si el email existe o no
        // Evita "User Enumeration Attack"
        setAuthError(
          "Credenciales incorrectas. Verifica tu email y contraseña.",
        );
        return;
      }

      // Login exitoso — resetear contador
      resetAttempts();
      router.push("/dashboard");
      router.refresh();
    } catch {
      // Nunca exponer stack traces o detalles técnicos
      setAuthError(
        "No se pudo conectar. Verifica tu conexión e intenta de nuevo.",
      );
    }
  };

  const isLocked = lockoutSeconds > 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');

        :root {
          --midnight: #0F0A1E;
          --card-bg: rgba(26,20,45,0.85);
          --electric-rose: #FF2D55;
          --rose-deep: #D4003C;
          --violet-neon: #7000FF;
          --muted-lavender: #B3B0C2;
          --font-display: 'Cormorant Garamond', Georgia, serif;
          --font-body: 'Plus Jakarta Sans', -apple-system, sans-serif;
        }

        .login-root {
          min-height: 100vh; display: flex;
          background: var(--midnight); font-family: var(--font-body);
          position: relative; overflow: hidden;
        }
        .login-root::before {
          content: ''; position: fixed; width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(112,0,255,0.14) 0%, transparent 65%);
          top: -180px; left: -150px; pointer-events: none; z-index: 0;
        }
        .login-root::after {
          content: ''; position: fixed; width: 450px; height: 450px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,45,85,0.08) 0%, transparent 65%);
          bottom: -100px; right: -80px; pointer-events: none; z-index: 0;
        }

        /* Panel izquierdo */
        .ll-panel {
          display: none; width: 420px; flex-shrink: 0;
          flex-direction: column; justify-content: space-between;
          padding: 3.5rem 3rem; position: relative; z-index: 1;
          border-right: 1px solid rgba(255,255,255,0.05);
        }
        @media (min-width: 1024px) { .ll-panel { display: flex; } }
        .ll-panel::before {
          content: ''; position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 48px 48px; pointer-events: none;
        }
        .ll-top { position: relative; z-index: 1; }
        .ll-logo { display: flex; align-items: center; gap: 0.875rem; }
        .ll-gem {
          width: 40px; height: 40px; border-radius: 12px;
          background: linear-gradient(135deg, var(--electric-rose), var(--rose-deep));
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; color: #fff;
          box-shadow: 0 4px 20px rgba(255,45,85,0.4), 0 0 0 1px rgba(255,45,85,0.2);
        }
        .ll-name { font-family: var(--font-display); font-size: 1.75rem; font-weight: 500; color: #fff; letter-spacing: 0.03em; }
        .ll-tagline { font-size: 0.6875rem; font-weight: 400; color: var(--muted-lavender); opacity: 0.5; margin-top: 0.5rem; letter-spacing: 0.1em; text-transform: uppercase; }
        .ll-mid { position: relative; z-index: 1; }
        .ll-welcome { font-family: var(--font-display); font-size: 3.25rem; font-weight: 400; line-height: 1.05; color: rgba(255,255,255,0.92); margin: 0 0 1rem; }
        .ll-welcome em { font-style: italic; display: block; background: linear-gradient(135deg, var(--electric-rose), #ff8fab); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .ll-desc { font-size: 0.875rem; color: var(--muted-lavender); opacity: 0.6; line-height: 1.7; margin-bottom: 2.5rem; }
        .ll-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .ll-stat { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 1.125rem 1.25rem; transition: border-color 0.2s; }
        .ll-stat:hover { border-color: rgba(255,45,85,0.2); }
        .ll-stat-val { font-family: var(--font-display); font-size: 2rem; font-weight: 500; color: #fff; line-height: 1; }
        .ll-stat-val.rose { background: linear-gradient(135deg, var(--electric-rose), #ff8fab); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .ll-stat-label { font-size: 0.6875rem; font-weight: 500; color: var(--muted-lavender); opacity: 0.45; margin-top: 0.3rem; text-transform: uppercase; letter-spacing: 0.06em; }
        .ll-bottom { position: relative; z-index: 1; }
        .ll-secure { display: flex; align-items: center; gap: 0.625rem; font-size: 0.75rem; color: var(--muted-lavender); opacity: 0.3; }
        .ll-dot { width: 6px; height: 6px; border-radius: 50%; background: #22C55E; flex-shrink: 0; opacity: 1; }

        /* Panel derecho */
        .ll-right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 3rem 2rem; position: relative; z-index: 1; }
        .ll-right-inner { width: 100%; max-width: 420px; }
        .ll-mobile-logo { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-bottom: 2rem; }
        .ll-mobile-gem { width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(135deg, var(--electric-rose), var(--rose-deep)); display: flex; align-items: center; justify-content: center; font-size: 0.9rem; color: #fff; }
        .ll-mobile-name { font-family: var(--font-display); font-size: 1.5rem; font-weight: 500; color: #fff; }
        @media (min-width: 1024px) { .ll-mobile-logo { display: none; } }

        .ll-header { margin-bottom: 1.75rem; }
        .ll-eyebrow { font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--electric-rose); margin-bottom: 0.5rem; }
        .ll-title { font-size: 1.875rem; font-weight: 700; color: #fff; line-height: 1.1; font-family: var(--font-body); margin: 0 0 0.375rem; }
        .ll-sub { font-size: 0.875rem; color: var(--muted-lavender); opacity: 0.6; }

        /* Glass card */
        .ll-glass {
          background: var(--card-bg); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
          border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 2.5rem;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.03) inset, 0 32px 80px rgba(0,0,0,0.55), 0 8px 24px rgba(112,0,255,0.06);
          position: relative; overflow: hidden;
        }
        .ll-glass::before {
          content: ''; position: absolute; width: 180px; height: 180px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,45,85,0.07) 0%, transparent 70%);
          top: -50px; right: -30px; pointer-events: none;
        }

        /* Campos */
        .lf-field { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1.25rem; }
        .lf-label-row { display: flex; align-items: center; justify-content: space-between; }
        .lf-label { font-size: 0.8rem; font-weight: 500; color: var(--muted-lavender); opacity: 0.85; }
        .lf-forgot { font-size: 0.75rem; font-weight: 500; color: var(--electric-rose); text-decoration: none; opacity: 0.8; }
        .lf-forgot:hover { opacity: 1; text-decoration: underline; }
        .lf-input-wrap { position: relative; }
        .lf-input {
          width: 100%; padding: 0.875rem 1rem;
          background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 10px; font-size: 0.9375rem; color: #fff;
          outline: none; font-family: var(--font-body);
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .lf-input::placeholder { color: rgba(255,255,255,0.2); }
        .lf-input:focus { border-color: rgba(112,0,255,0.55); background: rgba(255,255,255,0.07); box-shadow: 0 0 0 3px rgba(112,0,255,0.1); }
        .lf-input.pw { padding-right: 3rem; }
        .lf-input.err { border-color: rgba(255,80,80,0.45); }
        .lf-input:disabled { opacity: 0.4; cursor: not-allowed; }
        .lf-toggle { position: absolute; right: 0.875rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.25); padding: 0; display: flex; align-items: center; transition: color 0.2s; }
        .lf-toggle:hover { color: var(--electric-rose); }
        .lf-err-msg { font-size: 0.75rem; color: #ff8080; margin-top: 0.25rem; }

        /* Banners de alerta */
        .lf-err-banner {
          background: rgba(255,45,85,0.08); border: 1px solid rgba(255,45,85,0.2);
          border-radius: 10px; padding: 0.875rem 1rem;
          font-size: 0.875rem; color: #ff8080; margin-bottom: 1.25rem;
        }
        .lf-warn-banner {
          background: rgba(234,179,8,0.08); border: 1px solid rgba(234,179,8,0.2);
          border-radius: 10px; padding: 0.75rem 1rem;
          font-size: 0.8125rem; color: #fbbf24; margin-bottom: 1.25rem;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .lf-lockout-banner {
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
          border-radius: 10px; padding: 1rem;
          font-size: 0.875rem; color: #fca5a5; margin-bottom: 1.25rem;
          display: flex; align-items: flex-start; gap: 0.75rem;
        }
        .lf-lockout-countdown {
          font-family: var(--font-display); font-size: 1.5rem; font-weight: 600;
          color: #fca5a5; text-align: center; display: block; margin-top: 0.25rem;
        }

        /* Timeout banner — Fase 7.5 */
        .lf-timeout-banner {
          background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 10px; padding: 0.875rem 1rem;
          font-size: 0.875rem; color: #93c5fd; margin-bottom: 1.25rem;
          display: flex; align-items: flex-start; gap: 0.625rem; line-height: 1.5;
        }

        /* CTA */
        .lf-cta {
          width: 100%; padding: 0.9375rem 1.5rem;
          background: linear-gradient(135deg, var(--electric-rose) 0%, var(--rose-deep) 100%);
          border: none; border-radius: 10px; font-family: var(--font-body);
          font-size: 0.9375rem; font-weight: 700; color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(255,45,85,0.35), 0 1px 0 rgba(255,255,255,0.12) inset;
          letter-spacing: 0.01em; margin-top: 0.5rem;
        }
        .lf-cta:hover:not(:disabled) { background: linear-gradient(135deg, #ff4d6d 0%, #e8003f 100%); box-shadow: 0 6px 28px rgba(255,45,85,0.5), 0 1px 0 rgba(255,255,255,0.12) inset; transform: translateY(-1px); }
        .lf-cta:active:not(:disabled) { transform: translateY(0); }
        .lf-cta:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        /* Divider y registro */
        .lf-divider { display: flex; align-items: center; gap: 0.875rem; margin: 1.75rem 0 1.25rem; font-size: 0.75rem; color: rgba(255,255,255,0.18); }
        .lf-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
        .lf-register { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 1rem 1.25rem; text-align: center; font-size: 0.875rem; color: var(--muted-lavender); opacity: 0.6; }
        .lf-register a { color: var(--electric-rose); font-weight: 600; text-decoration: none; opacity: 1; }
        .lf-register a:hover { text-decoration: underline; }
      `}</style>

      <div className="login-root">
        {/* Panel izquierdo */}
        <aside className="ll-panel">
          <div className="ll-top">
            <div className="ll-logo">
              <div className="ll-gem">✦</div>
              <span className="ll-name">BeautySync</span>
            </div>
            <p className="ll-tagline">El salón que trabaja solo</p>
          </div>
          <div className="ll-mid">
            <h1 className="ll-welcome">
              Bienvenida<em>de vuelta</em>
            </h1>
            <p className="ll-desc">
              Tu dashboard te está esperando.
              <br />
              Todas tus citas, en tiempo real.
            </p>
            <div className="ll-stats">
              {[
                { val: "24/7", label: "Agenda activa", rose: false },
                { val: "14", label: "Días de prueba", rose: true },
                { val: "0", label: "Config. técnica", rose: false },
                { val: "∞", label: "Citas disponibles", rose: true },
              ].map((s) => (
                <div key={s.label} className="ll-stat">
                  <p className={`ll-stat-val${s.rose ? " rose" : ""}`}>
                    {s.val}
                  </p>
                  <p className="ll-stat-label">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="ll-bottom">
            <div className="ll-secure">
              <div className="ll-dot" />
              Conexión segura y encriptada
            </div>
          </div>
        </aside>

        {/* Panel derecho */}
        <main className="ll-right">
          <div className="ll-right-inner">
            <div className="ll-mobile-logo">
              <div className="ll-mobile-gem">✦</div>
              <span className="ll-mobile-name">BeautySync</span>
            </div>

            <div className="ll-header">
              <p className="ll-eyebrow">Acceso seguro</p>
              <h2 className="ll-title">Inicia sesión</h2>
              <p className="ll-sub">Entra a tu dashboard de BeautySync</p>
            </div>

            <motion.div
              className="ll-glass"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                autoComplete="on"
              >
                {/* Banner de session timeout — Fase 7.5 */}
                {sessionExpired && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lf-timeout-banner"
                  >
                    <Clock size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>
                      Tu sesión se cerró por inactividad. Inicia sesión de nuevo
                      para continuar.
                    </span>
                  </motion.div>
                )}

                {/* Banner de lockout */}
                {isLocked && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="lf-lockout-banner"
                  >
                    <ShieldAlert size={20} className="shrink-0 mt-0.5" />
                    <div>
                      <p>
                        Cuenta bloqueada temporalmente por múltiples intentos
                        fallidos.
                      </p>
                      <span className="lf-lockout-countdown">
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
                    className="lf-warn-banner"
                  >
                    ⚠ {attemptWarning}
                  </motion.div>
                )}

                {/* Email */}
                <div className="lf-field">
                  <div className="lf-label-row">
                    <label className="lf-label">Email</label>
                  </div>
                  <input
                    type="email"
                    placeholder="maria@misalon.com"
                    maxLength={254}
                    autoComplete="email"
                    className={`lf-input${errors.email ? " err" : ""}`}
                    disabled={isLocked}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="lf-err-msg">{errors.email.message}</p>
                  )}
                </div>

                {/* Contraseña */}
                <div className="lf-field">
                  <div className="lf-label-row">
                    <label className="lf-label">Contraseña</label>
                    <Link href="/forgot-password" className="lf-forgot">
                      ¿La olvidaste?
                    </Link>
                  </div>
                  <div className="lf-input-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Tu contraseña"
                      maxLength={72}
                      autoComplete="current-password"
                      className={`lf-input pw${errors.password ? " err" : ""}`}
                      disabled={isLocked}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      className="lf-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      disabled={isLocked}
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="lf-err-msg">{errors.password.message}</p>
                  )}
                </div>

                {/* Error de autenticación — genérico, sin detallar */}
                {authError && !isLocked && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lf-err-banner"
                  >
                    ⚠ {authError}
                  </motion.div>
                )}

                {/* CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting || isLocked}
                  className="lf-cta"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />{" "}
                      Verificando…
                    </>
                  ) : isLocked ? (
                    <>
                      <ShieldAlert size={16} /> Bloqueado temporalmente
                    </>
                  ) : (
                    <>
                      Entrar al dashboard <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div className="lf-divider">
                <div className="lf-divider-line" />
                <span>¿Primera vez en BeautySync?</span>
                <div className="lf-divider-line" />
              </div>

              <div className="lf-register">
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
