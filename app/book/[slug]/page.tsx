// app/book/[slug]/page.tsx
// Server Component — carga datos del salón y servicios antes de renderizar

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

  // 1. Obtener datos del salón por slug
  const { data: salon, error: salonError } = await supabase
    .from("salons")
    .select(
      "id, name, slug, address, phone, primary_color, logo_url, is_active",
    )
    .eq("slug", slug)
    .single();

  if (salonError || !salon) notFound();

  if (!salon.is_active) {
    return <SalonInactivePage salonName={salon.name} />;
  }

  // 2. Verificar suscripción activa o trialing
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

  // 3. Obtener servicios activos
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

  // ── Helpers para el hero ──────────────────────────────────────────────────
  // Iniciales del salón (máx 2 caracteres) para el avatar fallback
  const initials = salon.name
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #FAF8F5;
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        /* ─── Hero ──────────────────────────────────────── */
        .bk-hero {
          position: relative;
          width: 100%;
          padding: 48px 24px 72px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          overflow: hidden;
        }

        /* Fondo degradado con color de marca */
        .bk-hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        /* Capa de color de marca */
        .bk-hero-color {
          position: absolute;
          inset: 0;
          opacity: 0.92;
        }

        /* Patrón de puntos sutil */
        .bk-hero-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px);
          background-size: 24px 24px;
          pointer-events: none;
        }

        /* Brillo inferior para transición suave al contenido */
        .bk-hero-fade {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 80px;
          background: linear-gradient(to bottom, transparent, #FAF8F5);
          pointer-events: none;
        }

        /* Contenido del hero sobre el fondo */
        .bk-hero-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        /* Avatar del salón */
        .bk-avatar {
          width: 80px;
          height: 80px;
          border-radius: 22px;
          background: rgba(255,255,255,0.15);
          border: 2px solid rgba(255,255,255,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          backdrop-filter: blur(8px);
        }

        .bk-avatar img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 8px;
        }

        .bk-avatar-initials {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 28px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          letter-spacing: 0.04em;
        }

        /* Nombre del salón */
        .bk-salon-name {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 2rem;
          font-weight: 600;
          color: #fff;
          line-height: 1.15;
          letter-spacing: 0.01em;
          text-shadow: 0 2px 12px rgba(0,0,0,0.18);
        }

        /* Tagline */
        .bk-tagline {
          font-size: 0.8125rem;
          font-weight: 500;
          color: rgba(255,255,255,0.75);
          letter-spacing: 0.04em;
        }

        /* Dirección / info del salón */
        .bk-salon-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.6);
        }

        /* Badge "Reserva gratis · Sin registro" */
        .bk-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 100px;
          padding: 5px 14px;
          font-size: 0.6875rem;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          letter-spacing: 0.04em;
          backdrop-filter: blur(8px);
        }

        .bk-badge-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: rgba(255,255,255,0.8);
        }

        /* ─── Widget card ────────────────────────────────── */
        .bk-card-wrap {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          margin: -40px auto 0;
          padding: 0 16px 48px;
        }

        .bk-card {
          background: #fff;
          border-radius: 24px;
          border: 1px solid #EDE8E3;
          padding: 28px 24px;
          box-shadow:
            0 4px 6px rgba(0,0,0,0.04),
            0 12px 40px rgba(0,0,0,0.08),
            0 0 0 1px rgba(255,255,255,0.6) inset;
        }

        /* ─── Footer ─────────────────────────────────────── */
        .bk-footer {
          text-align: center;
          padding-bottom: 32px;
          font-size: 0.6875rem;
          color: #C4B8B0;
        }

        .bk-footer a {
          font-weight: 600;
          color: #9C8E85;
          text-decoration: none;
        }

        .bk-footer a:hover { text-decoration: underline; }

        @media (min-width: 640px) {
          .bk-hero { padding: 64px 24px 80px; }
          .bk-salon-name { font-size: 2.5rem; }
          .bk-card-wrap { padding: 0 24px 64px; }
          .bk-card { padding: 36px 32px; }
        }
      `}</style>

      {/* ── Hero ── */}
      <header className="bk-hero">
        {/* Fondo */}
        <div className="bk-hero-bg">
          <div
            className="bk-hero-color"
            style={{
              background: `linear-gradient(145deg, ${primaryColor} 0%, ${primaryColor}CC 100%)`,
            }}
          />
          <div className="bk-hero-dots" />
          <div className="bk-hero-fade" />
        </div>

        {/* Contenido */}
        <div className="bk-hero-content">
          {/* Badge superior */}
          <div className="bk-badge">
            <div className="bk-badge-dot" />
            Reserva tu cita en segundos
          </div>

          {/* Avatar del salón */}
          <div className="bk-avatar">
            {salon.logo_url ? (
              <img src={salon.logo_url} alt={`Logo de ${salon.name}`} />
            ) : (
              <span className="bk-avatar-initials">{initials}</span>
            )}
          </div>

          {/* Nombre */}
          <h1 className="bk-salon-name">{salon.name}</h1>

          {/* Tagline */}
          <p className="bk-tagline">Agenda rápida y sencilla</p>

          {/* Dirección si existe */}
          {salon.address && (
            <p className="bk-salon-meta">
              <span>📍</span>
              <span>{salon.address}</span>
            </p>
          )}
        </div>
      </header>

      {/* ── Widget card flotante ── */}
      <div className="bk-card-wrap">
        <div className="bk-card">
          <BookingWidget
            salon={salon as SalonPublicData}
            services={(services || []) as ServicePublicData[]}
          />
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="bk-footer">
        Reservas gestionadas por{" "}
        <a
          href="https://beautysyncsv.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          BeautySync
        </a>
      </footer>
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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FAF8F5",
        padding: "24px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "320px" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: "#EDE8E3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: 28,
          }}
        >
          💇‍♀️
        </div>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "#2D2420",
            marginBottom: 8,
            lineHeight: 1.2,
          }}
        >
          {reason === "subscription"
            ? "Reservas temporalmente no disponibles"
            : salonName
              ? `${salonName} no está disponible`
              : "Salón no disponible"}
        </h1>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#9C8E85",
            lineHeight: 1.6,
          }}
        >
          {reason === "subscription"
            ? "Este salón tiene su plan pausado. Contacta directamente para agendar."
            : "Este salón no está aceptando reservas en este momento."}
        </p>
      </div>
    </div>
  );
}
