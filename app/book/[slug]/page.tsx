// app/book/[slug]/page.tsx
// Fase 8.1 v2 — Diseño premium: fondo oscuro cálido, glassmorphism, color de marca como acento

import { notFound } from "next/navigation";
import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import BookingWidget from "@/components/booking/BookingWidget";
import type { SalonPublicData, ServicePublicData } from "@/types/booking.types";

interface BookPageProps {
  params: Promise<{ slug: string }>;
}

// ─── Metadata dinámica ────────────────────────────────────────────────────────
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

  const primaryColor = salon.primary_color || "#D4375F";

  // Iniciales para el avatar fallback
  const initials = salon.name
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <style>{`
        /* ─── Reset y variables ──────────────────────────────── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --color-brand: ${primaryColor};
          --font-display: var(--font-cormorant), 'Georgia', serif;
          --font-body: var(--font-jakarta), var(--font-inter), -apple-system, sans-serif;

          /* Paleta oscura cálida */
          --bg-base:    #0D0C0B;
          --bg-surface: #151311;
          --bg-card:    rgba(255, 255, 255, 0.04);
          --border:     rgba(255, 255, 255, 0.08);
          --border-accent: rgba(255, 255, 255, 0.14);
          --text-primary:   #F5F2EE;
          --text-secondary: rgba(245, 242, 238, 0.55);
          --text-muted:     rgba(245, 242, 238, 0.3);
        }

        body {
          background: var(--bg-base);
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
        }

        /* ─── Layout raíz ───────────────────────────────────── */
        .bk-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow-x: hidden;
        }

        /* ─── Fondo con orbs de color de marca ──────────────── */
        .bk-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .bk-orb-1 {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          background: radial-gradient(
            circle,
            color-mix(in srgb, var(--color-brand) 28%, transparent) 0%,
            transparent 70%
          );
          filter: blur(1px);
        }

        .bk-orb-2 {
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          bottom: -100px;
          right: -100px;
          background: radial-gradient(
            circle,
            color-mix(in srgb, var(--color-brand) 12%, transparent) 0%,
            transparent 70%
          );
        }

        /* Patrón de ruido sutil sobre el fondo */
        .bk-noise {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          opacity: 0.4;
        }

        /* ─── Contenido principal ───────────────────────────── */
        .bk-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 48px 20px 64px;
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
          gap: 32px;
        }

        /* ─── Cabecera del salón ────────────────────────────── */
        .bk-salon-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          text-align: center;
          width: 100%;
        }

        /* Badge superior */
        .bk-live-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border-accent);
          border-radius: 100px;
          padding: 5px 14px 5px 10px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .bk-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--color-brand);
          box-shadow: 0 0 8px var(--color-brand);
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.85); }
        }

        /* Avatar del salón */
        .bk-avatar-wrap {
          position: relative;
        }

        .bk-avatar {
          width: 88px;
          height: 88px;
          border-radius: 26px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow:
            0 0 0 6px rgba(255, 255, 255, 0.03),
            0 20px 60px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(12px);
        }

        .bk-avatar img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 10px;
        }

        .bk-avatar-initials {
          font-family: var(--font-display);
          font-size: 32px;
          font-weight: 600;
          color: var(--color-brand);
          letter-spacing: 0.02em;
        }

        /* Anillo de color de marca alrededor del avatar */
        .bk-avatar-ring {
          position: absolute;
          inset: -4px;
          border-radius: 30px;
          border: 1.5px solid color-mix(in srgb, var(--color-brand) 40%, transparent);
          pointer-events: none;
        }

        /* Nombre del salón */
        .bk-salon-name {
          font-family: var(--font-display);
          font-size: 2.25rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.1;
          letter-spacing: -0.01em;
        }

        /* Dirección */
        .bk-salon-address {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 400;
        }

        /* Divider decorativo */
        .bk-divider {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .bk-divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            var(--border-accent),
            transparent
          );
        }

        .bk-divider-gem {
          font-size: 10px;
          color: var(--color-brand);
          opacity: 0.6;
        }

        /* ─── Card del widget ───────────────────────────────── */
        .bk-card {
          width: 100%;
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid var(--border-accent);
          border-radius: 28px;
          padding: 32px 28px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.04) inset,
            0 32px 80px rgba(0, 0, 0, 0.4),
            0 8px 32px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
        }

        /* Brillo sutil en la esquina superior */
        .bk-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 20%;
          right: 20%;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.18),
            transparent
          );
          pointer-events: none;
        }

        /* ─── Footer ────────────────────────────────────────── */
        .bk-footer {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 400;
        }

        .bk-footer a {
          color: var(--text-secondary);
          font-weight: 600;
          text-decoration: none;
          transition: color 0.15s;
        }

        .bk-footer a:hover {
          color: var(--color-brand);
        }

        /* ─── Responsive ────────────────────────────────────── */
        @media (max-width: 480px) {
          .bk-content { padding: 36px 16px 48px; }
          .bk-card { padding: 24px 20px; border-radius: 22px; }
          .bk-salon-name { font-size: 1.875rem; }
        }

        @media (min-width: 640px) {
          .bk-salon-name { font-size: 2.5rem; }
          .bk-avatar { width: 96px; height: 96px; border-radius: 28px; }
        }
      `}</style>

      <div className="bk-root">
        {/* Fondo con orbs */}
        <div className="bk-bg">
          <div className="bk-orb-1" />
          <div className="bk-orb-2" />
          <div className="bk-noise" />
        </div>

        {/* Contenido */}
        <div className="bk-content">
          {/* ── Cabecera del salón ── */}
          <header className="bk-salon-header">
            {/* Badge live */}
            <div className="bk-live-badge">
              <div className="bk-live-dot" />
              Reservas abiertas
            </div>

            {/* Avatar */}
            <div className="bk-avatar-wrap">
              <div className="bk-avatar">
                {salon.logo_url ? (
                  <img src={salon.logo_url} alt={`Logo de ${salon.name}`} />
                ) : (
                  <span className="bk-avatar-initials">{initials}</span>
                )}
              </div>
              <div className="bk-avatar-ring" />
            </div>

            {/* Nombre */}
            <h1 className="bk-salon-name">{salon.name}</h1>

            {/* Dirección si existe */}
            {salon.address && (
              <p className="bk-salon-address">
                <span>📍</span>
                <span>{salon.address}</span>
              </p>
            )}
          </header>

          {/* Divider decorativo */}
          <div className="bk-divider">
            <div className="bk-divider-line" />
            <span className="bk-divider-gem">✦</span>
            <div className="bk-divider-line" />
          </div>

          {/* ── Card del widget ── */}
          <div className="bk-card">
            <BookingWidget
              salon={salon as SalonPublicData}
              services={(services || []) as ServicePublicData[]}
            />
          </div>

          {/* Footer */}
          <footer className="bk-footer">
            <span>Reservas gestionadas por</span>
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
          background: #0D0C0B;
          padding: 24px;
          font-family: var(--font-jakarta), var(--font-inter), sans-serif;
        }
        .si-card {
          text-align: center;
          max-width: 320px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 40px 32px;
          backdrop-filter: blur(20px);
        }
        .si-icon {
          font-size: 40px;
          margin-bottom: 20px;
          display: block;
        }
        .si-title {
          font-family: var(--font-cormorant), Georgia, serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: #F5F2EE;
          margin-bottom: 10px;
          line-height: 1.2;
        }
        .si-desc {
          font-size: 0.875rem;
          color: rgba(245, 242, 238, 0.45);
          line-height: 1.6;
        }
      `}</style>
      <div className="si-root">
        <div className="si-card">
          <span className="si-icon">💇‍♀️</span>
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
