import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BeautySync — El salón que trabaja solo",
  description:
    "Automatiza la agenda de tu salón de belleza. Citas online 24/7, recordatorios automáticos y un dashboard premium para que tú solo te encargues de lo que amas.",
};

export default function LandingPage() {
  return (
    <main className="landing">
      {/* ── NAV ──────────────────────────────────────────────────────── */}
      <nav className="nav">
        <span className="nav-logo">BeautySync</span>
        <div className="nav-links">
          <a href="#features">Funciones</a>
          <a href="#how">Cómo funciona</a>
          <a href="#pricing">Precios</a>
        </div>
        <Link href="/register" className="nav-cta">
          Comenzar gratis
        </Link>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="grid-lines" />
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            14 días gratis · Sin tarjeta de crédito
          </div>

          <h1 className="hero-title">
            El salón que
            <br />
            <em>trabaja solo</em>
          </h1>

          <p className="hero-sub">
            Agenda online 24/7, recordatorios automáticos y un dashboard
            <br className="hide-sm" />
            elegante para que tú te enfoque en lo que realmente importa.
          </p>

          <div className="hero-actions">
            <Link href="/register" className="btn-hero-primary">
              Empieza tu prueba gratuita
              <span className="btn-arrow">→</span>
            </Link>
            <a href="#how" className="btn-hero-ghost">
              Ver cómo funciona
            </a>
          </div>

          {/* Social proof */}
          <div className="social-proof">
            <div className="avatars">
              {["M", "S", "L", "A", "K"].map((l) => (
                <div key={l} className="avatar">
                  {l}
                </div>
              ))}
            </div>
            <p>
              <strong>+500 salones</strong> ya automatizaron su agenda
            </p>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="hero-mockup">
          <div className="mockup-window">
            <div className="mockup-bar">
              <span className="dot r" />
              <span className="dot y" />
              <span className="dot g" />
              <span className="mockup-url">beautysync.app/dashboard</span>
            </div>
            <div className="mockup-body">
              <div className="mock-sidebar">
                <div className="mock-logo-sm" />
                {["Inicio", "Servicios", "Clientas", "Config"].map((l) => (
                  <div key={l} className={`mock-nav-item ${l === "Inicio" ? "active" : ""}`}>
                    <div className="mock-nav-dot" />
                    <span>{l}</span>
                  </div>
                ))}
              </div>
              <div className="mock-main">
                <p className="mock-greeting">Citas de hoy</p>
                <div className="mock-stats">
                  {[
                    { label: "Total", val: "8" },
                    { label: "Pendientes", val: "3" },
                    { label: "Completadas", val: "5" },
                    { label: "Ingresos", val: "$240" },
                  ].map((s) => (
                    <div key={s.label} className="mock-stat">
                      <span className="mock-stat-val">{s.val}</span>
                      <span className="mock-stat-label">{s.label}</span>
                    </div>
                  ))}
                </div>
                {[
                  { name: "María García", time: "10:00 AM", service: "Corte + Tinte", status: "confirmed" },
                  { name: "Sofía Ramos", time: "11:30 AM", service: "Manicure", status: "in_progress" },
                  { name: "Laura Pérez", time: "1:00 PM", service: "Peinado", status: "scheduled" },
                ].map((a) => (
                  <div key={a.name} className={`mock-appt mock-appt-${a.status}`}>
                    <div className="mock-avatar">{a.name[0]}</div>
                    <div className="mock-appt-info">
                      <span className="mock-appt-name">{a.name}</span>
                      <span className="mock-appt-detail">
                        {a.time} · {a.service}
                      </span>
                    </div>
                    <div className={`mock-badge mock-badge-${a.status}`}>
                      {a.status === "confirmed" ? "Confirmada" : a.status === "in_progress" ? "En curso" : "Agendada"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Realtime indicator */}
          <div className="realtime-pill">
            <span className="live-dot" />
            Actualización en tiempo real
          </div>
        </div>
      </section>

      {/* ── LOGOS / TRUST ────────────────────────────────────────────── */}
      <section className="trust">
        <p className="trust-label">Integra con las herramientas que ya usas</p>
        <div className="trust-logos">
          {["WhatsApp", "Gmail", "Stripe", "Wompi", "Instagram"].map((b) => (
            <div key={b} className="trust-logo">
              {b}
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section className="features" id="features">
        <div className="section-label">Funciones</div>
        <h2 className="section-title">
          Todo lo que tu salón
          <br />
          <em>necesita, y nada más</em>
        </h2>

        <div className="features-grid">
          {[
            {
              icon: "◈",
              title: "Agenda online 24/7",
              desc: "Tus clientas reservan cuando quieren, desde su teléfono. Sin llamadas, sin mensajes de WhatsApp a las 11pm.",
              accent: "blush",
            },
            {
              icon: "◉",
              title: "Recordatorios automáticos",
              desc: "El sistema envía recordatorios por email o WhatsApp 24 horas antes. Cero no-shows, cero estrés.",
              accent: "gold",
            },
            {
              icon: "◎",
              title: "Dashboard en tiempo real",
              desc: "Ve el estado de cada cita al instante. Confirma, inicia o completa con un clic desde cualquier dispositivo.",
              accent: "blush",
            },
            {
              icon: "◇",
              title: "Widget de reservas",
              desc: "Un link único para tu salón. Compártelo en Instagram, WhatsApp o donde quieras. Funciona sin cuenta.",
              accent: "gold",
            },
            {
              icon: "◈",
              title: "Control de servicios",
              desc: "Define tus servicios, duración y precio. El sistema calcula los horarios disponibles automáticamente.",
              accent: "gold",
            },
            {
              icon: "◉",
              title: "Sin interrupciones por pago",
              desc: "Si tu suscripción expira, el sistema te avisa con elegancia. Sin cortes abruptos, siempre con estilo.",
              accent: "blush",
            },
          ].map((f) => (
            <div key={f.title} className={`feature-card feature-card-${f.accent}`}>
              <div className={`feature-icon feature-icon-${f.accent}`}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="how" id="how">
        <div className="how-inner">
          <div className="how-text">
            <div className="section-label">Cómo funciona</div>
            <h2 className="section-title left">
              De la reserva a la
              <br />
              <em>cita completada</em>
            </h2>
            <p className="how-desc">
              Un flujo completamente automatizado. Tu clienta reserva, el sistema confirma, recuerda y notifica. Tú solo apareces y haces lo que amas.
            </p>
            <Link href="/register" className="btn-primary-landing">
              Pruébalo gratis 14 días →
            </Link>
          </div>

          <div className="how-steps">
            {[
              {
                n: "01",
                title: "Clienta elige su cita",
                desc: "Entra al widget, selecciona servicio, fecha y hora disponible.",
              },
              {
                n: "02",
                title: "Confirmación automática",
                desc: "Recibe un email de confirmación al instante. Sin intervención tuya.",
              },
              {
                n: "03",
                title: "Recordatorio 24h antes",
                desc: "El sistema envía recordatorio automático. Drasticamente menos cancelaciones.",
              },
              {
                n: "04",
                title: "Tú ves todo en vivo",
                desc: "Tu dashboard se actualiza en tiempo real. Gestiona el día con un vistazo.",
              },
            ].map((s, i) => (
              <div key={s.n} className={`step ${i % 2 === 0 ? "step-right" : ""}`}>
                <div className="step-number">{s.n}</div>
                <div className="step-content">
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="testimonials">
        <div className="section-label center">Testimonios</div>
        <h2 className="section-title center">
          Lo que dicen las
          <br />
          <em>dueñas de salón</em>
        </h2>

        <div className="testimonials-grid">
          {[
            {
              quote: "Antes perdía horas coordinando citas por WhatsApp. Ahora mis clientas reservan solas y yo solo llego a trabajar.",
              name: "Valentina M.",
              role: "Salón Valentina Beauty, San Salvador",
            },
            {
              quote: "El diseño es precioso. Mis clientas me preguntan cómo hice el sistema de reservas tan elegante. BeautySync lo hizo por mí.",
              name: "Sofía R.",
              role: "Studio Sofía, Santa Tecla",
            },
            {
              quote: "Los recordatorios automáticos redujeron mis cancelaciones a casi cero. Ya no tengo que perseguir a nadie.",
              name: "Andrea L.",
              role: "Nails & Co., San Miguel",
            },
          ].map((t) => (
            <div key={t.name} className="testimonial-card">
              <div className="quote-mark">&ldquo;</div>
              <p className="quote-text">{t.quote}</p>
              <div className="quote-author">
                <div className="quote-avatar">{t.name[0]}</div>
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────── */}
      <section className="pricing" id="pricing">
        <div className="section-label center">Precios</div>
        <h2 className="section-title center">
          Simple, transparente,
          <br />
          <em>sin sorpresas</em>
        </h2>

        <div className="pricing-grid">
          {[
            {
              name: "Starter",
              price: "$19",
              period: "/mes",
              desc: "Para salones que están comenzando",
              features: ["Agenda online 24/7", "Recordatorios automáticos", "Dashboard en tiempo real", "1 usuario", "Soporte por email"],
              cta: "Comenzar gratis",
              highlighted: false,
            },
            {
              name: "Pro",
              price: "$39",
              period: "/mes",
              desc: "El favorito de las dueñas de salón",
              features: ["Todo de Starter", "Múltiples usuarios", "Widget personalizable", "Reportes avanzados", "Soporte prioritario", "Integración WhatsApp"],
              cta: "Comenzar gratis",
              highlighted: true,
            },
          ].map((p) => (
            <div key={p.name} className={`pricing-card ${p.highlighted ? "pricing-card-featured" : ""}`}>
              {p.highlighted && <div className="pricing-badge">Más popular</div>}
              <div className="pricing-header">
                <h3>{p.name}</h3>
                <p className="pricing-desc">{p.desc}</p>
                <div className="pricing-price">
                  <span className="price-amount">{p.price}</span>
                  <span className="price-period">{p.period}</span>
                </div>
              </div>
              <ul className="pricing-features">
                {p.features.map((f) => (
                  <li key={f}>
                    <span className="check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className={`pricing-cta ${p.highlighted ? "pricing-cta-featured" : ""}`}>
                {p.cta}
              </Link>
              <p className="pricing-trial">14 días gratis incluidos</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────── */}
      <section className="cta-final">
        <div className="cta-bg">
          <div className="orb orb-cta-1" />
          <div className="orb orb-cta-2" />
        </div>
        <div className="cta-content">
          <h2 className="cta-title">
            Tu salón merece
            <br />
            <em>trabajar solo</em>
          </h2>
          <p className="cta-sub">
            Únete a más de 500 salones que ya automatizaron su agenda.
            <br />
            14 días gratis, sin tarjeta de crédito.
          </p>
          <Link href="/register" className="btn-cta">
            Empieza hoy mismo →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">BeautySync</span>
            <p>El salón que trabaja solo.</p>
          </div>
          <div className="footer-links">
            <a href="#features">Funciones</a>
            <a href="#pricing">Precios</a>
            <Link href="/login">Iniciar sesión</Link>
            <Link href="/register">Registro</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 BeautySync · Todos los derechos reservados</p>
        </div>
      </footer>

      {/* ── STYLES ───────────────────────────────────────────────────── */}
      <style>{`
        /* ── Reset & base ── */
        .landing { font-family: var(--font-inter, 'Inter', sans-serif); background: #FEFCF8; color: #1A1A2E; overflow-x: hidden; }
        .hide-sm { display: block; }
        @media (max-width: 640px) { .hide-sm { display: none; } }

        /* ── NAV ── */
        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 1.1rem 4vw; background: rgba(254,252,248,0.85); backdrop-filter: blur(14px); border-bottom: 1px solid rgba(212,55,95,.08); }
        .nav-logo { font-family: var(--font-cormorant, 'Cormorant Garamond', serif); font-size: 1.5rem; font-weight: 500; color: #D4375F; letter-spacing: .02em; }
        .nav-links { display: flex; gap: 2rem; }
        .nav-links a { font-size: .875rem; color: #6B7280; text-decoration: none; transition: color .2s; }
        .nav-links a:hover { color: #D4375F; }
        .nav-cta { background: #D4375F; color: #fff; font-size: .875rem; font-weight: 600; padding: .55rem 1.25rem; border-radius: 999px; text-decoration: none; transition: background .2s, transform .15s; }
        .nav-cta:hover { background: #C1304F; transform: scale(1.02); }
        @media (max-width: 640px) { .nav-links { display: none; } }

        /* ── HERO ── */
        .hero { position: relative; min-height: 100vh; display: flex; align-items: center; gap: 5vw; padding: 7rem 6vw 4rem; overflow: hidden; }
        .hero-bg { position: absolute; inset: 0; pointer-events: none; }
        .orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: .35; }
        .orb-1 { width: 500px; height: 500px; background: #D4375F; top: -120px; right: -100px; }
        .orb-2 { width: 300px; height: 300px; background: #C9A227; bottom: 0; left: 10%; }
        .orb-3 { width: 200px; height: 200px; background: #D4375F; top: 40%; left: 30%; opacity: .15; }
        .grid-lines { position: absolute; inset: 0; background-image: linear-gradient(rgba(212,55,95,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(212,55,95,.04) 1px, transparent 1px); background-size: 60px 60px; }
        .hero-content { position: relative; flex: 1; max-width: 540px; z-index: 1; }
        .hero-badge { display: inline-flex; align-items: center; gap: .5rem; background: rgba(212,55,95,.08); color: #D4375F; font-size: .8125rem; font-weight: 600; padding: .4rem 1rem; border-radius: 999px; border: 1px solid rgba(212,55,95,.15); margin-bottom: 1.75rem; letter-spacing: .02em; }
        .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #D4375F; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .5; transform: scale(1.5); } }
        .hero-title { font-family: var(--font-cormorant, 'Cormorant Garamond', serif); font-size: clamp(3rem, 6vw, 5.5rem); font-weight: 500; line-height: 1.05; color: #1A1A2E; margin: 0 0 1.5rem; letter-spacing: -.01em; }
        .hero-title em { color: #D4375F; font-style: italic; }
        .hero-sub { font-size: 1.0625rem; line-height: 1.7; color: #4B5563; margin: 0 0 2.5rem; }
        .hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2.5rem; }
        .btn-hero-primary { display: inline-flex; align-items: center; gap: .5rem; background: #D4375F; color: #fff; font-weight: 700; font-size: 1rem; padding: .9rem 1.75rem; border-radius: 999px; text-decoration: none; transition: background .2s, transform .15s, box-shadow .2s; box-shadow: 0 4px 20px rgba(212,55,95,.3); }
        .btn-hero-primary:hover { background: #C1304F; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(212,55,95,.4); }
        .btn-arrow { font-size: 1.1rem; transition: transform .2s; }
        .btn-hero-primary:hover .btn-arrow { transform: translateX(3px); }
        .btn-hero-ghost { display: inline-flex; align-items: center; color: #6B7280; font-weight: 500; font-size: .9375rem; text-decoration: none; border-bottom: 1px solid transparent; transition: color .2s, border-color .2s; padding-bottom: 2px; }
        .btn-hero-ghost:hover { color: #D4375F; border-color: #D4375F; }
        .social-proof { display: flex; align-items: center; gap: 1rem; }
        .avatars { display: flex; }
        .avatar { width: 32px; height: 32px; border-radius: 50%; background: #F9D0DB; border: 2px solid #FEFCF8; color: #D4375F; font-size: .75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; margin-left: -8px; }
        .avatar:first-child { margin-left: 0; }
        .social-proof p { font-size: .875rem; color: #6B7280; }
        .social-proof strong { color: #1A1A2E; }

        /* ── MOCKUP ── */
        .hero-mockup { position: relative; flex: 1; max-width: 520px; z-index: 1; }
        .mockup-window { background: #fff; border-radius: 16px; box-shadow: 0 24px 80px rgba(0,0,0,.12), 0 4px 20px rgba(212,55,95,.08); border: 1px solid rgba(0,0,0,.06); overflow: hidden; animation: float 4s ease-in-out infinite; }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .mockup-bar { background: #F9FAFB; padding: .7rem 1rem; display: flex; align-items: center; gap: .5rem; border-bottom: 1px solid #F3F4F6; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot.r { background: #FF5F57; } .dot.y { background: #FEBC2E; } .dot.g { background: #28C840; }
        .mockup-url { font-size: .7rem; color: #9CA3AF; margin-left: .5rem; background: #F3F4F6; padding: .25rem .75rem; border-radius: 999px; }
        .mockup-body { display: flex; min-height: 340px; }
        .mock-sidebar { width: 120px; background: #FEFCF8; border-right: 1px solid #F3F4F6; padding: 1rem .75rem; display: flex; flex-direction: column; gap: .25rem; }
        .mock-logo-sm { width: 28px; height: 28px; border-radius: 8px; background: #D4375F; margin-bottom: 1rem; }
        .mock-nav-item { display: flex; align-items: center; gap: .5rem; padding: .4rem .5rem; border-radius: 8px; font-size: .7rem; color: #9CA3AF; }
        .mock-nav-item.active { background: #D4375F; color: #fff; }
        .mock-nav-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: .6; }
        .mock-main { flex: 1; padding: 1rem; }
        .mock-greeting { font-family: var(--font-cormorant, 'Cormorant Garamond', serif); font-size: 1rem; font-weight: 500; color: #1A1A2E; margin: 0 0 .75rem; }
        .mock-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: .375rem; margin-bottom: .75rem; }
        .mock-stat { background: #F9FAFB; border-radius: 8px; padding: .4rem .3rem; text-align: center; }
        .mock-stat-val { display: block; font-size: .8rem; font-weight: 700; color: #1A1A2E; }
        .mock-stat-label { display: block; font-size: .55rem; color: #9CA3AF; }
        .mock-appt { display: flex; align-items: center; gap: .5rem; padding: .5rem; border-radius: 8px; background: #F9FAFB; margin-bottom: .375rem; border-left: 3px solid transparent; }
        .mock-appt-confirmed { border-left-color: #3B82F6; }
        .mock-appt-in_progress { border-left-color: #8B5CF6; }
        .mock-appt-scheduled { border-left-color: #F59E0B; }
        .mock-avatar { width: 22px; height: 22px; border-radius: 50%; background: #F9D0DB; color: #D4375F; font-size: .6rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .mock-appt-info { flex: 1; min-width: 0; }
        .mock-appt-name { display: block; font-size: .68rem; font-weight: 600; color: #1A1A2E; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mock-appt-detail { display: block; font-size: .6rem; color: #9CA3AF; }
        .mock-badge { font-size: .55rem; font-weight: 600; padding: .15rem .4rem; border-radius: 999px; white-space: nowrap; }
        .mock-badge-confirmed { background: #EFF6FF; color: #3B82F6; }
        .mock-badge-in_progress { background: #F5F3FF; color: #8B5CF6; }
        .mock-badge-scheduled { background: #FFFBEB; color: #F59E0B; }
        .realtime-pill { position: absolute; bottom: -16px; left: 50%; transform: translateX(-50%); background: #1A1A2E; color: #fff; font-size: .75rem; font-weight: 500; padding: .4rem 1rem; border-radius: 999px; display: flex; align-items: center; gap: .5rem; white-space: nowrap; box-shadow: 0 4px 16px rgba(0,0,0,.15); }
        .live-dot { width: 7px; height: 7px; border-radius: 50%; background: #22C55E; animation: pulse 1.5s infinite; }
        @media (max-width: 900px) { .hero { flex-direction: column; padding-top: 6rem; } .hero-mockup { display: none; } .hero-content { max-width: 100%; } }

        /* ── TRUST ── */
        .trust { padding: 3rem 6vw; text-align: center; border-top: 1px solid rgba(0,0,0,.06); border-bottom: 1px solid rgba(0,0,0,.06); background: #fff; }
        .trust-label { font-size: .8125rem; color: #9CA3AF; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 1.5rem; }
        .trust-logos { display: flex; align-items: center; justify-content: center; gap: 2.5rem; flex-wrap: wrap; }
        .trust-logo { font-size: .9375rem; font-weight: 600; color: #D1D5DB; letter-spacing: .04em; }

        /* ── SECTION COMMONS ── */
        .section-label { font-size: .75rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #D4375F; margin-bottom: .75rem; }
        .section-label.center { text-align: center; }
        .section-title { font-family: var(--font-cormorant, 'Cormorant Garamond', serif); font-size: clamp(2.25rem, 4vw, 3.5rem); font-weight: 500; line-height: 1.1; color: #1A1A2E; margin: 0 0 3rem; letter-spacing: -.01em; text-align: center; }
        .section-title.left { text-align: left; }
        .section-title em { color: #D4375F; font-style: italic; }

        /* ── FEATURES ── */
        .features { padding: 6rem 6vw; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
        .feature-card { background: #fff; border-radius: 20px; padding: 2rem; border: 1px solid rgba(0,0,0,.06); transition: transform .25s, box-shadow .25s, border-color .25s; }
        .feature-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,.08); }
        .feature-card-blush:hover { border-color: rgba(212,55,95,.2); }
        .feature-card-gold:hover { border-color: rgba(201,162,39,.2); }
        .feature-icon { font-size: 1.75rem; margin-bottom: 1.25rem; }
        .feature-icon-blush { color: #D4375F; }
        .feature-icon-gold { color: #C9A227; }
        .feature-card h3 { font-size: 1.0625rem; font-weight: 700; color: #1A1A2E; margin: 0 0 .625rem; }
        .feature-card p { font-size: .9375rem; line-height: 1.65; color: #6B7280; margin: 0; }

        /* ── HOW ── */
        .how { padding: 6rem 6vw; background: #fff; }
        .how-inner { display: flex; gap: 6vw; align-items: flex-start; max-width: 1100px; margin: 0 auto; }
        .how-text { flex: 1; position: sticky; top: 6rem; }
        .how-desc { font-size: 1rem; line-height: 1.7; color: #6B7280; margin: 0 0 2rem; max-width: 400px; }
        .btn-primary-landing { display: inline-flex; align-items: center; background: #D4375F; color: #fff; font-weight: 700; font-size: .9375rem; padding: .875rem 1.75rem; border-radius: 999px; text-decoration: none; transition: background .2s, transform .15s; }
        .btn-primary-landing:hover { background: #C1304F; transform: translateY(-1px); }
        .how-steps { flex: 1; display: flex; flex-direction: column; gap: 0; }
        .step { display: flex; gap: 1.5rem; padding: 1.75rem; border-radius: 16px; transition: background .2s; }
        .step:hover { background: #FEFCF8; }
        .step-number { font-family: var(--font-cormorant, 'Cormorant Garamond', serif); font-size: 2.5rem; font-weight: 500; color: rgba(212,55,95,.15); line-height: 1; min-width: 56px; }
        .step-right .step-number { color: rgba(201,162,39,.2); }
        .step:hover .step-number { color: #D4375F; }
        .step-right:hover .step-number { color: #C9A227; }
        .step-content h4 { font-size: 1.0625rem; font-weight: 700; color: #1A1A2E; margin: 0 0 .375rem; }
        .step-content p { font-size: .9375rem; line-height: 1.65; color: #6B7280; margin: 0; }
        @media (max-width: 860px) { .how-inner { flex-direction: column; } .how-text { position: static; } }

        /* ── TESTIMONIALS ── */
        .testimonials { padding: 6rem 6vw; }
        .testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
        .testimonial-card { background: #fff; border-radius: 20px; padding: 2rem; border: 1px solid rgba(0,0,0,.06); display: flex; flex-direction: column; gap: 1.25rem; transition: transform .25s, box-shadow .25s; }
        .testimonial-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,.08); }
        .quote-mark { font-family: var(--font-cormorant, 'Cormorant Garamond', serif); font-size: 4rem; line-height: .8; color: rgba(212,55,95,.2); }
        .quote-text { font-size: .9375rem; line-height: 1.7; color: #374151; margin: 0; flex: 1; }
        .quote-author { display: flex; align-items: center; gap: .875rem; }
        .quote-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #F9D0DB, #D4375F); color: #fff; font-size: .875rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .quote-author strong { display: block; font-size: .9375rem; color: #1A1A2E; }
        .quote-author span { font-size: .8125rem; color: #9CA3AF; }

        /* ── PRICING ── */
        .pricing { padding: 6rem 6vw; background: #fff; }
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; max-width: 780px; margin: 0 auto; }
        .pricing-card { background: #FEFCF8; border-radius: 24px; padding: 2.25rem; border: 1.5px solid rgba(0,0,0,.08); display: flex; flex-direction: column; gap: 1.5rem; position: relative; }
        .pricing-card-featured { background: #1A1A2E; border-color: #1A1A2E; }
        .pricing-badge { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: #D4375F; color: #fff; font-size: .75rem; font-weight: 700; padding: .3rem 1rem; border-radius: 999px; letter-spacing: .04em; white-space: nowrap; }
        .pricing-header h3 { font-family: var(--font-cormorant, 'Cormorant Garamond', serif); font-size: 1.75rem; font-weight: 500; margin: 0 0 .25rem; color: #1A1A2E; }
        .pricing-card-featured .pricing-header h3 { color: #fff; }
        .pricing-desc { font-size: .875rem; color: #9CA3AF; margin: 0 0 1rem; }
        .pricing-price { display: flex; align-items: baseline; gap: .25rem; }
        .price-amount { font-family: var(--font-cormorant, 'Cormorant Garamond', serif); font-size: 3rem; font-weight: 600; color: #D4375F; }
        .price-period { font-size: .9375rem; color: #9CA3AF; }
        .pricing-features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .75rem; flex: 1; }
        .pricing-features li { display: flex; align-items: center; gap: .75rem; font-size: .9375rem; color: #374151; }
        .pricing-card-featured .pricing-features li { color: rgba(255,255,255,.8); }
        .check { color: #D4375F; font-weight: 700; font-size: .9375rem; flex-shrink: 0; }
        .pricing-cta { display: block; text-align: center; padding: .875rem; border-radius: 999px; font-weight: 700; font-size: .9375rem; text-decoration: none; border: 1.5px solid #D4375F; color: #D4375F; transition: background .2s, color .2s; }
        .pricing-cta:hover { background: #D4375F; color: #fff; }
        .pricing-cta-featured { background: #D4375F; color: #fff; border-color: #D4375F; }
        .pricing-cta-featured:hover { background: #C1304F; border-color: #C1304F; }
        .pricing-trial { text-align: center; font-size: .8125rem; color: #9CA3AF; margin: 0; }

        /* ── CTA FINAL ── */
        .cta-final { position: relative; padding: 8rem 6vw; text-align: center; overflow: hidden; background: #FEFCF8; }
        .cta-bg { position: absolute; inset: 0; pointer-events: none; }
        .orb-cta-1 { width: 600px; height: 600px; background: #D4375F; top: -200px; left: -200px; border-radius: 50%; filter: blur(100px); opacity: .12; position: absolute; }
        .orb-cta-2 { width: 400px; height: 400px; background: #C9A227; bottom: -150px; right: -100px; border-radius: 50%; filter: blur(80px); opacity: .12; position: absolute; }
        .cta-content { position: relative; z-index: 1; }
        .cta-title { font-family: var(--font-cormorant, 'Cormorant Garamond', serif); font-size: clamp(2.75rem, 5vw, 5rem); font-weight: 500; line-height: 1.05; color: #1A1A2E; margin: 0 0 1.5rem; }
        .cta-title em { color: #D4375F; font-style: italic; }
        .cta-sub { font-size: 1.0625rem; line-height: 1.7; color: #6B7280; margin: 0 auto 2.5rem; max-width: 480px; }
        .btn-cta { display: inline-flex; align-items: center; gap: .5rem; background: #D4375F; color: #fff; font-weight: 700; font-size: 1.0625rem; padding: 1rem 2.25rem; border-radius: 999px; text-decoration: none; transition: background .2s, transform .15s, box-shadow .2s; box-shadow: 0 8px 28px rgba(212,55,95,.35); letter-spacing: .01em; }
        .btn-cta:hover { background: #C1304F; transform: translateY(-2px); box-shadow: 0 12px 36px rgba(212,55,95,.45); }

        /* ── FOOTER ── */
        .footer { background: #1A1A2E; padding: 3rem 6vw 1.5rem; }
        .footer-inner { display: flex; justify-content: space-between; align-items: flex-start; gap: 2rem; margin-bottom: 2rem; flex-wrap: wrap; }
        .footer-brand .footer-logo { font-family: var(--font-cormorant, 'Cormorant Garamond', serif); font-size: 1.5rem; font-weight: 500; color: #fff; display: block; margin-bottom: .25rem; }
        .footer-brand p { font-size: .875rem; color: rgba(255,255,255,.4); margin: 0; }
        .footer-links { display: flex; gap: 2rem; flex-wrap: wrap; }
        .footer-links a { font-size: .875rem; color: rgba(255,255,255,.5); text-decoration: none; transition: color .2s; }
        .footer-links a:hover { color: #D4375F; }
        .footer-bottom { border-top: 1px solid rgba(255,255,255,.08); padding-top: 1.5rem; }
        .footer-bottom p { font-size: .8125rem; color: rgba(255,255,255,.3); margin: 0; text-align: center; }
      `}</style>
    </main>
  );
}