"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowRight, ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";

// ─── SANITIZACIÓN ─────────────────────────────────────────────────────────────
function sanitizeEmail(value: string): string {
  return value.toLowerCase().trim().replace(/\s/g, "");
}

// ─── SCHEMA ───────────────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

const forgotSchema = z.object({
  email: z
    .string()
    .min(1, "El email es requerido")
    .max(254, "Email demasiado largo")
    .regex(EMAIL_REGEX, "Email inválido")
    .transform(sanitizeEmail),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: ForgotForm) => {
    const supabase = createClient();

    // CRÍTICO: Siempre llamamos resetPasswordForEmail independientemente
    // de si el email existe — previene User Enumeration Attack.
    // Supabase maneja internamente el caso de email inexistente sin error.
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });

    // SIEMPRE mostrar pantalla de éxito — nunca revelar si el email existe
    setSubmittedEmail(data.email);
    setSubmitted(true);
  };

  return (
    <>
      <style>{`

        /* ── TOKENS Dark Atelier ─────────────────────────────────── */
        .fp-root {
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
        .fp-root {
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

        /* Radiales de fondo */
        .fp-root::before {
          content: '';
          position: fixed;
          width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,45,85,0.07) 0%, transparent 65%);
          top: -200px; right: -150px;
          pointer-events: none; z-index: 0;
        }
        .fp-root::after {
          content: '';
          position: fixed;
          width: 450px; height: 450px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,45,85,0.04) 0%, transparent 65%);
          bottom: -150px; left: -80px;
          pointer-events: none; z-index: 0;
        }

        /* Grid de fondo */
        .fp-grid {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px);
          background-size: 64px 64px;
        }

        /* ── CONTENEDOR ──────────────────────────────────────────── */
        .fp-wrap {
          position: relative; z-index: 1;
          width: 100%; max-width: 420px;
          display: flex; flex-direction: column; align-items: center;
        }

        /* ── LOGO ────────────────────────────────────────────────── */
        .fp-logo {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 40px;
          text-decoration: none;
        }
        .fp-logo-box {
          width: 28px; height: 28px;
          border: 1px solid var(--rose-border); border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .fp-logo-box span {
          font-size: 9px; font-weight: 500;
          color: var(--rose); letter-spacing: -0.03em;
        }
        .fp-logo-name {
          font-size: 13px; color: rgba(245,242,238,0.45);
          letter-spacing: 0.08em; font-weight: 400; text-transform: uppercase;
        }

        /* ── HEADER ──────────────────────────────────────────────── */
        .fp-header {
          text-align: center; margin-bottom: 28px; width: 100%;
        }
        .fp-header-eyebrow {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; margin-bottom: 14px;
        }
        .fp-eyebrow-line {
          width: 18px; height: 1px; background: var(--rose-dim);
          display: inline-block;
        }
        .fp-eyebrow-text {
          font-size: 10px; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--rose-dim);
        }
        .fp-title {
          font-family: var(--serif);
          font-size: 2.5rem; font-weight: 300;
          color: var(--text-primary); margin: 0 0 10px;
          line-height: 1.08; letter-spacing: -0.03em;
        }
        .fp-title em { font-style: normal; color: var(--rose); }
        .fp-sub {
          font-size: 13px; color: var(--text-mid);
          line-height: 1.75; margin: 0; font-weight: 300;
          max-width: 340px;
        }

        /* ── CARD ────────────────────────────────────────────────── */
        .fp-card {
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2rem;
          position: relative; overflow: hidden;
        }
        /* Acento esquina superior derecha */
        .fp-card::before {
          content: '';
          position: absolute; top: 0; right: 0;
          width: 16px; height: 16px;
          border-top: 1px solid var(--rose-border);
          border-right: 1px solid var(--rose-border);
          border-top-right-radius: 16px;
          pointer-events: none;
        }
        /* Radial interior */
        .fp-card::after {
          content: '';
          position: absolute; top: -40px; right: -40px;
          width: 180px; height: 180px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,45,85,0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        /* ── CAMPO ───────────────────────────────────────────────── */
        .fp-field { margin-bottom: 6px; }
        .fp-label {
          display: block;
          font-size: 10px; font-weight: 400;
          color: var(--text-mid);
          letter-spacing: 0.1em; text-transform: uppercase;
          margin-bottom: 8px;
        }
        .fp-input {
          width: 100%;
          background: var(--surface2);
          border: 1px solid var(--border-mid);
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 14px; color: var(--text-primary);
          font-family: var(--sans);
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          outline: none; box-sizing: border-box;
        }
        .fp-input::placeholder { color: var(--text-dim); }
        .fp-input:focus {
          border-color: var(--rose-border);
          background: rgba(255,45,85,0.04);
          box-shadow: 0 0 0 3px rgba(255,45,85,0.08);
        }
        .fp-input.err {
          border-color: rgba(255,80,80,0.45);
        }
        .fp-err-msg {
          font-size: 11px; color: rgba(255,110,110,0.85);
          margin: 6px 0 0;
        }

        /* ── CTA ─────────────────────────────────────────────────── */
        .fp-cta {
          width: 100%; margin-top: 20px;
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
        .fp-cta:hover:not(:disabled) {
          background: rgba(255,45,85,0.16);
          border-color: rgba(255,45,85,0.42);
          color: var(--rose);
        }
        .fp-cta:active:not(:disabled) { opacity: 0.85; }
        .fp-cta:disabled { opacity: 0.35; cursor: not-allowed; }

        /* ── BACK LINK ───────────────────────────────────────────── */
        .fp-back {
          display: flex; align-items: center; justify-content: center;
          gap: 6px; margin-top: 20px;
          font-size: 11px; color: var(--text-dim);
          letter-spacing: 0.06em; text-transform: uppercase;
          text-decoration: none;
          transition: color 0.2s;
        }
        .fp-back:hover { color: var(--text-mid); }

        /* ── ESTADO ÉXITO ────────────────────────────────────────── */
        .fp-success-icon-wrap {
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 24px;
        }
        .fp-success-icon {
          width: 56px; height: 56px;
          background: var(--rose-ghost);
          border: 1px solid var(--rose-border);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          position: relative;
        }
        /* Anillo exterior */
        .fp-success-icon::before {
          content: '';
          position: absolute; inset: -5px;
          border-radius: 50%;
          border: 1px solid var(--rose-border);
          opacity: 0.4;
        }

        .fp-success-title {
          font-family: var(--serif);
          font-size: 1.8rem; font-weight: 300;
          color: var(--text-primary);
          text-align: center; margin: 0 0 14px;
          letter-spacing: -0.02em; line-height: 1.1;
        }
        .fp-success-text {
          font-size: 13px; color: var(--text-mid);
          text-align: center; line-height: 1.75;
          margin: 0; font-weight: 300;
        }
        .fp-success-email {
          color: var(--rose-dim); font-weight: 400;
          word-break: break-all;
        }

        /* Divider */
        .fp-success-divider {
          height: 1px; background: var(--border);
          margin: 20px 0;
        }

        .fp-success-note {
          font-size: 11px; color: var(--text-dim);
          text-align: center; line-height: 1.65;
          letter-spacing: 0.02em;
        }

      `}</style>

      <div className="fp-root">
        <div className="fp-grid" aria-hidden="true" />

        <div className="fp-wrap">
          {/* Logo */}
          <Link href="/" className="fp-logo">
            <div className="fp-logo-box">
              <span>BS</span>
            </div>
            <span className="fp-logo-name">BeautySync</span>
          </Link>

          <AnimatePresence mode="wait">
            {/* ── Vista: formulario ──────────────────────────────── */}
            {!submitted && (
              <motion.div
                key="form"
                style={{ width: "100%" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="fp-header">
                  <div className="fp-header-eyebrow">
                    <span className="fp-eyebrow-line" />
                    <span className="fp-eyebrow-text">Recuperar acceso</span>
                    <span className="fp-eyebrow-line" />
                  </div>
                  <h1 className="fp-title">
                    ¿Olvidaste tu
                    <br />
                    <em>contraseña?</em>
                  </h1>
                  <p className="fp-sub">
                    Ingresa tu email y te enviaremos un enlace para crear una
                    nueva contraseña.
                  </p>
                </div>

                <div className="fp-card">
                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                    autoComplete="on"
                  >
                    <div className="fp-field">
                      <label className="fp-label">Email de tu cuenta</label>
                      <input
                        type="email"
                        placeholder="maria@misalon.com"
                        maxLength={254}
                        autoComplete="email"
                        autoFocus
                        className={`fp-input${errors.email ? " err" : ""}`}
                        {...register("email")}
                      />
                      {errors.email && (
                        <p className="fp-err-msg">{errors.email.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="fp-cta"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />{" "}
                          Enviando enlace…
                        </>
                      ) : (
                        <>
                          Enviar enlace de recuperación <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <Link href="/login" className="fp-back">
                  <ArrowLeft size={13} /> Volver al inicio de sesión
                </Link>
              </motion.div>
            )}

            {/* ── Vista: éxito ───────────────────────────────────── */}
            {submitted && (
              <motion.div
                key="success"
                style={{ width: "100%" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="fp-card">
                  <div className="fp-success-icon-wrap">
                    <div className="fp-success-icon">
                      <MailCheck size={22} color="rgba(255,45,85,0.7)" />
                    </div>
                  </div>

                  <h2 className="fp-success-title">Revisa tu email.</h2>

                  <p className="fp-success-text">
                    Si existe una cuenta asociada a{" "}
                    <span className="fp-success-email">{submittedEmail}</span>,
                    recibirás un enlace para restablecer tu contraseña en los
                    próximos minutos.
                  </p>

                  <div className="fp-success-divider" />

                  <p className="fp-success-note">
                    ¿No llegó? Revisa tu carpeta de spam o espera unos minutos
                    antes de intentar de nuevo.
                  </p>
                </div>

                <Link href="/login" className="fp-back">
                  <ArrowLeft size={13} /> Volver al inicio de sesión
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
