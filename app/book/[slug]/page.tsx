// app/book/[slug]/page.tsx
// Widget público — diseño único premium. Shell visual completamente rediseñado.
// Lógica de datos y validación de suscripción 100% intacta.

import { notFound } from "next/navigation";
import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import BookingWidget from "@/components/booking/BookingWidget";
import type { SalonPublicData, ServicePublicData } from "@/types/booking.types";

interface BookPageProps {
  params: Promise<{ slug: string }>;
}

// ─── Metadata dinámica — intacta ──────────────────────────────────────────────
export async function generateMetadata({
  params,
}: BookPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: salon } = await supabase
    .from("salons")
    .select("name, slug")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!salon) {
    return { title: "Salón no encontrado · BeautySync" };
  }

  return {
    title: `Reservar en ${salon.name} · BeautySync`,
    description: `Agenda tu cita en ${salon.name} de forma rápida y sencilla.`,
    openGraph: {
      title: `Reservar en ${salon.name}`,
      description: `Agenda tu cita en ${salon.name} de forma rápida y sencilla.`,
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function BookPage({ params }: BookPageProps) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: salon, error: salonError } = await supabase
    .from("salons")
    .select(
      "id, name, slug, address, phone, primary_color, logo_url, is_active",
    )
    .eq("slug", slug)
    .single();

  if (salonError || !salon) notFound();
  if (!salon.is_active) return <SalonInactivePage salonName={salon.name} />;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, trial_ends_at, current_period_end")
    .eq("salon_id", salon.id)
    .single();

  const isSubscriptionValid =
    subscription &&
    (subscription.status === "active" || subscription.status === "trialing");

  if (!isSubscriptionValid) {
    return <SalonInactivePage salonName={salon.name} reason="subscription" />;
  }

  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("id, name, duration_minutes, price, description")
    .eq("salon_id", salon.id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (servicesError) {
    console.error("[BookPage] Error fetching services:", servicesError);
  }

  const primaryColor = salon.primary_color || "#FF2D55";

  const initials = salon.name
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --brand:          ${primaryColor};
          --brand-glow:     ${primaryColor}40;
          --brand-subtle:   ${primaryColor}12;
          --brand-border:   ${primaryColor}28;
          --font-display:   var(--font-cormorant), 'Georgia', serif;
          --font-body:      var(--font-jakarta), -apple-system, sans-serif;
          --bg:             #080706;
          --surface:        #0E0C0B;
          --surface2:       #131110;
          --border:         rgba(255,255,255,0.055);
          --border-hi:      rgba(255,255,255,0.12);
          --text:           rgba(245,242,238,0.9);
          --text-mid:       rgba(245,242,238,0.45);
          --text-dim:       rgba(245,242,238,0.18);
          --text-ghost:     rgba(245,242,238,0.18);
        }

        html, body {
          background: var(--bg);
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
        }

        /* ── Fondo ─────────────────────────────────────────────── */
        .bk-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }

        /* Gradiente de malla radial — el primaryColor tiñe el fondo */
        .bk-mesh {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% -10%, ${primaryColor}22 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 80% 100%, ${primaryColor}0E 0%, transparent 60%),
            radial-gradient(ellipse 30% 30% at 10% 60%, ${primaryColor}08 0%, transparent 50%);
        }

        /* Línea horizontal de luz */
        .bk-lightline {
          position: absolute;
          top: 38%;
          left: -10%;
          right: -10%;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            ${primaryColor}15 25%,
            ${primaryColor}35 50%,
            ${primaryColor}15 75%,
            transparent 100%
          );
          pointer-events: none;
        }

        /* Grain texture */
        .bk-grain {
          position: absolute;
          inset: 0;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px 200px;
        }

        /* ── Layout ─────────────────────────────────────────────── */
        .bk-root {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 56px 20px 72px;
          width: 100%;
        }

        .bk-inner {
          width: 100%;
          max-width: 460px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }

        /* ── Header ─────────────────────────────────────────────── */
        .bk-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          width: 100%;
          margin-bottom: 36px;
          gap: 20px;
        }

        /* Badge "Reservas abiertas" */
        .bk-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--surface2);
          border: 1px solid var(--brand-border);
          border-radius: 100px;
          padding: 6px 16px 6px 10px;
          font-size: 10px;
          font-weight: 500;
          color: var(--text-mid);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .bk-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--brand);
          box-shadow: 0 0 8px var(--brand-glow);
          animation: bk-pulse 2.5s ease-in-out infinite;
          flex-shrink: 0;
        }

        @keyframes bk-pulse {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 6px var(--brand-glow); }
          50%       { opacity: 0.7; transform: scale(0.85); box-shadow: 0 0 12px var(--brand-glow); }
        }

        /* Avatar del salón */
        .bk-avatar-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Anillo exterior giratorio */
        .bk-avatar-ring-outer {
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          border: 1px dashed ${primaryColor}30;
          animation: bk-spin 20s linear infinite;
        }

        @keyframes bk-spin {
          to { transform: rotate(360deg); }
        }

        /* Anillo interior */
        .bk-avatar-ring-inner {
          position: absolute;
          inset: -4px;
          border-radius: 28px;
          border: 1px solid ${primaryColor}22;
          pointer-events: none;
        }

        .bk-avatar {
          width: 96px;
          height: 96px;
          border-radius: 24px;
          background: var(--surface2);
          border: 1px solid var(--border-hi);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow:
            0 0 0 6px ${primaryColor}08,
            0 24px 64px rgba(0,0,0,0.55);
          backdrop-filter: blur(12px);
          position: relative;
          z-index: 1;
        }

        .bk-avatar img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 10px;
        }

        .bk-avatar-initials {
          font-family: var(--font-display);
          font-size: 34px;
          font-weight: 300;
          color: var(--brand);
          letter-spacing: -0.02em;
          line-height: 1;
        }

        /* Nombre del salón */
        .bk-salon-name {
          font-family: var(--font-display);
          font-size: clamp(2rem, 6vw, 2.75rem);
          font-weight: 300;
          color: var(--text);
          line-height: 1.05;
          letter-spacing: -0.03em;
        }

        /* Dirección */
        .bk-address {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: var(--text-dim);
          letter-spacing: 0.04em;
        }

        /* Divisor decorativo */
        .bk-divider {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 28px;
        }

        .bk-div-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, ${primaryColor}25, transparent);
        }

        .bk-div-gem {
          font-size: 10px;
          color: var(--brand);
          opacity: 0.5;
          letter-spacing: 0.1em;
        }

        /* ── Card del widget ─────────────────────────────────────── */
        .bk-card {
          width: 100%;
          background: rgba(14,12,11,0.7);
          border: 1px solid var(--border-hi);
          border-radius: 24px;
          padding: 32px 28px;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.03) inset,
            0 0 60px ${primaryColor}08 inset,
            0 40px 100px rgba(0,0,0,0.5);
          position: relative;
          overflow: hidden;
        }

        /* Brillo superior */
        .bk-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 15%;
          right: 15%;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,0.14),
            transparent
          );
          pointer-events: none;
        }

        /* Acento esquina */
        .bk-card::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 18px;
          height: 18px;
          border-top: 1px solid ${primaryColor}40;
          border-right: 1px solid ${primaryColor}40;
          border-top-right-radius: 24px;
          pointer-events: none;
        }

        /* ── Footer ─────────────────────────────────────────────── */
        .bk-footer {
          margin-top: 28px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          color: var(--text-ghost);
          letter-spacing: 0.06em;
        }

        .bk-footer a {
          color: var(--text-dim);
          text-decoration: none;
          font-weight: 500;
          letter-spacing: 0.04em;
          transition: color 0.15s;
        }

        .bk-footer a:hover { color: var(--brand); }

        /* ── Responsive ─────────────────────────────────────────── */
        @media (max-width: 480px) {
          .bk-root  { padding: 40px 16px 56px; }
          .bk-card  { padding: 24px 20px; border-radius: 20px; }
        }

        @media (min-width: 640px) {
          .bk-avatar { width: 104px; height: 104px; border-radius: 26px; }
        }
      `}</style>

      {/* ── Fondo ── */}
      <div className="bk-bg">
        <div className="bk-mesh" />
        <div className="bk-lightline" />
        <div className="bk-grain" />
      </div>

      {/* ── Contenido ── */}
      <div className="bk-root">
        <div className="bk-inner">
          {/* Header del salón */}
          <header className="bk-header">
            {/* Badge live */}
            <div className="bk-badge">
              <div className="bk-badge-dot" />
              Reservas abiertas
            </div>

            {/* Avatar */}
            <div className="bk-avatar-wrap">
              <div className="bk-avatar-ring-outer" />
              <div className="bk-avatar">
                {salon.logo_url ? (
                  <img src={salon.logo_url} alt={`Logo de ${salon.name}`} />
                ) : (
                  <span className="bk-avatar-initials">{initials}</span>
                )}
              </div>
              <div className="bk-avatar-ring-inner" />
            </div>

            {/* Nombre */}
            <h1 className="bk-salon-name">{salon.name}</h1>

            {/* Dirección */}
            {salon.address && (
              <p className="bk-address">
                <span>📍</span>
                <span>{salon.address}</span>
              </p>
            )}
          </header>

          {/* Divisor */}
          <div className="bk-divider">
            <div className="bk-div-line" />
            <span className="bk-div-gem">✦</span>
            <div className="bk-div-line" />
          </div>

          {/* Card con el widget */}
          <div className="bk-card">
            <BookingWidget
              salon={salon as SalonPublicData}
              services={(services || []) as ServicePublicData[]}
            />
          </div>

          {/* Footer */}
          <footer className="bk-footer">
            <span>Reservas por</span>
            <a
              href="https://beautysyncsv.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              BeautySync
            </a>
          </footer>
        </div>
      </div>
    </>
  );
}

// ─── Fallback — salón inactivo o sin suscripción ──────────────────────────────
function SalonInactivePage({
  salonName,
  reason,
}: {
  salonName?: string;
  reason?: string;
}) {
  return (
    <>
      <style>{`
        .si-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #080706;
          padding: 24px;
          font-family: var(--font-jakarta), sans-serif;
        }
        .si-card {
          text-align: center;
          max-width: 300px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 40px 28px;
          backdrop-filter: blur(20px);
        }
        .si-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(255,45,85,0.08);
          border: 1px solid rgba(255,45,85,0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          flex-shrink: 0;
        }
        .si-title {
          font-family: var(--font-cormorant), Georgia, serif;
          font-size: 1.4rem;
          font-weight: 300;
          color: rgba(245,242,238,0.9);
          margin-bottom: 10px;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }
        .si-desc {
          font-size: 13px;
          color: rgba(245,242,238,0.45);
          line-height: 1.65;
          letter-spacing: 0.02em;
        }
      `}</style>
      <div className="si-root">
        <div className="si-card">
          <div className="si-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M11 7v5M11 15h.01M9.27 3.5L1.5 17a2 2 0 001.73 3h15.54a2 2 0 001.73-3L12.73 3.5a2 2 0 00-3.46 0z"
                stroke="rgba(255,45,85,0.55)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="si-title">
            {reason === "subscription"
              ? "Reservas temporalmente no disponibles"
              : salonName
                ? `${salonName} no está disponible`
                : "Salón no disponible"}
          </h1>
          <p className="si-desc">
            {reason === "subscription"
              ? "Este salón tiene su plan pausado. Contacta directamente para agendar."
              : "Este salón no está aceptando reservas en este momento."}
          </p>
        </div>
      </div>
    </>
  );
}
