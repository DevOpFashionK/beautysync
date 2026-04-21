import type { Metadata } from "next";
import Link from "next/link";
import RegisterStepper from "@/components/auth/RegisterStepper";

export const metadata: Metadata = {
  title: "Crear cuenta — BeautySync",
  description: "Registra tu salón y comienza tu prueba gratuita de 14 días",
};

export default function RegisterPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');

        /* ── TOKENS ── */
        :root {
          --midnight: #0F0A1E;
          --midnight-card: rgba(26,20,45,0.85);
          --electric-rose: #FF2D55;
          --rose-deep: #D4003C;
          --violet-neon: #7000FF;
          --muted-lavender: #B3B0C2;
          --border-glass: rgba(255,255,255,0.06);
          --border-glass-strong: rgba(255,255,255,0.1);
          --font-display: 'Cormorant Garamond', Georgia, serif;
          --font-body: 'Plus Jakarta Sans', -apple-system, sans-serif;
        }

        .reg-root {
          min-height: 100vh;
          display: flex;
          background: var(--midnight);
          font-family: var(--font-body);
          position: relative;
          overflow: hidden;
        }

        /* Orbe violet esquina superior izquierda */
        .reg-root::before {
          content: '';
          position: fixed;
          width: 700px; height: 700px; border-radius: 50%;
          background: radial-gradient(circle, rgba(112,0,255,0.15) 0%, transparent 65%);
          top: -200px; left: -200px;
          pointer-events: none; z-index: 0;
        }
        /* Orbe rose esquina inferior derecha */
        .reg-root::after {
          content: '';
          position: fixed;
          width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,45,85,0.08) 0%, transparent 65%);
          bottom: -150px; right: -100px;
          pointer-events: none; z-index: 0;
        }

        /* ── PANEL IZQUIERDO ── */
        .reg-left {
          display: none;
          width: 420px; flex-shrink: 0;
          flex-direction: column; justify-content: space-between;
          padding: 3.5rem 3rem;
          position: relative; z-index: 1;
          border-right: 1px solid var(--border-glass);
        }
        @media (min-width: 1024px) { .reg-left { display: flex; } }

        /* Grid pattern */
        .reg-left::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .rl-top { position: relative; z-index: 1; }
        .rl-logo-row { display: flex; align-items: center; gap: 0.875rem; }
        .rl-logo-gem {
          width: 40px; height: 40px; border-radius: 12px;
          background: linear-gradient(135deg, var(--electric-rose), var(--rose-deep));
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; color: #fff;
          box-shadow: 0 4px 20px rgba(255,45,85,0.4), 0 0 0 1px rgba(255,45,85,0.2);
        }
        .rl-logo-name {
          font-family: var(--font-display);
          font-size: 1.75rem; font-weight: 500;
          color: #fff; letter-spacing: 0.03em;
        }
        .rl-tagline {
          font-size: 0.6875rem; font-weight: 400;
          color: var(--muted-lavender); opacity: 0.6;
          margin-top: 0.5rem;
          letter-spacing: 0.1em; text-transform: uppercase;
        }

        .rl-mid { position: relative; z-index: 1; }
        .rl-quote {
          font-family: var(--font-display);
          font-size: 2.5rem; font-weight: 400; font-style: italic;
          line-height: 1.15; color: rgba(255,255,255,0.92);
          margin: 0 0 0.5rem;
        }
        .rl-quote em {
          font-style: normal;
          background: linear-gradient(135deg, var(--electric-rose), #ff6b8a);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .rl-quote-attr {
          font-size: 0.75rem; color: var(--muted-lavender); opacity: 0.5;
          margin-bottom: 2.5rem;
        }

        .rl-benefits { display: flex; flex-direction: column; gap: 0; }
        .rl-benefit {
          display: flex; align-items: flex-start; gap: 1rem;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .rl-benefit:last-child { border-bottom: none; }
        .rl-benefit-icon {
          width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 0.9rem;
          margin-top: 1px;
        }
        .rl-benefit-title {
          font-size: 0.875rem; font-weight: 600; color: rgba(255,255,255,0.88);
          line-height: 1.3; margin-bottom: 0.2rem;
        }
        .rl-benefit-desc {
          font-size: 0.75rem; font-weight: 400;
          color: var(--muted-lavender); opacity: 0.65; line-height: 1.5;
        }

        .rl-bottom { position: relative; z-index: 1; }
        .rl-trial {
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px; padding: 1.25rem 1.5rem;
          display: flex; align-items: center; gap: 1rem;
          background: rgba(255,255,255,0.02);
        }
        .rl-trial-badge {
          width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
          background: linear-gradient(135deg, rgba(255,45,85,0.15), rgba(112,0,255,0.1));
          border: 1px solid rgba(255,45,85,0.2);
          display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
        }
        .rl-trial-title { font-size: 0.875rem; font-weight: 600; color: #fff; }
        .rl-trial-sub { font-size: 0.75rem; color: var(--muted-lavender); opacity: 0.55; margin-top: 3px; }

        /* ── PANEL DERECHO ── */
        .reg-right {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 3rem 2rem; overflow-y: auto; position: relative; z-index: 1;
        }

        .reg-right-inner { width: 100%; max-width: 480px; }

        /* Mobile logo */
        .rr-mobile-logo {
          display: flex; align-items: center; justify-content: center; gap: 0.75rem;
          margin-bottom: 2rem;
        }
        .rr-mobile-gem {
          width: 34px; height: 34px; border-radius: 10px;
          background: linear-gradient(135deg, var(--electric-rose), var(--rose-deep));
          display: flex; align-items: center; justify-content: center;
          font-size: 0.9rem; color: #fff;
        }
        .rr-mobile-name {
          font-family: var(--font-display);
          font-size: 1.5rem; font-weight: 500; color: #fff;
        }
        @media (min-width: 1024px) { .rr-mobile-logo { display: none; } }

        /* Header */
        .rr-header { margin-bottom: 1.75rem; }
        .rr-eyebrow {
          font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--electric-rose);
          opacity: 0.9; margin-bottom: 0.5rem;
        }
        .rr-title {
          font-size: 1.75rem; font-weight: 700; color: #fff; line-height: 1.2;
          font-family: var(--font-body);
        }
        .rr-sub { font-size: 0.875rem; color: var(--muted-lavender); margin-top: 0.375rem; opacity: 0.7; }

        /* ── GLASS CARD ── */
        .rr-glass-card {
          background: var(--midnight-card);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 24px;
          padding: 2.5rem 2.25rem;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.03) inset,
            0 32px 80px rgba(0,0,0,0.6),
            0 8px 32px rgba(112,0,255,0.06);
          position: relative;
          overflow: hidden;
        }
        /* Brillo sutil en la esquina superior */
        .rr-glass-card::before {
          content: '';
          position: absolute; width: 200px; height: 200px; border-radius: 50%;
          background: radial-gradient(circle, rgba(112,0,255,0.08) 0%, transparent 70%);
          top: -60px; right: -40px; pointer-events: none;
        }

        /* ── Override stepper para Luxury Dark ── */

        /* Step indicator */
        .rr-glass-card [class*="rounded-full"][class*="flex"][class*="items-center"] {
          box-shadow: none !important;
        }

        /* Inputs */
        .rr-glass-card .input-base {
          background: rgba(255,255,255,0.05) !important;
          border: 1.5px solid rgba(255,255,255,0.08) !important;
          border-radius: 10px !important;
          color: #fff !important;
          font-family: var(--font-body) !important;
          font-size: 0.9375rem !important;
          padding: 0.875rem 1rem !important;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s !important;
        }
        .rr-glass-card .input-base:focus {
          border-color: rgba(112,0,255,0.6) !important;
          background: rgba(255,255,255,0.07) !important;
          box-shadow: 0 0 0 3px rgba(112,0,255,0.1) !important;
        }
        .rr-glass-card .input-base::placeholder { color: rgba(255,255,255,0.2) !important; }
        .rr-glass-card .input-base.border-red-400 { border-color: rgba(255,80,80,0.5) !important; }

        /* Labels */
        .rr-glass-card label { color: var(--muted-lavender) !important; font-size: 0.8125rem !important; font-weight: 500 !important; opacity: 0.9 !important; }

        /* Textos del stepper */
        .rr-glass-card h2 { color: #fff !important; font-family: var(--font-body) !important; font-size: 1.375rem !important; font-weight: 700 !important; }
        .rr-glass-card .font-display { font-family: var(--font-body) !important; }
        .rr-glass-card .text-neutral-800, .rr-glass-card .text-neutral-700 { color: rgba(255,255,255,0.9) !important; }
        .rr-glass-card .text-neutral-600 { color: var(--muted-lavender) !important; }
        .rr-glass-card .text-neutral-500, .rr-glass-card .text-neutral-400 { color: rgba(179,176,194,0.6) !important; }
        .rr-glass-card .text-neutral-300 { color: rgba(255,255,255,0.3) !important; }
        .rr-glass-card .text-red-500 { color: #ff6b6b !important; }

        /* Fondos neutrales */
        .rr-glass-card .bg-neutral-50 { background: rgba(255,255,255,0.04) !important; }
        .rr-glass-card .bg-neutral-100 { background: rgba(255,255,255,0.06) !important; }
        .rr-glass-card .bg-pink-50 { background: rgba(255,45,85,0.07) !important; }

        /* Bordes */
        .rr-glass-card .border-neutral-200 { border-color: rgba(255,255,255,0.08) !important; }
        .rr-glass-card .border-neutral-100 { border-color: rgba(255,255,255,0.05) !important; }
        .rr-glass-card .border-pink-100 { border-color: rgba(255,45,85,0.15) !important; }
        .rr-glass-card .h-px.bg-neutral-200, .rr-glass-card .h-px { background: rgba(255,255,255,0.07) !important; }

        /* Botón primario — gradient Electric Rose */
        .rr-glass-card .btn-primary {
          background: linear-gradient(135deg, var(--electric-rose) 0%, var(--rose-deep) 100%) !important;
          border: none !important;
          border-radius: 10px !important;
          font-family: var(--font-body) !important;
          font-weight: 700 !important;
          font-size: 0.9375rem !important;
          box-shadow: 0 4px 20px rgba(255,45,85,0.35), 0 1px 0 rgba(255,255,255,0.1) inset !important;
          transition: all 0.2s !important;
          letter-spacing: 0.01em !important;
        }
        .rr-glass-card .btn-primary:hover {
          background: linear-gradient(135deg, #ff4d6d 0%, #e8003f 100%) !important;
          box-shadow: 0 6px 28px rgba(255,45,85,0.5), 0 1px 0 rgba(255,255,255,0.1) inset !important;
          transform: translateY(-1px) !important;
        }

        /* Botón secundario (Atrás) */
        .rr-glass-card button[type="button"] {
          background: rgba(255,255,255,0.04) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 10px !important;
          color: rgba(255,255,255,0.55) !important;
          font-family: var(--font-body) !important;
          font-weight: 500 !important;
        }
        .rr-glass-card button[type="button"]:hover {
          background: rgba(255,255,255,0.07) !important;
          color: rgba(255,255,255,0.8) !important;
        }

        /* Hover neutral */
        .rr-glass-card .hover\\:bg-neutral-50:hover { background: rgba(255,255,255,0.05) !important; }
        .rr-glass-card .hover\\:bg-neutral-100:hover { background: rgba(255,255,255,0.07) !important; }

        /* Rounded summary card */
        .rr-glass-card .rounded-2xl { border-radius: 14px !important; }

        /* Step numbers / indicator override */
        .rr-glass-card .w-8.h-8.rounded-full {
          font-family: var(--font-body) !important;
          font-size: 0.8125rem !important;
          font-weight: 700 !important;
        }
        /* Conectores del stepper */
        .rr-glass-card .h-0\\.5 { background: rgba(255,255,255,0.1) !important; }

        /* Acciones rápidas (AppointmentCard dentro del stepper - no aplica aquí pero por si acaso) */

        /* Texto uppercase labels del resumen */
        .rr-glass-card .uppercase { color: rgba(179,176,194,0.5) !important; }

        /* Sparkles icon */
        .rr-glass-card .text-blush { color: var(--electric-rose) !important; }

        /* Bottom link */
        .rr-bottom-link {
          text-align: center; margin-top: 1.75rem;
          font-size: 0.875rem; color: var(--muted-lavender); opacity: 0.6;
          font-family: var(--font-body);
        }
        .rr-bottom-link a {
          color: var(--electric-rose); font-weight: 600; text-decoration: none; opacity: 1;
        }
        .rr-bottom-link a:hover { text-decoration: underline; }
      `}</style>

      <div className="reg-root">
        {/* ── Panel izquierdo ── */}
        <aside className="reg-left">
          <div className="rl-top">
            <div className="rl-logo-row">
              <div className="rl-logo-gem">✦</div>
              <span className="rl-logo-name">BeautySync</span>
            </div>
            <p className="rl-tagline">El salón que trabaja solo</p>
          </div>

          <div className="rl-mid">
            <p className="rl-quote">
              &ldquo;Tu agenda,<br />
              automatizada.<br />
              Tu tiempo, <em>liberado.</em>&rdquo;
            </p>
            <p className="rl-quote-attr">— Diseñado para dueñas de salón</p>
            <div className="rl-benefits">
              {[
                { icon: "◈", title: "Agenda online 24/7", desc: "Sin llamadas ni mensajes de WhatsApp tardíos" },
                { icon: "◉", title: "Recordatorios automáticos", desc: "Cero no-shows. El sistema avisa por ti" },
                { icon: "◎", title: "Dashboard en tiempo real", desc: "Todo bajo control desde cualquier dispositivo" },
                { icon: "◇", title: "Widget para redes sociales", desc: "Comparte el link, tus clientas reservan solas" },
              ].map((b) => (
                <div key={b.title} className="rl-benefit">
                  <div className="rl-benefit-icon">{b.icon}</div>
                  <div>
                    <p className="rl-benefit-title">{b.title}</p>
                    <p className="rl-benefit-desc">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rl-bottom">
            <div className="rl-trial">
              <div className="rl-trial-badge">✨</div>
              <div>
                <p className="rl-trial-title">14 días gratis incluidos</p>
                <p className="rl-trial-sub">Sin tarjeta de crédito · Cancela cuando quieras</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Panel derecho ── */}
        <main className="reg-right">
          <div className="reg-right-inner">
            {/* Mobile logo */}
            <div className="rr-mobile-logo">
              <div className="rr-mobile-gem">✦</div>
              <span className="rr-mobile-name">BeautySync</span>
            </div>

            {/* Header */}
            <div className="rr-header">
              <p className="rr-eyebrow">Crear cuenta</p>
              <h1 className="rr-title">Empieza tu prueba gratuita</h1>
              <p className="rr-sub">3 pasos simples y tu salón estará listo</p>
            </div>

            {/* Glass card con el stepper */}
            <div className="rr-glass-card">
              <RegisterStepper />
            </div>

            <p className="rr-bottom-link">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login">Inicia sesión</Link>
            </p>
          </div>
        </main>
      </div>
    </>
  );
}