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

        /* ── TOKENS Dark Atelier ─────────────────────────────────── */
        .ra-root {
          --bg:          #080706;
          --surface:     #0E0C0B;
          --surface2:    #131110;
          --rose:        #FF2D55;
          --rose-dim:    rgba(255,45,85,0.55);
          --rose-ghost:  rgba(255,45,85,0.08);
          --rose-border: rgba(255,45,85,0.22);
          --border:      rgba(255,255,255,0.055);
          --border-mid:  rgba(255,255,255,0.09);
          --text-primary:rgba(245,242,238,0.9);
          --text-mid:    rgba(245,242,238,0.45);
          --text-dim:    rgba(245,242,238,0.18);
          --serif:       var(--font-cormorant, 'Cormorant Garamond', Georgia, serif);
          --sans:        var(--font-jakarta, 'Plus Jakarta Sans', system-ui, sans-serif);
        }

        /* ── ROOT ────────────────────────────────────────────────── */
        .ra-root {
          min-height: 100vh;
          display: flex;
          background: var(--bg);
          font-family: var(--sans);
          position: relative;
          overflow: hidden;
        }

        /* Radial sutil esquina superior derecha */
        .ra-root::before {
          content: '';
          position: fixed;
          width: 700px; height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,45,85,0.07) 0%, transparent 65%);
          top: -250px; right: -200px;
          pointer-events: none; z-index: 0;
        }
        /* Radial inferior izquierda */
        .ra-root::after {
          content: '';
          position: fixed;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,45,85,0.04) 0%, transparent 65%);
          bottom: -180px; left: -100px;
          pointer-events: none; z-index: 0;
        }

        /* ── PANEL IZQUIERDO ─────────────────────────────────────── */
        .ra-left {
          display: none;
          width: 400px;
          flex-shrink: 0;
          flex-direction: column;
          justify-content: space-between;
          padding: 3.5rem 3rem;
          position: relative;
          z-index: 1;
          border-right: 1px solid var(--border);
        }
        @media (min-width: 1024px) { .ra-left { display: flex; } }

        /* Grid sutil */
        .ra-left::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 56px 56px;
          pointer-events: none;
        }

        /* Top del panel */
        .ra-left-top { position: relative; z-index: 1; }

        .ra-logo-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }
        .ra-logo-box {
          width: 30px; height: 30px;
          border: 1px solid var(--rose-border);
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .ra-logo-box span {
          font-size: 9px; font-weight: 500;
          color: var(--rose);
          letter-spacing: -0.03em;
        }
        .ra-logo-name {
          font-size: 13px;
          color: rgba(245,242,238,0.55);
          letter-spacing: 0.08em;
          font-weight: 400;
          text-transform: uppercase;
        }
        .ra-tagline {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-left: 40px;
        }

        /* Quote central */
        .ra-left-mid { position: relative; z-index: 1; }

        .ra-eyebrow-line-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        .ra-eyebrow-line {
          width: 18px; height: 1px;
          background: var(--rose-dim);
          display: inline-block;
        }
        .ra-eyebrow-text {
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--rose-dim);
        }

        .ra-quote {
          font-family: var(--serif);
          font-size: 2.6rem;
          font-weight: 300;
          font-style: italic;
          line-height: 1.12;
          color: var(--text-primary);
          margin: 0 0 8px;
          letter-spacing: -0.02em;
        }
        .ra-quote em {
          font-style: normal;
          color: var(--rose);
        }
        .ra-quote-attr {
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin: 0 0 36px;
        }

        /* Benefits */
        .ra-benefits {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .ra-benefit {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid var(--border);
        }
        .ra-benefit:last-child { border-bottom: none; }
        .ra-benefit-num {
          font-size: 10px;
          color: var(--rose-dim);
          letter-spacing: 0.1em;
          margin-top: 2px;
          min-width: 20px;
          font-weight: 400;
        }
        .ra-benefit-title {
          font-size: 13px;
          font-weight: 400;
          color: var(--text-primary);
          margin: 0 0 3px;
          line-height: 1.3;
        }
        .ra-benefit-desc {
          font-size: 11px;
          color: var(--text-dim);
          line-height: 1.55;
          margin: 0;
        }

        /* Bottom del panel */
        .ra-left-bottom { position: relative; z-index: 1; }

        .ra-trial-card {
          border: 1px solid var(--border-mid);
          border-radius: 12px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          background: var(--surface);
          position: relative;
          overflow: hidden;
        }
        .ra-trial-card::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, var(--rose-border), transparent);
        }
        .ra-trial-mark {
          width: 36px; height: 36px;
          border: 1px solid var(--rose-border);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          background: var(--rose-ghost);
        }
        .ra-trial-mark-inner {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--rose);
          opacity: 0.7;
        }
        .ra-trial-title {
          font-size: 13px;
          color: var(--text-primary);
          font-weight: 400;
          margin: 0 0 3px;
        }
        .ra-trial-sub {
          font-size: 10px;
          color: var(--text-dim);
          letter-spacing: 0.04em;
          margin: 0;
        }

        /* ── PANEL DERECHO ───────────────────────────────────────── */
        .ra-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          overflow-y: auto;
          position: relative;
          z-index: 1;
        }

        .ra-right-inner {
          width: 100%;
          max-width: 480px;
        }

        /* Mobile logo */
        .ra-mobile-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 2rem;
        }
        @media (min-width: 1024px) { .ra-mobile-logo { display: none; } }

        /* Header */
        .ra-header { margin-bottom: 28px; }
        .ra-header-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        .ra-header-eyebrow span:first-child {
          display: inline-block;
          width: 16px; height: 1px;
          background: var(--rose-dim);
        }
        .ra-header-eyebrow span:last-child {
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--rose-dim);
        }
        .ra-header-h1 {
          font-family: var(--serif);
          font-size: 2.4rem;
          font-weight: 300;
          color: var(--text-primary);
          line-height: 1.1;
          letter-spacing: -0.025em;
          margin: 0 0 8px;
        }
        .ra-header-h1 em {
          font-style: normal;
          color: var(--rose);
        }
        .ra-header-sub {
          font-size: 13px;
          color: var(--text-dim);
          letter-spacing: 0.02em;
          margin: 0;
        }

        /* ── CARD DEL STEPPER ────────────────────────────────────── */
        .ra-stepper-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2rem 2rem;
          position: relative;
          overflow: hidden;
        }
        /* Acento en esquina superior derecha */
        .ra-stepper-card::before {
          content: '';
          position: absolute;
          top: 0; right: 0;
          width: 16px; height: 16px;
          border-top: 1px solid var(--rose-border);
          border-right: 1px solid var(--rose-border);
          border-top-right-radius: 16px;
          pointer-events: none;
        }
        /* Radial sutil interior */
        .ra-stepper-card::after {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,45,85,0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        /* ── OVERRIDES STEPPER (RegisterStepper usa Tailwind) ────── */

        /* Inputs */
        .ra-stepper-card .input-base {
          background: var(--surface2) !important;
          border: 1px solid var(--border-mid) !important;
          border-radius: 8px !important;
          color: var(--text-primary) !important;
          font-family: var(--sans) !important;
          font-size: 14px !important;
          padding: 12px 14px !important;
          transition: border-color 0.2s, background 0.2s !important;
        }
        .ra-stepper-card .input-base:focus {
          border-color: var(--rose-border) !important;
          background: rgba(255,45,85,0.04) !important;
          box-shadow: 0 0 0 3px rgba(255,45,85,0.08) !important;
          outline: none !important;
        }
        .ra-stepper-card .input-base::placeholder {
          color: var(--text-dim) !important;
        }
        .ra-stepper-card .input-base.border-red-400 {
          border-color: rgba(255,80,80,0.45) !important;
        }

        /* Labels */
        .ra-stepper-card label {
          color: var(--text-mid) !important;
          font-size: 11px !important;
          font-weight: 400 !important;
          letter-spacing: 0.06em !important;
          text-transform: uppercase !important;
        }

        /* Títulos h2 del stepper */
        .ra-stepper-card h2 {
          color: var(--text-primary) !important;
          font-family: var(--serif) !important;
          font-size: 1.5rem !important;
          font-weight: 300 !important;
          letter-spacing: -0.02em !important;
        }

        /* Textos de color neutral */
        .ra-stepper-card .text-neutral-800,
        .ra-stepper-card .text-neutral-700 { color: var(--text-primary) !important; }
        .ra-stepper-card .text-neutral-600  { color: var(--text-mid) !important; }
        .ra-stepper-card .text-neutral-500,
        .ra-stepper-card .text-neutral-400  { color: var(--text-dim) !important; }
        .ra-stepper-card .text-neutral-300  { color: rgba(255,255,255,0.2) !important; }
        .ra-stepper-card .text-red-500      { color: rgba(255,100,100,0.9) !important; }
        .ra-stepper-card .text-blush        { color: var(--rose) !important; }

        /* Fondos */
        .ra-stepper-card .bg-neutral-50  { background: rgba(255,255,255,0.025) !important; }
        .ra-stepper-card .bg-neutral-100 { background: rgba(255,255,255,0.04) !important; }
        .ra-stepper-card .bg-pink-50     { background: var(--rose-ghost) !important; }

        /* Bordes */
        .ra-stepper-card .border-neutral-200 { border-color: var(--border) !important; }
        .ra-stepper-card .border-neutral-100 { border-color: var(--border) !important; }
        .ra-stepper-card .border-pink-100   { border-color: var(--rose-border) !important; }
        .ra-stepper-card .h-px,
        .ra-stepper-card .h-px.bg-neutral-200 { background: var(--border) !important; }

        /* Botón primario */
        .ra-stepper-card .btn-primary {
          background: var(--rose-ghost) !important;
          border: 1px solid var(--rose-border) !important;
          border-radius: 8px !important;
          color: var(--rose-dim) !important;
          font-family: var(--sans) !important;
          font-weight: 400 !important;
          font-size: 12px !important;
          letter-spacing: 0.1em !important;
          text-transform: uppercase !important;
          box-shadow: none !important;
          transition: all 0.2s !important;
        }
        .ra-stepper-card .btn-primary:hover {
          background: rgba(255,45,85,0.16) !important;
          border-color: rgba(255,45,85,0.42) !important;
          color: var(--rose) !important;
          transform: none !important;
          box-shadow: none !important;
        }

        /* Botón secundario (Atrás) */
        .ra-stepper-card button[type="button"] {
          background: transparent !important;
          border: 1px solid var(--border-mid) !important;
          border-radius: 8px !important;
          color: var(--text-dim) !important;
          font-family: var(--sans) !important;
          font-weight: 400 !important;
          font-size: 12px !important;
          letter-spacing: 0.06em !important;
          transition: all 0.2s !important;
        }
        .ra-stepper-card button[type="button"]:hover {
          border-color: var(--border-mid) !important;
          color: var(--text-mid) !important;
          background: rgba(255,255,255,0.03) !important;
        }

        /* Hovers neutrales */
        .ra-stepper-card .hover\\:bg-neutral-50:hover  { background: rgba(255,255,255,0.03) !important; }
        .ra-stepper-card .hover\\:bg-neutral-100:hover { background: rgba(255,255,255,0.05) !important; }

        /* Step indicator: círculos numerados */
        .ra-stepper-card .w-8.h-8.rounded-full {
          font-family: var(--sans) !important;
          font-size: 11px !important;
          font-weight: 400 !important;
          letter-spacing: 0.05em !important;
        }

        /* Conector del stepper */
        .ra-stepper-card .h-0\\.5 { background: var(--border) !important; }

        /* Summary card interior */
        .ra-stepper-card .rounded-2xl { border-radius: 10px !important; }

        /* Labels uppercase del resumen */
        .ra-stepper-card .uppercase { color: var(--text-dim) !important; }

        /* Font-display override */
        .ra-stepper-card .font-display { font-family: var(--serif) !important; }

        /* ── BOTTOM LINK ─────────────────────────────────────────── */
        .ra-bottom-link {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: var(--text-dim);
          letter-spacing: 0.04em;
        }
        .ra-bottom-link a {
          color: var(--rose-dim);
          font-weight: 400;
          text-decoration: none;
          transition: color 0.2s;
        }
        .ra-bottom-link a:hover { color: var(--rose); }

      `}</style>

      <div className="ra-root">
        {/* ── Panel izquierdo ─────────────────────────────────────── */}
        <aside className="ra-left">
          <div className="ra-left-top">
            <div className="ra-logo-row">
              <div className="ra-logo-box">
                <span>BS</span>
              </div>
              <span className="ra-logo-name">BeautySync</span>
            </div>
            <p className="ra-tagline">El salón que trabaja solo</p>
          </div>

          <div className="ra-left-mid">
            <div className="ra-eyebrow-line-wrap">
              <span className="ra-eyebrow-line" />
              <span className="ra-eyebrow-text">Por qué elegirnos</span>
            </div>
            <p className="ra-quote">
              &ldquo;Tu agenda,
              <br />
              automatizada.
              <br />
              Tu tiempo, <em>liberado.</em>&rdquo;
            </p>
            <p className="ra-quote-attr">— Diseñado para dueñas de salón</p>

            <div className="ra-benefits">
              {[
                {
                  n: "01",
                  title: "Agenda online 24/7",
                  desc: "Sin llamadas ni mensajes de WhatsApp tardíos",
                },
                {
                  n: "02",
                  title: "Recordatorios automáticos",
                  desc: "Cero no-shows. El sistema avisa por ti",
                },
                {
                  n: "03",
                  title: "Dashboard en tiempo real",
                  desc: "Todo bajo control desde cualquier dispositivo",
                },
                {
                  n: "04",
                  title: "Widget para redes sociales",
                  desc: "Comparte el link, tus clientas reservan solas",
                },
              ].map((b) => (
                <div key={b.n} className="ra-benefit">
                  <span className="ra-benefit-num">{b.n}</span>
                  <div>
                    <p className="ra-benefit-title">{b.title}</p>
                    <p className="ra-benefit-desc">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ra-left-bottom">
            <div className="ra-trial-card">
              <div className="ra-trial-mark">
                <div className="ra-trial-mark-inner" />
              </div>
              <div>
                <p className="ra-trial-title">14 días gratis incluidos</p>
                <p className="ra-trial-sub">
                  Sin tarjeta de crédito · Cancela cuando quieras
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Panel derecho ────────────────────────────────────────── */}
        <main className="ra-right">
          <div className="ra-right-inner">
            {/* Mobile logo */}
            <div className="ra-mobile-logo">
              <div className="ra-logo-box">
                <span>BS</span>
              </div>
              <span className="ra-logo-name">BeautySync</span>
            </div>

            {/* Header */}
            <div className="ra-header">
              <div className="ra-header-eyebrow">
                <span />
                <span>Crear cuenta</span>
              </div>
              <h1 className="ra-header-h1">
                Empieza tu
                <br />
                <em>prueba gratuita.</em>
              </h1>
              <p className="ra-header-sub">
                3 pasos simples y tu salón estará listo
              </p>
            </div>

            {/* Stepper envuelto en la card */}
            <div className="ra-stepper-card">
              <RegisterStepper />
            </div>

            <p className="ra-bottom-link">
              ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
