"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
} from "lucide-react";
import Link from "next/link";

// ─── SCHEMA ───────────────────────────────────────────────────────────────────
const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(72, "Contraseña demasiado larga"),
    confirmPassword: z.string().min(1, "Confirma tu nueva contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type ResetForm = z.infer<typeof resetSchema>;

// ─── TIPOS DE ESTADO ──────────────────────────────────────────────────────────
type PageState = "loading" | "ready" | "invalid" | "success";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    mode: "onBlur",
  });

  // ─── ESCUCHAR EVENTO DE RECOVERY ────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();

    // Supabase detecta automáticamente el #access_token en la URL
    // y dispara PASSWORD_RECOVERY cuando es válido
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // Token válido — mostrar formulario
        setPageState("ready");
      }
    });

    // Si después de 4 segundos no llegó el evento → token inválido o ausente
    const timeout = setTimeout(() => {
      setPageState((current) => {
        if (current === "loading") return "invalid";
        return current;
      });
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // ─── SUBMIT ─────────────────────────────────────────────────────────────────
  const onSubmit = async (data: ResetForm) => {
    setAuthError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      // Mensaje genérico — no exponer detalles internos
      setAuthError(
        "No se pudo actualizar la contraseña. El enlace puede haber expirado. Solicita uno nuevo.",
      );
      return;
    }

    // Éxito — sesión activa, redirigir al dashboard
    setPageState("success");
    setTimeout(() => {
      router.replace("/dashboard");
    }, 2000);
  };

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

        .rp-root {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          background: var(--midnight);
          font-family: var(--font-body);
          position: relative; overflow: hidden;
          padding: 2rem 1rem;
        }
        .rp-root::before {
          content: ''; position: fixed;
          width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(112,0,255,0.14) 0%, transparent 65%);
          top: -180px; left: -150px; pointer-events: none; z-index: 0;
        }
        .rp-root::after {
          content: ''; position: fixed;
          width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,45,85,0.10) 0%, transparent 65%);
          bottom: -120px; right: -100px; pointer-events: none; z-index: 0;
        }

        .rp-container {
          position: relative; z-index: 1;
          width: 100%; max-width: 440px;
        }

        /* Logo */
        .rp-logo {
          display: flex; align-items: center; gap: 0.5rem;
          justify-content: center; margin-bottom: 2rem;
        }
        .rp-gem {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, var(--electric-rose), var(--violet-neon));
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.875rem; color: #fff;
          box-shadow: 0 4px 16px rgba(255,45,85,0.35);
        }
        .rp-brand {
          font-family: var(--font-display);
          font-size: 1.375rem; font-weight: 500;
          color: #fff; letter-spacing: 0.02em;
        }

        /* Header */
        .rp-header { text-align: center; margin-bottom: 2rem; }
        .rp-eyebrow {
          font-size: 0.6875rem; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--electric-rose); margin-bottom: 0.5rem;
        }
        .rp-title {
          font-family: var(--font-display);
          font-size: 2rem; font-weight: 500;
          color: #fff; margin: 0 0 0.5rem; line-height: 1.2;
        }
        .rp-sub {
          font-size: 0.875rem; color: var(--muted-lavender);
          line-height: 1.6; margin: 0;
        }

        /* Card glass */
        .rp-glass {
          background: var(--card-bg);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 2rem;
          box-shadow: 0 24px 60px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset;
        }

        /* Loading */
        .rp-loading {
          display: flex; flex-direction: column;
          align-items: center; gap: 1rem;
          padding: 1rem 0;
        }
        .rp-loading-text {
          font-size: 0.875rem; color: var(--muted-lavender);
        }

        /* Campo */
        .rp-field { margin-bottom: 1.25rem; }
        .rp-label {
          display: block; font-size: 0.8125rem; font-weight: 500;
          color: rgba(255,255,255,0.7); margin-bottom: 0.5rem;
          letter-spacing: 0.01em;
        }
        .rp-input-wrap { position: relative; }
        .rp-input {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 0.875rem 2.75rem 0.875rem 1rem;
          font-size: 0.9375rem; color: #fff;
          font-family: var(--font-body);
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none; box-sizing: border-box;
        }
        .rp-input::placeholder { color: rgba(255,255,255,0.25); }
        .rp-input:focus {
          border-color: rgba(255,45,85,0.5);
          box-shadow: 0 0 0 3px rgba(255,45,85,0.12);
        }
        .rp-input.err {
          border-color: rgba(255,80,80,0.5);
          box-shadow: 0 0 0 3px rgba(255,80,80,0.1);
        }
        .rp-toggle {
          position: absolute; right: 0.875rem; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.35); padding: 0;
          display: flex; align-items: center;
          transition: color 0.2s;
        }
        .rp-toggle:hover { color: rgba(255,255,255,0.7); }
        .rp-err-msg {
          font-size: 0.75rem; color: #ff8080;
          margin: 0.375rem 0 0; padding-left: 0.25rem;
        }

        /* Strength hint */
        .rp-hint {
          font-size: 0.75rem; color: rgba(255,255,255,0.3);
          margin: 0.375rem 0 0; padding-left: 0.25rem;
        }

        /* Error banner */
        .rp-err-banner {
          background: rgba(255,80,80,0.08);
          border: 1px solid rgba(255,80,80,0.2);
          border-radius: 10px; padding: 0.875rem 1rem;
          font-size: 0.875rem; color: #ff8080;
          margin-bottom: 1.25rem; line-height: 1.5;
        }

        /* CTA */
        .rp-cta {
          width: 100%; padding: 0.9375rem 1.5rem;
          background: linear-gradient(135deg, var(--electric-rose) 0%, var(--rose-deep) 100%);
          border: none; border-radius: 10px;
          font-family: var(--font-body);
          font-size: 0.9375rem; font-weight: 700;
          color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(255,45,85,0.35), 0 1px 0 rgba(255,255,255,0.12) inset;
          letter-spacing: 0.01em; margin-top: 0.5rem;
        }
        .rp-cta:hover:not(:disabled) {
          background: linear-gradient(135deg, #ff4d6d 0%, #e8003f 100%);
          box-shadow: 0 6px 28px rgba(255,45,85,0.5), 0 1px 0 rgba(255,255,255,0.12) inset;
          transform: translateY(-1px);
        }
        .rp-cta:active:not(:disabled) { transform: translateY(0); }
        .rp-cta:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        /* Back link */
        .rp-back {
          display: flex; align-items: center; justify-content: center;
          gap: 0.375rem; margin-top: 1.5rem;
          font-size: 0.8125rem; color: var(--muted-lavender);
          text-decoration: none; transition: color 0.2s;
        }
        .rp-back:hover { color: #fff; }

        /* Estado inválido */
        .rp-invalid-icon {
          width: 64px; height: 64px;
          background: rgba(255,80,80,0.1);
          border: 1px solid rgba(255,80,80,0.25);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.5rem;
        }
        .rp-invalid-title {
          font-family: var(--font-display);
          font-size: 1.625rem; font-weight: 500;
          color: #fff; text-align: center; margin: 0 0 0.75rem;
        }
        .rp-invalid-text {
          font-size: 0.875rem; color: var(--muted-lavender);
          text-align: center; line-height: 1.7; margin: 0 0 1.5rem;
        }
        .rp-retry-btn {
          display: block; width: 100%;
          padding: 0.875rem 1.5rem;
          background: rgba(255,45,85,0.1);
          border: 1px solid rgba(255,45,85,0.25);
          border-radius: 10px; color: var(--electric-rose);
          font-family: var(--font-body); font-size: 0.9375rem;
          font-weight: 600; text-align: center;
          text-decoration: none; cursor: pointer;
          transition: all 0.2s;
        }
        .rp-retry-btn:hover {
          background: rgba(255,45,85,0.18);
          border-color: rgba(255,45,85,0.4);
        }

        /* Estado éxito */
        .rp-success-icon {
          width: 64px; height: 64px;
          background: linear-gradient(135deg, rgba(255,45,85,0.15), rgba(112,0,255,0.15));
          border: 1px solid rgba(255,45,85,0.25);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.5rem;
        }
        .rp-success-title {
          font-family: var(--font-display);
          font-size: 1.625rem; font-weight: 500;
          color: #fff; text-align: center; margin: 0 0 0.75rem;
        }
        .rp-success-text {
          font-size: 0.875rem; color: var(--muted-lavender);
          text-align: center; line-height: 1.7; margin: 0 0 0.5rem;
        }
        .rp-success-note {
          font-size: 0.75rem; color: rgba(255,255,255,0.3);
          text-align: center; margin-top: 1rem; line-height: 1.6;
        }
      `}</style>

      <div className="rp-root">
        <div className="rp-container">
          {/* Logo */}
          <div className="rp-logo">
            <div className="rp-gem">✦</div>
            <span className="rp-brand">BeautySync</span>
          </div>

          <AnimatePresence mode="wait">
            {/* ── Estado: cargando ── */}
            {pageState === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="rp-glass">
                  <div className="rp-loading">
                    <Loader2
                      size={32}
                      color="#FF2D55"
                      className="animate-spin"
                    />
                    <p className="rp-loading-text">
                      Verificando enlace de recuperación…
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Estado: token inválido o expirado ── */}
            {pageState === "invalid" && (
              <motion.div
                key="invalid"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="rp-glass">
                  <div className="rp-invalid-icon">
                    <KeyRound size={28} color="#ff8080" />
                  </div>
                  <h2 className="rp-invalid-title">
                    Enlace inválido o expirado
                  </h2>
                  <p className="rp-invalid-text">
                    Este enlace de recuperación ya no es válido. Puede haber
                    expirado (duran 1 hora) o ya fue utilizado. Solicita uno
                    nuevo.
                  </p>
                  <Link href="/forgot-password" className="rp-retry-btn">
                    Solicitar nuevo enlace
                  </Link>
                </div>

                <Link href="/login" className="rp-back">
                  <ArrowLeft size={14} /> Volver al inicio de sesión
                </Link>
              </motion.div>
            )}

            {/* ── Estado: formulario listo ── */}
            {pageState === "ready" && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="rp-header">
                  <p className="rp-eyebrow">Nueva contraseña</p>
                  <h1 className="rp-title">Crea tu nueva contraseña</h1>
                  <p className="rp-sub">
                    Elige una contraseña segura para tu cuenta.
                  </p>
                </div>

                <div className="rp-glass">
                  <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    {authError && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rp-err-banner"
                      >
                        ⚠ {authError}
                      </motion.div>
                    )}

                    {/* Nueva contraseña */}
                    <div className="rp-field">
                      <label className="rp-label">Nueva contraseña</label>
                      <div className="rp-input-wrap">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 8 caracteres"
                          maxLength={72}
                          autoComplete="new-password"
                          autoFocus
                          className={`rp-input${errors.password ? " err" : ""}`}
                          {...register("password")}
                        />
                        <button
                          type="button"
                          className="rp-toggle"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={
                            showPassword
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                        >
                          {showPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                      {errors.password ? (
                        <p className="rp-err-msg">{errors.password.message}</p>
                      ) : (
                        <p className="rp-hint">Mínimo 8 caracteres</p>
                      )}
                    </div>

                    {/* Confirmar contraseña */}
                    <div className="rp-field">
                      <label className="rp-label">Confirmar contraseña</label>
                      <div className="rp-input-wrap">
                        <input
                          type={showConfirm ? "text" : "password"}
                          placeholder="Repite tu nueva contraseña"
                          maxLength={72}
                          autoComplete="new-password"
                          className={`rp-input${errors.confirmPassword ? " err" : ""}`}
                          {...register("confirmPassword")}
                        />
                        <button
                          type="button"
                          className="rp-toggle"
                          onClick={() => setShowConfirm((v) => !v)}
                          aria-label={
                            showConfirm
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                        >
                          {showConfirm ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="rp-err-msg">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rp-cta"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />{" "}
                          Guardando contraseña…
                        </>
                      ) : (
                        <>
                          Guardar nueva contraseña <ShieldCheck size={16} />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* ── Estado: éxito ── */}
            {pageState === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="rp-glass">
                  <div className="rp-success-icon">
                    <ShieldCheck size={28} color="#FF2D55" />
                  </div>
                  <h2 className="rp-success-title">¡Contraseña actualizada!</h2>
                  <p className="rp-success-text">
                    Tu contraseña fue cambiada exitosamente. Redirigiendo a tu
                    dashboard…
                  </p>
                  <p className="rp-success-note">
                    Serás redirigida automáticamente en unos segundos.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
