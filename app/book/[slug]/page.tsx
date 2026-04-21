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

// Generar metadata dinámica con nombre del salón
export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: salon } = await supabase
    .from("salons")
    .select("name, slug")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!salon) {
    return {
      title: "Salón no encontrado · BeautySync",
    };
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

export default async function BookPage({ params }: BookPageProps) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  // 1. Obtener datos del salón por slug (política RLS pública activa)
  const { data: salon, error: salonError } = await supabase
    .from("salons")
    .select("id, name, slug, address, phone, primary_color, logo_url, is_active")
    .eq("slug", slug)
    .single();

  if (salonError || !salon) {
    notFound();
  }

  if (!salon.is_active) {
    return <SalonInactivePage salonName={salon.name} />;
  }

  // 2. Verificar que tiene suscripción activa o en trialing
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, trial_ends_at, current_period_end")
    .eq("salon_id", salon.id)
    .single();

  const isSubscriptionValid =
    subscription &&
    (subscription.status === "active" ||
      subscription.status === "trialing");

  if (!isSubscriptionValid) {
    return <SalonInactivePage salonName={salon.name} reason="subscription" />;
  }

  // 3. Obtener servicios activos del salón
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

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#FAF8F5" }}
    >
      {/* Decorative top bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Main content */}
      <main className="px-4 py-8 sm:py-12">
        <BookingWidget
          salon={salon as SalonPublicData}
          services={(services || []) as ServicePublicData[]}
        />
      </main>
    </div>
  );
}

// ─── Fallback components ──────────────────────────────────────────────────────

function SalonInactivePage({
  salonName,
  reason,
}: {
  salonName?: string;
  reason?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-[#EDE8E3] flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">💇‍♀️</span>
        </div>
        <h1 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-[#2D2420] mb-2">
          {reason === "subscription"
            ? "Reservas temporalmente no disponibles"
            : salonName
            ? `${salonName} no está disponible`
            : "Salón no disponible"}
        </h1>
        <p className="text-[#9C8E85] text-sm leading-relaxed">
          {reason === "subscription"
            ? "Este salón tiene su plan pausado. Contacta directamente para agendar."
            : "Este salón no está aceptando reservas en este momento."}
        </p>
      </div>
    </div>
  );
}