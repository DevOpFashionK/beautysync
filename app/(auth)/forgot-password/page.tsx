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

    // CRÍTICO: Llamamos resetPasswordForEmail independientemente de si el
    // email existe — así evitamos revelar qué emails están registrados.
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

        .fp-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--midnight);
          font-family: var(--font-body);
          position: relative;
          overflow: hidden;
          padding: 2rem 1rem;
        }
        .fp-root::before {
          content: '';
          position: fixed;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(112,0,255,0.14) 0%, transparent 65%);
          top: -180px; left: -150px;
          pointer-events: none; z-index: 0;
        }
        .fp-root::after {
          content: '';
          position: fixed;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,45,85,0.10) 0%, transparent 65%);
          bottom: -120px; right: -100px;
          pointer-events: none; z-index: 0;
        }

        .fp-container {
          position: relative; z-index: 1;
          width: 100%; max-width: 440px;
        }

        /* Logo */
        .fp-logo {
          display: flex; align-items: center;
          gap: 0.5rem; justify-content: center;
          margin-bottom: 2rem;
        }
        .fp-gem {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, var(--electric-rose), var(--violet-neon));
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.875rem; color: #fff;
          box-shadow: 0 4px 16px rgba(255,45,85,0.35);
        }
        .fp-brand {
          font-family: var(--font-display);
          font-size: 1.375rem; font-weight: 500;
          color: #fff; letter-spacing: 0.02em;
        }

        /* Header */
        .fp-header { text-align: center; margin-bottom: 2rem; }
        .fp-eyebrow {
          font-size: 0.6875rem; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--electric-rose); margin-bottom: 0.5rem;
        }
        .fp-title {
          font-family: var(--font-display);
          font-size: 2rem; font-weight: 500;
          color: #fff; margin: 0 0 0.5rem;
          line-height: 1.2;
        }
        .fp-sub {
          font-size: 0.875rem; color: var(--muted-lavender);
          line-height: 1.6; margin: 0;
        }

        /* Card glass */
        .fp-glass {
          background: var(--card-bg);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 24px 60px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset;
        }

        /* Campo */
        .fp-field { margin-bottom: 1.25rem; }
        .fp-label {
          display: block; font-size: 0.8125rem;
          font-weight: 500; color: rgba(255,255,255,0.7);
          margin-bottom: 0.5rem; letter-spacing: 0.01em;
        }
        .fp-input {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 0.875rem 1rem;
          font-size: 0.9375rem; color: #fff;
          font-family: var(--font-body);
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none; box-sizing: border-box;
        }
        .fp-input::placeholder { color: rgba(255,255,255,0.25); }
        .fp-input:focus {
          border-color: rgba(255,45,85,0.5);
          box-shadow: 0 0 0 3px rgba(255,45,85,0.12);
        }
        .fp-input.err {
          border-color: rgba(255,80,80,0.5);
          box-shadow: 0 0 0 3px rgba(255,80,80,0.1);
        }
        .fp-err-msg {
          font-size: 0.75rem; color: #ff8080;
          margin: 0.375rem 0 0; padding-left: 0.25rem;
        }

        /* CTA */
        .fp-cta {
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
        .fp-cta:hover:not(:disabled) {
          background: linear-gradient(135deg, #ff4d6d 0%, #e8003f 100%);
          box-shadow: 0 6px 28px rgba(255,45,85,0.5), 0 1px 0 rgba(255,255,255,0.12) inset;
          transform: translateY(-1px);
        }
        .fp-cta:active:not(:disabled) { transform: translateY(0); }
        .fp-cta:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        /* Back link */
        .fp-back {
          display: flex; align-items: center; justify-content: center;
          gap: 0.375rem; margin-top: 1.5rem;
          font-size: 0.8125rem; color: var(--muted-lavender);
          text-decoration: none;
          transition: color 0.2s;
        }
        .fp-back:hover { color: #fff; }

        /* Estado de éxito */
        .fp-success-icon {
          width: 64px; height: 64px;
          background: linear-gradient(135deg, rgba(255,45,85,0.15), rgba(112,0,255,0.15));
          border: 1px solid rgba(255,45,85,0.25);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.5rem;
        }
        .fp-success-title {
          font-family: var(--font-display);
          font-size: 1.625rem; font-weight: 500;
          color: #fff; text-align: center;
          margin: 0 0 0.75rem;
        }
        .fp-success-text {
          font-size: 0.875rem; color: var(--muted-lavender);
          text-align: center; line-height: 1.7;
          margin: 0 0 0.5rem;
        }
        .fp-success-email {
          color: var(--electric-rose); font-weight: 600;
          word-break: break-all;
        }
        .fp-success-note {
          font-size: 0.75rem; color: rgba(255,255,255,0.3);
          text-align: center; margin-top: 1.25rem;
          line-height: 1.6;
        }
      `}</style>

      <div className="fp-root">
        <div className="fp-container">
          {/* Logo */}
          <div className="fp-logo">
            <div className="fp-gem">✦</div>
            <span className="fp-brand">BeautySync</span>
          </div>

          <AnimatePresence mode="wait">
            {/* ── Vista: formulario ── */}
            {!submitted && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="fp-header">
                  <p className="fp-eyebrow">Recuperar acceso</p>
                  <h1 className="fp-title">¿Olvidaste tu contraseña?</h1>
                  <p className="fp-sub">
                    Ingresa tu email y te enviaremos un enlace para crear una
                    nueva contraseña.
                  </p>
                </div>

                <div className="fp-glass">
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
                          <Loader2 size={16} className="animate-spin" />{" "}
                          Enviando enlace…
                        </>
                      ) : (
                        <>
                          Enviar enlace de recuperación <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <Link href="/login" className="fp-back">
                  <ArrowLeft size={14} /> Volver al inicio de sesión
                </Link>
              </motion.div>
            )}

            {/* ── Vista: éxito ── */}
            {submitted && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="fp-glass">
                  <div className="fp-success-icon">
                    <MailCheck size={28} color="#FF2D55" />
                  </div>

                  <h2 className="fp-success-title">Revisa tu email</h2>

                  <p className="fp-success-text">
                    Si existe una cuenta asociada a{" "}
                    <span className="fp-success-email">{submittedEmail}</span>,
                    recibirás un enlace para restablecer tu contraseña en los
                    próximos minutos.
                  </p>

                  <p className="fp-success-note">
                    ¿No llegó? Revisa tu carpeta de spam o espera unos minutos
                    antes de intentar de nuevo.
                  </p>
                </div>

                <Link href="/login" className="fp-back">
                  <ArrowLeft size={14} /> Volver al inicio de sesión
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
