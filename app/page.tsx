import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BeautySync — El salón que trabaja solo",
  description:
    "Automatiza la agenda de tu salón de belleza. Citas online 24/7, recordatorios automáticos y métricas reales para que tú te enfoques en lo que amas.",
};

export default function LandingPage() {
  return (
    <main className="bs-landing">
      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav className="bs-nav">
        <div className="bs-nav-logo">
          <div className="bs-logo-box">
            <span>BS</span>
          </div>
          <span className="bs-logo-name">BeautySync</span>
        </div>
        <div className="bs-nav-links">
          <a href="#features">Funciones</a>
          <a href="#how">Cómo funciona</a>
          <a href="#pricing">Precios</a>
        </div>
        <div className="bs-nav-right">
          <Link href="/login" className="bs-nav-login">
            Iniciar sesión
          </Link>
          <Link href="/register" className="bs-btn-nav">
            Prueba gratis
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="bs-hero">
        {/* Fondo con ruido y acento radial */}
        <div className="bs-hero-bg" aria-hidden="true">
          <div className="bs-radial-1" />
          <div className="bs-radial-2" />
          <div className="bs-noise" />
          <div className="bs-grid" />
        </div>

        <div className="bs-hero-inner">
          {/* Columna izquierda */}
          <div className="bs-hero-left">
            <div className="bs-hero-eyebrow">
              <span className="bs-eyebrow-line" />
              Para salones en El Salvador
            </div>

            <h1 className="bs-hero-h1">
              Tu salón,
              <br />
              en{" "}
              <em>
                piloto
                <br />
                automático.
              </em>
            </h1>

            <p className="bs-hero-p">
              Citas agendadas solas. Recordatorios que llegan solos. Clientas
              que vuelven. Tú, enfocada en lo que haces mejor — no en el
              teléfono.
            </p>

            <div className="bs-hero-actions">
              <Link href="/register" className="bs-btn-primary">
                Empezar gratis — 14 días
              </Link>
              <a href="#how" className="bs-btn-ghost">
                Ver cómo funciona <span className="bs-arrow">→</span>
              </a>
            </div>

            <div className="bs-social-proof">
              <div className="bs-avatars">
                {["V", "S", "A", "L", "K"].map((l) => (
                  <div key={l} className="bs-avatar-bubble">
                    {l}
                  </div>
                ))}
              </div>
              <p>+500 salones ya automatizaron su agenda</p>
            </div>
          </div>

          {/* Columna derecha — widget mockup */}
          <div className="bs-hero-right">
            <div className="bs-mockup-wrap">
              <div className="bs-mockup-corner" aria-hidden="true" />
              <div className="bs-mockup-topbar">
                <span className="bs-mock-dot" />
                <span className="bs-mock-dot" />
                <span className="bs-mock-dot" />
              </div>
              <div className="bs-mockup-body">
                <div className="bs-mock-label">
                  Salón Lumière — Agendar cita
                </div>

                {/* Selector de días */}
                <div className="bs-mock-days">
                  {[
                    { n: "28", d: "Lun" },
                    { n: "29", d: "Mar" },
                    { n: "30", d: "Mié", active: true },
                    { n: "01", d: "Jue" },
                    { n: "02", d: "Vie" },
                    { n: "03", d: "Sáb" },
                  ].map((day) => (
                    <div
                      key={day.n}
                      className={`bs-mock-day${day.active ? " active" : ""}`}
                    >
                      <span className="bs-mock-day-n">{day.n}</span>
                      <span className="bs-mock-day-d">{day.d}</span>
                    </div>
                  ))}
                </div>

                {/* Slots de hora */}
                <div className="bs-mock-slots">
                  {[
                    { t: "9:00", s: "taken" },
                    { t: "9:30", s: "taken" },
                    { t: "10:00", s: "active" },
                    { t: "10:30", s: "" },
                    { t: "11:00", s: "" },
                    { t: "11:30", s: "taken" },
                  ].map((slot) => (
                    <div
                      key={slot.t}
                      className={`bs-mock-slot${slot.s ? ` ${slot.s}` : ""}`}
                    >
                      {slot.t}
                    </div>
                  ))}
                </div>

                {/* Servicio seleccionado */}
                <div className="bs-mock-service">
                  <span className="bs-mock-svc-name">Corte + tinte</span>
                  <span className="bs-mock-svc-price">$35.00</span>
                </div>

                {/* Botón confirmar */}
                <div className="bs-mock-confirm">Confirmar cita</div>
              </div>

              {/* Live indicator */}
              <div className="bs-live-pill">
                <span className="bs-live-dot" />
                Disponible 24h
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BELT ──────────────────────────────────────────────── */}
      <section className="bs-stats">
        <div className="bs-stats-inner">
          {[
            { n: "80", u: "%", desc: "Menos tiempo gestionando citas a mano" },
            { n: "0", u: "", desc: "Citas perdidas por falta de recordatorio" },
            {
              n: "24",
              u: "h",
              desc: "Tu salón acepta citas incluso cuando cierras",
            },
          ].map((s) => (
            <div key={s.n} className="bs-stat-block">
              <div className="bs-stat-number">
                <span className="bs-stat-n">{s.n}</span>
                {s.u && <span className="bs-stat-u">{s.u}</span>}
              </div>
              <p className="bs-stat-desc">{s.desc}</p>
              <div className="bs-stat-line" />
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
      <section className="bs-how" id="how">
        <div className="bs-section-inner">
          <div className="bs-section-eyebrow">
            <span className="bs-eyebrow-line" />
            Cómo funciona
          </div>
          <h2 className="bs-section-h2">
            Listo en <em>minutos.</em>
            <br />
            Funcionando para siempre.
          </h2>
          <p className="bs-section-p">
            Sin configuraciones complicadas. Sin tecnicismos. Solo tu salón
            digitalizado y corriendo desde el primer día.
          </p>

          <div className="bs-how-grid">
            {[
              {
                n: "01",
                title: "Crea tu cuenta",
                body: "Regístrate con tu email. En 2 minutos tienes tu panel listo. No necesitas tarjeta de crédito para empezar.",
              },
              {
                n: "02",
                title: "Configura tus servicios",
                body: "Agrega los servicios que ofreces, precios y duración. Tu horario de atención. Listo.",
              },
              {
                n: "03",
                title: "Comparte tu link",
                body: "Tu salón recibe un link único. Ponlo en tu bio de Instagram, WhatsApp o donde tus clientas te encuentren.",
              },
              {
                n: "04",
                title: "Las citas llegan solas",
                body: "Tus clientas agendan, reciben confirmación y recordatorio automático. Tú solo apareces a trabajar.",
              },
            ].map((step) => (
              <div key={step.n} className="bs-how-cell">
                <div className="bs-how-n">{step.n}</div>
                <div className="bs-how-title">{step.title}</div>
                <div className="bs-how-body">{step.body}</div>
                <div className="bs-how-bar" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIVIDER ─────────────────────────────────────────────────── */}
      <div className="bs-divider" />

      {/* ── FEATURES ────────────────────────────────────────────────── */}
      <section className="bs-features" id="features">
        <div className="bs-section-inner">
          <div className="bs-section-eyebrow">
            <span className="bs-eyebrow-line" />
            Lo que incluye
          </div>
          <h2 className="bs-section-h2">
            Todo lo que tu salón
            <br />
            necesita. <em>Nada más.</em>
          </h2>

          <div className="bs-feat-list">
            {[
              {
                n: "01",
                name: "Widget de reserva pública",
                desc: "Tus clientas eligen servicio, día y hora desde tu link personalizado. Sin llamadas. Sin mensajes de WhatsApp preguntando disponibilidad. El sistema valida en tiempo real que el horario esté libre.",
                tag: "Disponible 24h",
              },
              {
                n: "02",
                name: "Recordatorios automáticos",
                desc: "24 horas antes de cada cita, tu clienta recibe un email de recordatorio. Menos no-shows. Menos tiempo persiguiendo confirmaciones.",
                tag: "Email automático",
              },
              {
                n: "03",
                name: "Dashboard de métricas",
                desc: "Cuántas citas tuviste este mes, cuánto ingresaste, cuáles son tus servicios más solicitados, qué clientas volvieron. Tu negocio en números reales.",
                tag: "Solo Plan Pro",
              },
              {
                n: "04",
                name: "Tu marca, tu identidad",
                desc: "Logo propio, color de marca, nombre del salón. Tus clientas ven un sistema profesional que parece tuyo — no una app genérica de terceros.",
                tag: "Solo Plan Pro",
              },
            ].map((feat) => (
              <div key={feat.n} className="bs-feat-item">
                <div className="bs-feat-left">
                  <div className="bs-feat-n">{feat.n}</div>
                  <div className="bs-feat-name">{feat.name}</div>
                </div>
                <div className="bs-feat-right">
                  <p className="bs-feat-desc">{feat.desc}</p>
                  <span className="bs-feat-tag">{feat.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIVIDER ─────────────────────────────────────────────────── */}
      <div className="bs-divider" />

      {/* ── TESTIMONIALS ────────────────────────────────────────────── */}
      <section className="bs-testimonials">
        <div className="bs-section-inner">
          <div className="bs-section-eyebrow">
            <span className="bs-eyebrow-line" />
            Salones que ya usan BeautySync
          </div>
          <h2 className="bs-section-h2">
            Lo que dicen
            <br />
            las que ya <em>automatizaron.</em>
          </h2>

          <div className="bs-t-grid">
            {[
              {
                quote:
                  "Antes pasaba media hora al día confirmando citas por WhatsApp. Ahora mis clientas llegan y ya saben su hora. Yo no hice nada.",
                name: "María González",
                salon: "Salón Lumière, San Salvador",
              },
              {
                quote:
                  "El widget en mi bio de Instagram cambió todo. Mis clientas agendan a las 10 de la noche cuando yo ya estoy dormida.",
                name: "Sofía Castro",
                salon: "Studio SC, Santa Tecla",
              },
              {
                quote:
                  "Los recordatorios automáticos redujeron mis cancelaciones a casi cero. Ya no tengo que perseguir a nadie por WhatsApp.",
                name: "Andrea López",
                salon: "Nails & Co., San Miguel",
              },
            ].map((t) => (
              <div key={t.name} className="bs-t-card">
                <div className="bs-t-quote-mark">&ldquo;</div>
                <p className="bs-t-quote">{t.quote}</p>
                <div className="bs-t-bottom">
                  <div className="bs-t-avatar">{t.name[0]}</div>
                  <div>
                    <div className="bs-t-name">{t.name}</div>
                    <div className="bs-t-salon">{t.salon}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIVIDER ─────────────────────────────────────────────────── */}
      <div className="bs-divider" />

      {/* ── PRICING ─────────────────────────────────────────────────── */}
      <section className="bs-pricing" id="pricing">
        <div className="bs-section-inner">
          <div className="bs-section-eyebrow">
            <span className="bs-eyebrow-line" />
            Precios
          </div>
          <h2 className="bs-section-h2">
            Simple.
            <br />
            <em>Sin sorpresas.</em>
          </h2>
          <p className="bs-section-p">
            14 días de prueba gratuita en cualquier plan. Sin tarjeta de crédito
            para empezar.
          </p>

          <div className="bs-pricing-grid">
            {/* Plan Basic */}
            <div className="bs-plan-card">
              <div className="bs-plan-name">Basic</div>
              <div className="bs-plan-price">
                <span className="bs-plan-currency">$</span>
                <span className="bs-plan-amount">19</span>
              </div>
              <div className="bs-plan-period">por mes</div>
              <div className="bs-plan-divider" />
              <ul className="bs-plan-features">
                {[
                  "Widget de reserva pública",
                  "Recordatorios automáticos",
                  "Configuración de horarios",
                  "Hasta 5 servicios",
                  "Soporte por email",
                ].map((f) => (
                  <li key={f} className="bs-plan-feat">
                    <span className="bs-feat-dot" />
                    {f}
                  </li>
                ))}
                {["Dashboard de métricas", "Personalización de marca"].map(
                  (f) => (
                    <li key={f} className="bs-plan-feat dim">
                      <span className="bs-feat-dot" />
                      {f}
                    </li>
                  ),
                )}
              </ul>
              <Link href="/register" className="bs-plan-cta ghost">
                Empezar prueba gratis
              </Link>
              <p className="bs-plan-trial">14 días gratis, sin tarjeta</p>
            </div>

            {/* Plan Pro */}
            <div className="bs-plan-card featured">
              <div className="bs-plan-corner" aria-hidden="true" />
              <div className="bs-plan-badge">Más popular</div>
              <div className="bs-plan-name">Pro</div>
              <div className="bs-plan-price">
                <span className="bs-plan-currency">$</span>
                <span className="bs-plan-amount">39</span>
              </div>
              <div className="bs-plan-period">por mes</div>
              <div className="bs-plan-divider" />
              <ul className="bs-plan-features">
                {[
                  "Widget de reserva pública",
                  "Recordatorios automáticos",
                  "Configuración de horarios",
                  "Servicios ilimitados",
                  "Dashboard de métricas completo",
                  "Logo y color de marca",
                  "Exportación de reportes PDF",
                ].map((f) => (
                  <li key={f} className="bs-plan-feat">
                    <span className="bs-feat-dot" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="bs-plan-cta">
                Empezar prueba gratis
              </Link>
              <p className="bs-plan-trial">14 días gratis, sin tarjeta</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────── */}
      <section className="bs-cta-final">
        <div className="bs-cta-bg" aria-hidden="true">
          <div className="bs-cta-radial" />
          <div className="bs-noise" />
        </div>
        <div className="bs-cta-inner">
          <h2 className="bs-cta-h2">
            Tu salón merece
            <br />
            trabajar <em>por ti.</em>
          </h2>
          <p className="bs-cta-p">
            14 días gratis. Sin tarjeta de crédito. Sin compromiso. Solo tu
            salón funcionando mejor desde el primer día.
          </p>
          <div className="bs-cta-actions">
            <Link href="/register" className="bs-btn-primary large">
              Empezar gratis ahora
            </Link>
            <a href="#how" className="bs-btn-ghost">
              Ver cómo funciona <span className="bs-arrow">→</span>
            </a>
          </div>
          <p className="bs-cta-note">
            beautysyncsv.com · Hecho para El Salvador
          </p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="bs-footer">
        <div className="bs-footer-inner">
          <div className="bs-footer-brand">
            <div className="bs-footer-logo-wrap">
              <div className="bs-logo-box sm">
                <span>BS</span>
              </div>
              <span className="bs-footer-logo-name">BeautySync</span>
            </div>
            <p className="bs-footer-tagline">El salón que trabaja solo.</p>
          </div>
          <div className="bs-footer-links">
            <a href="#features">Funciones</a>
            <a href="#pricing">Precios</a>
            <Link href="/login">Iniciar sesión</Link>
            <Link href="/register">Registro</Link>
          </div>
        </div>
        <div className="bs-footer-bottom">
          <p>© 2026 BeautySync · Todos los derechos reservados</p>
        </div>
      </footer>

      {/* ── ESTILOS ─────────────────────────────────────────────────── */}
      <style>{`

        /* ── Reset & base ─────────────────────────────────────────── */
        .bs-landing {
          font-family: var(--font-jakarta, 'Plus Jakarta Sans', sans-serif);
          background: #080706;
          color: rgba(245,242,238,0.9);
          overflow-x: hidden;
        }

        /* ── Variables ────────────────────────────────────────────── */
        .bs-landing {
          --rose: #FF2D55;
          --rose-dim: rgba(255,45,85,0.55);
          --rose-ghost: rgba(255,45,85,0.08);
          --rose-border: rgba(255,45,85,0.22);
          --bg: #080706;
          --surface: #0E0C0B;
          --surface2: #131110;
          --border: rgba(255,255,255,0.055);
          --text-primary: rgba(245,242,238,0.9);
          --text-mid: rgba(245,242,238,0.45);
          --text-dim: rgba(245,242,238,0.18);
          --serif: var(--font-cormorant, 'Cormorant Garamond', Georgia, serif);
          --sans: var(--font-jakarta, 'Plus Jakarta Sans', sans-serif);
        }

        /* ── NAV ──────────────────────────────────────────────────── */
        .bs-nav {
          display: flex;
          align-items: center;
          padding: 18px 5vw;
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          background: rgba(8,7,6,0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 100;
        }
        .bs-nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .bs-logo-box {
          width: 28px;
          height: 28px;
          border: 1px solid var(--rose-border);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .bs-logo-box.sm {
          width: 22px;
          height: 22px;
          border-radius: 5px;
        }
        .bs-logo-box span {
          font-size: 9px;
          font-weight: 700;
          color: var(--rose);
          letter-spacing: -0.03em;
          font-family: var(--sans);
        }
        .bs-logo-name {
          font-size: 13px;
          color: rgba(245,242,238,0.6);
          letter-spacing: 0.07em;
          font-weight: 400;
          text-transform: uppercase;
        }
        .bs-nav-links {
          display: flex;
          gap: 28px;
          margin-left: 40px;
        }
        .bs-nav-links a {
          font-size: 11px;
          color: var(--text-dim);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 0.2s;
        }
        .bs-nav-links a:hover { color: var(--text-mid); }
        .bs-nav-right {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-left: auto;
        }
        .bs-nav-login {
          font-size: 11px;
          color: var(--text-dim);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 0.2s;
        }
        .bs-nav-login:hover { color: var(--text-mid); }
        .bs-btn-nav {
          background: var(--rose-ghost);
          border: 1px solid var(--rose-border);
          border-radius: 7px;
          padding: 8px 18px;
          font-size: 11px;
          color: var(--rose-dim);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.2s;
          font-family: var(--sans);
        }
        .bs-btn-nav:hover {
          background: rgba(255,45,85,0.15);
          border-color: rgba(255,45,85,0.42);
          color: var(--rose);
        }

        @media (max-width: 680px) {
          .bs-nav-links { display: none; }
          .bs-nav-login { display: none; }
        }

        /* ── HERO ─────────────────────────────────────────────────── */
        .bs-hero {
          position: relative;
          overflow: hidden;
          padding: 90px 5vw 80px;
        }
        .bs-hero-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .bs-radial-1 {
          position: absolute;
          width: 600px;
          height: 600px;
          top: -200px;
          right: -100px;
          background: radial-gradient(circle, rgba(255,45,85,0.12) 0%, transparent 70%);
          border-radius: 50%;
        }
        .bs-radial-2 {
          position: absolute;
          width: 400px;
          height: 400px;
          bottom: -100px;
          left: 5%;
          background: radial-gradient(circle, rgba(255,45,85,0.05) 0%, transparent 70%);
          border-radius: 50%;
        }
        .bs-noise {
          position: absolute;
          inset: 0;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 200px 200px;
        }
        .bs-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 64px 64px;
        }
        .bs-hero-inner {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 60px;
          align-items: start;
          max-width: 1100px;
          margin: 0 auto;
        }
        .bs-hero-eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--rose-dim);
          margin-bottom: 28px;
        }
        .bs-eyebrow-line {
          display: inline-block;
          width: 18px;
          height: 1px;
          background: var(--rose-dim);
          flex-shrink: 0;
        }
        .bs-hero-h1 {
          font-family: var(--serif);
          font-size: clamp(3rem, 5.5vw, 5.5rem);
          font-weight: 300;
          line-height: 1.04;
          letter-spacing: -0.035em;
          color: var(--text-primary);
          margin: 0 0 22px;
        }
        .bs-hero-h1 em {
          font-style: normal;
          color: var(--rose);
        }
        .bs-hero-p {
          font-size: 15px;
          color: var(--text-mid);
          line-height: 1.78;
          max-width: 440px;
          margin: 0 0 36px;
          font-weight: 300;
        }
        .bs-hero-actions {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 40px;
        }
        .bs-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--rose-ghost);
          border: 1px solid var(--rose-border);
          border-radius: 8px;
          padding: 13px 26px;
          font-size: 12px;
          color: var(--rose-dim);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.25s;
          font-family: var(--sans);
          white-space: nowrap;
        }
        .bs-btn-primary:hover {
          background: rgba(255,45,85,0.16);
          color: var(--rose);
          border-color: rgba(255,45,85,0.45);
        }
        .bs-btn-primary.large {
          padding: 15px 32px;
          font-size: 13px;
        }
        .bs-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-dim);
          letter-spacing: 0.06em;
          text-decoration: none;
          transition: color 0.2s;
        }
        .bs-btn-ghost:hover { color: var(--text-mid); }
        .bs-arrow { transition: transform 0.2s; }
        .bs-btn-ghost:hover .bs-arrow { transform: translateX(3px); }
        .bs-social-proof {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .bs-social-proof p {
          font-size: 11px;
          color: var(--text-dim);
          letter-spacing: 0.04em;
        }
        .bs-avatars {
          display: flex;
        }
        .bs-avatar-bubble {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--rose-ghost);
          border: 1.5px solid var(--surface);
          color: var(--rose-dim);
          font-size: 10px;
          font-weight: 400;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: -8px;
          outline: 1.5px solid var(--rose-border);
        }
        .bs-avatar-bubble:first-child { margin-left: 0; }

        /* ── HERO MOCKUP ──────────────────────────────────────────── */
        .bs-hero-right {
          padding-top: 10px;
        }
        .bs-mockup-wrap {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: visible;
          position: relative;
          animation: bs-float 5s ease-in-out infinite;
        }
        @keyframes bs-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .bs-mockup-corner {
          position: absolute;
          top: 0;
          right: 0;
          width: 16px;
          height: 16px;
          border-top: 1px solid var(--rose-border);
          border-right: 1px solid var(--rose-border);
          border-top-right-radius: 14px;
          pointer-events: none;
        }
        .bs-mockup-topbar {
          background: var(--surface2);
          border-bottom: 1px solid var(--border);
          padding: 11px 14px;
          display: flex;
          align-items: center;
          gap: 6px;
          border-radius: 14px 14px 0 0;
        }
        .bs-mock-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          display: inline-block;
        }
        .bs-mockup-body {
          padding: 18px;
        }
        .bs-mock-label {
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 14px;
        }
        .bs-mock-days {
          display: flex;
          gap: 5px;
          margin-bottom: 14px;
        }
        .bs-mock-day {
          flex: 1;
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 7px 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .bs-mock-day.active {
          border-color: var(--rose-border);
          background: var(--rose-ghost);
        }
        .bs-mock-day-n {
          font-size: 11px;
          color: var(--text-mid);
          font-family: var(--serif);
        }
        .bs-mock-day.active .bs-mock-day-n { color: var(--rose); }
        .bs-mock-day-d {
          font-size: 7px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-dim);
        }
        .bs-mock-slots {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5px;
          margin-bottom: 14px;
        }
        .bs-mock-slot {
          border: 1px solid var(--border);
          border-radius: 5px;
          padding: 7px 8px;
          font-size: 10px;
          color: var(--text-dim);
          text-align: center;
          cursor: pointer;
          transition: all 0.15s;
        }
        .bs-mock-slot.taken {
          opacity: 0.3;
          cursor: default;
          text-decoration: line-through;
        }
        .bs-mock-slot.active {
          border-color: var(--rose-border);
          background: var(--rose-ghost);
          color: var(--rose);
        }
        .bs-mock-service {
          border: 1px solid var(--rose-border);
          border-radius: 7px;
          padding: 9px 11px;
          background: var(--rose-ghost);
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .bs-mock-svc-name {
          font-size: 11px;
          color: rgba(255,45,85,0.75);
        }
        .bs-mock-svc-price {
          font-size: 11px;
          color: var(--rose);
          font-family: var(--serif);
        }
        .bs-mock-confirm {
          background: rgba(255,45,85,0.14);
          border: 1px solid var(--rose-border);
          border-radius: 6px;
          padding: 9px;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--rose-dim);
          text-align: center;
          cursor: pointer;
        }
        .bs-live-pill {
          position: absolute;
          bottom: -16px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 5px 14px;
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          color: var(--text-dim);
          letter-spacing: 0.08em;
          white-space: nowrap;
        }
        .bs-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          display: inline-block;
          animation: bs-pulse 1.8s infinite;
        }
        @keyframes bs-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }

        @media (max-width: 860px) {
          .bs-hero-inner {
            grid-template-columns: 1fr;
          }
          .bs-hero-right { display: none; }
        }

        /* ── STATS ────────────────────────────────────────────────── */
        .bs-stats {
          background: var(--surface);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          margin-top: 32px;
        }
        .bs-stats-inner {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          max-width: 1100px;
          margin: 0 auto;
        }
        .bs-stat-block {
          padding: 44px 40px;
          border-right: 1px solid var(--border);
          position: relative;
        }
        .bs-stat-block:last-child { border-right: none; }
        .bs-stat-number {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 10px;
        }
        .bs-stat-n {
          font-size: 56px;
          font-weight: 300;
          font-family: var(--serif);
          color: var(--text-primary);
          line-height: 1;
          letter-spacing: -0.04em;
        }
        .bs-stat-u {
          font-size: 28px;
          color: var(--rose);
          font-family: var(--serif);
          line-height: 1;
        }
        .bs-stat-desc {
          font-size: 11px;
          color: var(--text-dim);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          line-height: 1.6;
          max-width: 180px;
          margin: 0;
        }
        .bs-stat-line {
          position: absolute;
          bottom: 0;
          left: 40px;
          width: 32px;
          height: 1px;
          background: var(--rose-border);
        }

        @media (max-width: 640px) {
          .bs-stats-inner {
            grid-template-columns: 1fr;
          }
          .bs-stat-block {
            border-right: none;
            border-bottom: 1px solid var(--border);
            padding: 32px 24px;
          }
          .bs-stat-block:last-child { border-bottom: none; }
        }

        /* ── SECTION COMMONS ──────────────────────────────────────── */
        .bs-section-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 80px 5vw;
        }
        .bs-section-eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--rose-dim);
          margin-bottom: 18px;
        }
        .bs-section-h2 {
          font-family: var(--serif);
          font-size: clamp(2rem, 4vw, 3.5rem);
          font-weight: 300;
          line-height: 1.1;
          letter-spacing: -0.025em;
          color: var(--text-primary);
          margin: 0 0 16px;
        }
        .bs-section-h2 em {
          font-style: normal;
          color: var(--rose);
        }
        .bs-section-p {
          font-size: 14px;
          color: var(--text-mid);
          line-height: 1.78;
          max-width: 500px;
          margin: 0 0 48px;
          font-weight: 300;
        }

        /* ── HOW IT WORKS ─────────────────────────────────────────── */
        .bs-how {
          background: var(--surface);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .bs-how-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
        }
        .bs-how-cell {
          background: var(--surface);
          padding: 34px 30px;
          position: relative;
          overflow: hidden;
          transition: background 0.2s;
        }
        .bs-how-cell:hover { background: var(--surface2); }
        .bs-how-n {
          font-size: 11px;
          color: var(--rose-dim);
          letter-spacing: 0.12em;
          margin-bottom: 16px;
          font-weight: 400;
        }
        .bs-how-title {
          font-size: 17px;
          font-weight: 400;
          font-family: var(--serif);
          color: var(--text-primary);
          margin-bottom: 8px;
          letter-spacing: -0.01em;
        }
        .bs-how-body {
          font-size: 13px;
          color: var(--text-mid);
          line-height: 1.72;
          font-weight: 300;
        }
        .bs-how-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 1px;
          background: rgba(255,45,85,0.45);
          width: 0;
          transition: width 0.4s ease;
        }
        .bs-how-cell:hover .bs-how-bar { width: 100%; }

        @media (max-width: 640px) {
          .bs-how-grid { grid-template-columns: 1fr; }
        }

        /* ── DIVIDER ──────────────────────────────────────────────── */
        .bs-divider {
          height: 1px;
          background: var(--border);
          max-width: 1100px;
          margin: 0 auto;
        }

        /* ── FEATURES ─────────────────────────────────────────────── */
        .bs-feat-list {
          display: flex;
          flex-direction: column;
          gap: 1px;
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
        }
        .bs-feat-item {
          background: var(--surface);
          padding: 30px 34px;
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 48px;
          align-items: start;
          border-bottom: 1px solid var(--border);
          transition: background 0.2s;
        }
        .bs-feat-item:last-child { border-bottom: none; }
        .bs-feat-item:hover { background: var(--surface2); }
        .bs-feat-n {
          font-size: 10px;
          color: var(--rose-dim);
          letter-spacing: 0.12em;
          margin-bottom: 10px;
          font-weight: 400;
        }
        .bs-feat-name {
          font-size: 16px;
          font-family: var(--serif);
          font-weight: 400;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          line-height: 1.3;
        }
        .bs-feat-desc {
          font-size: 13px;
          color: var(--text-mid);
          line-height: 1.75;
          font-weight: 300;
          margin: 0 0 12px;
        }
        .bs-feat-tag {
          display: inline-block;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--rose-dim);
          border: 1px solid var(--rose-border);
          border-radius: 20px;
          padding: 3px 10px;
        }

        @media (max-width: 680px) {
          .bs-feat-item {
            grid-template-columns: 1fr;
            gap: 16px;
            padding: 24px;
          }
        }

        /* ── TESTIMONIALS ─────────────────────────────────────────── */
        .bs-testimonials {
          background: var(--surface);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .bs-t-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .bs-t-card {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: border-color 0.2s;
        }
        .bs-t-card:hover { border-color: rgba(255,255,255,0.1); }
        .bs-t-quote-mark {
          font-family: var(--serif);
          font-size: 40px;
          line-height: 0.8;
          color: var(--rose-dim);
        }
        .bs-t-quote {
          font-size: 14px;
          font-family: var(--serif);
          font-weight: 300;
          color: var(--text-primary);
          line-height: 1.65;
          flex: 1;
          margin: 0;
        }
        .bs-t-bottom {
          display: flex;
          align-items: center;
          gap: 10px;
          border-top: 1px solid var(--border);
          padding-top: 16px;
        }
        .bs-t-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--rose-ghost);
          border: 1px solid var(--rose-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 400;
          color: var(--rose-dim);
          flex-shrink: 0;
        }
        .bs-t-name {
          font-size: 12px;
          color: var(--text-mid);
          font-weight: 400;
        }
        .bs-t-salon {
          font-size: 10px;
          color: var(--text-dim);
          letter-spacing: 0.04em;
        }

        @media (max-width: 860px) {
          .bs-t-grid { grid-template-columns: 1fr; }
        }

        /* ── PRICING ──────────────────────────────────────────────── */
        .bs-pricing .bs-section-inner {
          padding-bottom: 100px;
        }
        .bs-pricing-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          max-width: 740px;
        }
        .bs-plan-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          gap: 0;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .bs-plan-card.featured {
          border-color: var(--rose-border);
        }
        .bs-plan-card.featured::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 100px;
          height: 100px;
          background: radial-gradient(circle at top right, rgba(255,45,85,0.07), transparent 70%);
          pointer-events: none;
        }
        .bs-plan-corner {
          position: absolute;
          top: 0;
          right: 0;
          width: 16px;
          height: 16px;
          border-top: 1px solid var(--rose-border);
          border-right: 1px solid var(--rose-border);
          border-top-right-radius: 14px;
        }
        .bs-plan-badge {
          display: inline-block;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--rose-dim);
          border: 1px solid var(--rose-border);
          border-radius: 20px;
          padding: 3px 10px;
          background: var(--rose-ghost);
          margin-bottom: 20px;
          width: fit-content;
        }
        .bs-plan-name {
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-mid);
          margin-bottom: 8px;
          font-weight: 400;
        }
        .bs-plan-price {
          display: flex;
          align-items: baseline;
          gap: 2px;
          margin-bottom: 2px;
        }
        .bs-plan-currency {
          font-size: 20px;
          font-family: var(--serif);
          color: var(--text-mid);
          line-height: 2;
        }
        .bs-plan-amount {
          font-size: 52px;
          font-weight: 300;
          font-family: var(--serif);
          color: var(--text-primary);
          letter-spacing: -0.04em;
          line-height: 1;
        }
        .bs-plan-period {
          font-size: 11px;
          color: var(--text-dim);
          margin-bottom: 24px;
        }
        .bs-plan-divider {
          height: 1px;
          background: var(--border);
          margin-bottom: 20px;
        }
        .bs-plan-features {
          list-style: none;
          padding: 0;
          margin: 0 0 28px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }
        .bs-plan-feat {
          font-size: 12px;
          color: var(--text-mid);
          display: flex;
          align-items: center;
          gap: 9px;
          line-height: 1.4;
        }
        .bs-plan-feat.dim {
          color: var(--text-dim);
          text-decoration: line-through;
          text-decoration-color: rgba(255,255,255,0.1);
        }
        .bs-feat-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--rose-border);
          flex-shrink: 0;
        }
        .bs-plan-feat.dim .bs-feat-dot {
          background: var(--border);
        }
        .bs-plan-cta {
          display: block;
          text-align: center;
          padding: 12px;
          border-radius: 8px;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.2s;
          background: var(--rose-ghost);
          border: 1px solid var(--rose-border);
          color: var(--rose-dim);
          font-family: var(--sans);
        }
        .bs-plan-cta:hover {
          background: rgba(255,45,85,0.16);
          color: var(--rose);
        }
        .bs-plan-cta.ghost {
          background: transparent;
          border-color: var(--border);
          color: var(--text-dim);
        }
        .bs-plan-cta.ghost:hover {
          border-color: var(--text-dim);
          color: var(--text-mid);
        }
        .bs-plan-trial {
          font-size: 10px;
          color: var(--text-dim);
          text-align: center;
          margin: 10px 0 0;
          letter-spacing: 0.05em;
        }

        @media (max-width: 580px) {
          .bs-pricing-grid { grid-template-columns: 1fr; }
        }

        /* ── CTA FINAL ────────────────────────────────────────────── */
        .bs-cta-final {
          position: relative;
          background: var(--surface);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 100px 5vw;
          text-align: center;
          overflow: hidden;
        }
        .bs-cta-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .bs-cta-radial {
          position: absolute;
          width: 700px;
          height: 700px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(255,45,85,0.08) 0%, transparent 65%);
          border-radius: 50%;
        }
        .bs-cta-inner {
          position: relative;
          z-index: 1;
          max-width: 600px;
          margin: 0 auto;
        }
        .bs-cta-h2 {
          font-family: var(--serif);
          font-size: clamp(2.5rem, 5vw, 5rem);
          font-weight: 300;
          line-height: 1.07;
          letter-spacing: -0.03em;
          color: var(--text-primary);
          margin: 0 0 18px;
        }
        .bs-cta-h2 em {
          font-style: normal;
          color: var(--rose);
        }
        .bs-cta-p {
          font-size: 14px;
          color: var(--text-mid);
          line-height: 1.75;
          margin: 0 0 36px;
          font-weight: 300;
        }
        .bs-cta-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        .bs-cta-note {
          font-size: 10px;
          color: var(--text-dim);
          margin: 18px 0 0;
          letter-spacing: 0.08em;
        }

        /* ── FOOTER ───────────────────────────────────────────────── */
        .bs-footer {
          background: var(--bg);
          border-top: 1px solid var(--border);
          padding: 0 5vw;
        }
        .bs-footer-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 40px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 24px;
        }
        .bs-footer-brand {}
        .bs-footer-logo-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .bs-footer-logo-name {
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-dim);
        }
        .bs-footer-tagline {
          font-size: 11px;
          color: rgba(255,255,255,0.1);
          letter-spacing: 0.04em;
          margin: 0;
        }
        .bs-footer-links {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }
        .bs-footer-links a {
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-dim);
          text-decoration: none;
          transition: color 0.2s;
        }
        .bs-footer-links a:hover { color: var(--text-mid); }
        .bs-footer-bottom {
          max-width: 1100px;
          margin: 0 auto;
          padding: 20px 0;
          border-top: 1px solid var(--border);
        }
        .bs-footer-bottom p {
          font-size: 10px;
          color: rgba(255,255,255,0.1);
          letter-spacing: 0.06em;
          margin: 0;
          text-align: center;
        }

      `}</style>
    </main>
  );
}
