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

    // Verificar si ya hay sesión recovery activa
    // (el SDK puede procesar el hash antes de que monte el componente)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setPageState("ready");
    });

    // Escuchar el evento por si llega después
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setPageState("ready");
      }
    });

    // 6 segundos de margen para conexiones lentas
    const timeout = setTimeout(() => {
      setPageState((current) => {
        if (current === "loading") return "invalid";
        return current;
      });
    }, 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // ─── SUBMIT ──────────────────────────────────────────────────────────────────
  const onSubmit = async (data: ResetForm) => {
    setAuthError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      setAuthError(
        "No se pudo actualizar la contraseña. El enlace puede haber expirado. Solicita uno nuevo.",
      );
      return;
    }

    setPageState("success");
    setTimeout(() => {
      router.replace("/dashboard");
    }, 2000);
  };

  return (
    <>
      <style>{`

        /* ── TOKENS Dark Atelier ─────────────────────────────────── */
        .rpa-root {
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
        .rpa-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          font-family: var(--sans);
          position: relative;
          overflow: hidden;
          padding: 2rem 1.5rem;
        }
        .rpa-root::before {
          content: '';
          position: fixed;
          width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,45,85,0.07) 0%, transparent 65%);
          top: -200px; right: -150px;
          pointer-events: none; z-index: 0;
        }
        .rpa-root::after {
          content: '';
          position: fixed;
          width: 450px; height: 450px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,45,85,0.04) 0%, transparent 65%);
          bottom: -150px; left: -80px;
          pointer-events: none; z-index: 0;
        }

        /* Grid sutil */
        .rpa-grid {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px);
          background-size: 64px 64px;
        }

        /* ── WRAP ────────────────────────────────────────────────── */
        .rpa-wrap {
          position: relative; z-index: 1;
          width: 100%; max-width: 420px;
          display: flex; flex-direction: column; align-items: center;
        }

        /* ── LOGO ────────────────────────────────────────────────── */
        .rpa-logo {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 40px; text-decoration: none;
        }
        .rpa-logo-box {
          width: 28px; height: 28px;
          border: 1px solid var(--rose-border); border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .rpa-logo-box span {
          font-size: 9px; font-weight: 500;
          color: var(--rose); letter-spacing: -0.03em;
        }
        .rpa-logo-name {
          font-size: 13px; color: rgba(245,242,238,0.45);
          letter-spacing: 0.08em; font-weight: 400; text-transform: uppercase;
        }

        /* ── HEADER ──────────────────────────────────────────────── */
        .rpa-header {
          text-align: center; margin-bottom: 28px; width: 100%;
        }
        .rpa-eyebrow-row {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; margin-bottom: 14px;
        }
        .rpa-eyebrow-line {
          width: 18px; height: 1px; background: var(--rose-dim);
          display: inline-block;
        }
        .rpa-eyebrow-text {
          font-size: 10px; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--rose-dim);
        }
        .rpa-title {
          font-family: var(--serif);
          font-size: 2.5rem; font-weight: 300;
          color: var(--text-primary); margin: 0 0 10px;
          line-height: 1.08; letter-spacing: -0.03em;
        }
        .rpa-title em { font-style: normal; color: var(--rose); }
        .rpa-sub {
          font-size: 13px; color: var(--text-mid);
          line-height: 1.75; margin: 0; font-weight: 300;
        }

        /* ── CARD ────────────────────────────────────────────────── */
        .rpa-card {
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2rem;
          position: relative; overflow: hidden;
        }
        .rpa-card::before {
          content: '';
          position: absolute; top: 0; right: 0;
          width: 16px; height: 16px;
          border-top: 1px solid var(--rose-border);
          border-right: 1px solid var(--rose-border);
          border-top-right-radius: 16px;
          pointer-events: none;
        }
        .rpa-card::after {
          content: '';
          position: absolute; top: -40px; right: -40px;
          width: 180px; height: 180px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,45,85,0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        /* ── LOADING ─────────────────────────────────────────────── */
        .rpa-loading {
          display: flex; flex-direction: column;
          align-items: center; gap: 14px; padding: 8px 0;
        }
        .rpa-loading-text {
          font-size: 13px; color: var(--text-dim);
          letter-spacing: 0.04em; text-align: center;
        }

        /* ── CAMPO ───────────────────────────────────────────────── */
        .rpa-field { margin-bottom: 18px; }
        .rpa-label {
          display: block;
          font-size: 10px; font-weight: 400;
          color: var(--text-mid);
          letter-spacing: 0.1em; text-transform: uppercase;
          margin-bottom: 8px;
        }
        .rpa-input-wrap { position: relative; }
        .rpa-input {
          width: 100%;
          background: var(--surface2);
          border: 1px solid var(--border-mid);
          border-radius: 8px;
          padding: 12px 42px 12px 14px;
          font-size: 14px; color: var(--text-primary);
          font-family: var(--sans);
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          outline: none; box-sizing: border-box;
        }
        .rpa-input::placeholder { color: var(--text-dim); }
        .rpa-input:focus {
          border-color: var(--rose-border);
          background: rgba(255,45,85,0.04);
          box-shadow: 0 0 0 3px rgba(255,45,85,0.08);
        }
        .rpa-input.err { border-color: rgba(255,80,80,0.45); }

        .rpa-toggle {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: var(--text-dim); padding: 0;
          display: flex; align-items: center;
          transition: color 0.2s;
        }
        .rpa-toggle:hover { color: var(--rose-dim); }

        .rpa-err-msg {
          font-size: 11px; color: rgba(255,110,110,0.85); margin-top: 6px;
        }
        .rpa-hint {
          font-size: 11px; color: var(--text-dim);
          margin-top: 6px; letter-spacing: 0.03em;
        }

        /* ── ERROR BANNER ────────────────────────────────────────── */
        .rpa-err-banner {
          background: var(--rose-ghost);
          border: 1px solid var(--rose-border);
          border-radius: 8px; padding: 12px 14px;
          font-size: 12px; color: rgba(255,110,110,0.9);
          margin-bottom: 18px; line-height: 1.55;
        }

        /* ── CTA ─────────────────────────────────────────────────── */
        .rpa-cta {
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
        .rpa-cta:hover:not(:disabled) {
          background: rgba(255,45,85,0.16);
          border-color: rgba(255,45,85,0.42);
          color: var(--rose);
        }
        .rpa-cta:active:not(:disabled) { opacity: 0.85; }
        .rpa-cta:disabled { opacity: 0.35; cursor: not-allowed; }

        /* ── BACK LINK ───────────────────────────────────────────── */
        .rpa-back {
          display: flex; align-items: center; justify-content: center;
          gap: 6px; margin-top: 20px;
          font-size: 11px; color: var(--text-dim);
          letter-spacing: 0.06em; text-transform: uppercase;
          text-decoration: none; transition: color 0.2s;
        }
        .rpa-back:hover { color: var(--text-mid); }

        /* ── ESTADO INVÁLIDO ─────────────────────────────────────── */
        .rpa-state-icon {
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 22px;
        }
        .rpa-icon-circle {
          width: 56px; height: 56px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          position: relative;
        }
        .rpa-icon-circle::before {
          content: '';
          position: absolute; inset: -5px; border-radius: 50%;
          border: 1px solid currentColor; opacity: 0.25;
        }
        .rpa-icon-circle.danger {
          background: rgba(255,80,80,0.07);
          border: 1px solid rgba(255,80,80,0.22);
          color: rgba(255,80,80,0.5);
        }
        .rpa-icon-circle.success {
          background: var(--rose-ghost);
          border: 1px solid var(--rose-border);
          color: var(--rose-border);
        }

        .rpa-state-title {
          font-family: var(--serif);
          font-size: 1.8rem; font-weight: 300;
          color: var(--text-primary);
          text-align: center; margin: 0 0 12px;
          letter-spacing: -0.02em; line-height: 1.1;
        }
        .rpa-state-text {
          font-size: 13px; color: var(--text-mid);
          text-align: center; line-height: 1.75;
          margin: 0; font-weight: 300;
        }
        .rpa-state-note {
          font-size: 11px; color: var(--text-dim);
          text-align: center; margin-top: 14px;
          line-height: 1.65; letter-spacing: 0.02em;
        }

        /* Divider */
        .rpa-state-divider {
          height: 1px; background: var(--border); margin: 20px 0;
        }

        /* Retry btn */
        .rpa-retry-btn {
          display: block; width: 100%;
          padding: 12px 16px;
          background: var(--rose-ghost);
          border: 1px solid var(--rose-border);
          border-radius: 8px;
          color: var(--rose-dim);
          font-family: var(--sans);
          font-size: 12px; font-weight: 400;
          letter-spacing: 0.1em; text-transform: uppercase;
          text-align: center; text-decoration: none;
          transition: all 0.2s; margin-top: 20px;
        }
        .rpa-retry-btn:hover {
          background: rgba(255,45,85,0.16);
          border-color: rgba(255,45,85,0.42);
          color: var(--rose);
        }

        /* Progress bar para redirect */
        .rpa-progress-wrap {
          margin-top: 20px;
          height: 1px; background: var(--border); border-radius: 1px;
          overflow: hidden;
        }
        .rpa-progress-bar {
          height: 100%; background: var(--rose-dim);
          animation: rpa-fill 2s linear forwards;
        }
        @keyframes rpa-fill {
          from { width: 0%; }
          to   { width: 100%; }
        }

      `}</style>

      <div className="rpa-root">
        <div className="rpa-grid" aria-hidden="true" />

        <div className="rpa-wrap">
          {/* Logo */}
          <Link href="/" className="rpa-logo">
            <div className="rpa-logo-box">
              <span>BS</span>
            </div>
            <span className="rpa-logo-name">BeautySync</span>
          </Link>

          <AnimatePresence mode="wait">
            {/* ── Estado: cargando ───────────────────────────────── */}
            {pageState === "loading" && (
              <motion.div
                key="loading"
                style={{ width: "100%" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="rpa-card">
                  <div className="rpa-loading">
                    <Loader2
                      size={28}
                      color="rgba(255,45,85,0.6)"
                      className="animate-spin"
                    />
                    <p className="rpa-loading-text">
                      Verificando enlace de recuperación…
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Estado: token inválido o expirado ──────────────── */}
            {pageState === "invalid" && (
              <motion.div
                key="invalid"
                style={{ width: "100%" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="rpa-card">
                  <div className="rpa-state-icon">
                    <div className="rpa-icon-circle danger">
                      <KeyRound size={22} color="rgba(255,80,80,0.7)" />
                    </div>
                  </div>

                  <h2 className="rpa-state-title">
                    Enlace inválido
                    <br />o expirado.
                  </h2>
                  <p className="rpa-state-text">
                    Este enlace de recuperación ya no es válido. Puede haber
                    expirado (duran 1 hora) o ya fue utilizado.
                  </p>

                  <div className="rpa-state-divider" />

                  <Link href="/forgot-password" className="rpa-retry-btn">
                    Solicitar nuevo enlace
                  </Link>
                </div>

                <Link href="/login" className="rpa-back">
                  <ArrowLeft size={13} /> Volver al inicio de sesión
                </Link>
              </motion.div>
            )}

            {/* ── Estado: formulario listo ────────────────────────── */}
            {pageState === "ready" && (
              <motion.div
                key="ready"
                style={{ width: "100%" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="rpa-header">
                  <div className="rpa-eyebrow-row">
                    <span className="rpa-eyebrow-line" />
                    <span className="rpa-eyebrow-text">Nueva contraseña</span>
                    <span className="rpa-eyebrow-line" />
                  </div>
                  <h1 className="rpa-title">
                    Crea tu nueva
                    <br />
                    <em>contraseña.</em>
                  </h1>
                  <p className="rpa-sub">
                    Elige una contraseña segura para tu cuenta.
                  </p>
                </div>

                <div className="rpa-card">
                  <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    {authError && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rpa-err-banner"
                      >
                        {authError}
                      </motion.div>
                    )}

                    {/* Nueva contraseña */}
                    <div className="rpa-field">
                      <label className="rpa-label">Nueva contraseña</label>
                      <div className="rpa-input-wrap">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 8 caracteres"
                          maxLength={72}
                          autoComplete="new-password"
                          autoFocus
                          className={`rpa-input${errors.password ? " err" : ""}`}
                          {...register("password")}
                        />
                        <button
                          type="button"
                          className="rpa-toggle"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={
                            showPassword
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                        >
                          {showPassword ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}
                        </button>
                      </div>
                      {errors.password ? (
                        <p className="rpa-err-msg">{errors.password.message}</p>
                      ) : (
                        <p className="rpa-hint">Mínimo 8 caracteres</p>
                      )}
                    </div>

                    {/* Confirmar contraseña */}
                    <div className="rpa-field">
                      <label className="rpa-label">Confirmar contraseña</label>
                      <div className="rpa-input-wrap">
                        <input
                          type={showConfirm ? "text" : "password"}
                          placeholder="Repite tu nueva contraseña"
                          maxLength={72}
                          autoComplete="new-password"
                          className={`rpa-input${errors.confirmPassword ? " err" : ""}`}
                          {...register("confirmPassword")}
                        />
                        <button
                          type="button"
                          className="rpa-toggle"
                          onClick={() => setShowConfirm((v) => !v)}
                          aria-label={
                            showConfirm
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                        >
                          {showConfirm ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="rpa-err-msg">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rpa-cta"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />{" "}
                          Guardando contraseña…
                        </>
                      ) : (
                        <>
                          Guardar nueva contraseña <ShieldCheck size={14} />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* ── Estado: éxito ───────────────────────────────────── */}
            {pageState === "success" && (
              <motion.div
                key="success"
                style={{ width: "100%" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="rpa-card">
                  <div className="rpa-state-icon">
                    <div className="rpa-icon-circle success">
                      <ShieldCheck size={22} color="rgba(255,45,85,0.7)" />
                    </div>
                  </div>

                  <h2 className="rpa-state-title">
                    Contraseña
                    <br />
                    actualizada.
                  </h2>
                  <p className="rpa-state-text">
                    Tu contraseña fue cambiada exitosamente. Redirigiendo a tu
                    dashboard…
                  </p>
                  <p className="rpa-state-note">
                    Serás redirigida automáticamente en unos segundos.
                  </p>

                  {/* Barra de progreso del redirect */}
                  <div className="rpa-progress-wrap">
                    <div className="rpa-progress-bar" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
