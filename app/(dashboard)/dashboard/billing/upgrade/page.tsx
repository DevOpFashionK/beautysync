/**
 * app/(dashboard)/dashboard/billing/upgrade/page.tsx
 * Página de upgrade dedicada — BeautySync Fase 6.3
 * Server Component — foco en conversión de trial/expired a pago
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PricingPlans } from "@/components/dashboard/billing/PricingPlans";
import { Sparkles, ArrowLeft, Clock, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Elige tu plan — BeautySync",
};

export const dynamic = "force-dynamic";

// ── Mensajes según el motivo de redirección ──────────────────────────────────
const REASON_CONFIG = {
  expired: {
    icon: Clock,
    title: "Tu período de prueba ha terminado",
    description:
      "Esperamos que hayas disfrutado los 14 días. Elige un plan para seguir gestionando tu salón sin interrupciones.",
    color: "#D97706", // amber
    bg: "#FEF3C7",
    border: "#FDE68A",
  },
  canceled: {
    icon: XCircle,
    title: "Tu suscripción fue cancelada",
    description:
      "Puedes reactivar tu cuenta en cualquier momento eligiendo el plan que mejor se adapte a tu salón.",
    color: "#9C8E85",
    bg: "#FAF8F5",
    border: "#EDE8E3",
  },
  no_subscription: {
    icon: AlertCircle,
    title: "Activa tu suscripción",
    description:
      "Elige un plan para comenzar a usar BeautySync y gestionar las citas de tu salón.",
    color: "#D4375F",
    bg: "#FFF1F4",
    border: "#FFD6E0",
  },
} as const;

type ReasonKey = keyof typeof REASON_CONFIG;

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const params = await searchParams;

  // ── Auth ─────────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // ── Salón ─────────────────────────────────────────────────────────────────
  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, primary_color")
    .eq("owner_id", user.id)
    .single();

  if (!salon) redirect("/dashboard");

  // ── Suscripción actual ────────────────────────────────────────────────────
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("salon_id", salon.id)
    .maybeSingle();

  const primaryColor = salon.primary_color ?? "#D4375F";

  // ── Razón de la redirección ───────────────────────────────────────────────
  const reason = (params.reason ?? "expired") as ReasonKey;
  const config = REASON_CONFIG[reason] ?? REASON_CONFIG.expired;
  const Icon = config.icon;

  return (
    <div className="min-h-full bg-[#FAF8F5]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Volver al billing */}
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-1.5 text-sm text-[#9C8E85]
            hover:text-[#2D2420] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Ver facturación
        </Link>

        {/* Header con contexto */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5" style={{ color: primaryColor }} />
            <p
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: primaryColor }}
            >
              Elige tu plan
            </p>
          </div>
          <h1 className="font-display text-3xl text-[#2D2420]">
            Continúa con BeautySync
          </h1>
          <p className="text-[#9C8E85] text-sm mt-1">
            Sin contratos. Cancela cuando quieras.
          </p>
        </div>

        {/* Banner de contexto según reason */}
        <div
          className="rounded-2xl p-4 border flex items-start gap-3"
          style={{
            backgroundColor: config.bg,
            borderColor: config.border,
          }}
        >
          <Icon
            className="w-5 h-5 mt-0.5 shrink-0"
            style={{ color: config.color }}
          />
          <div>
            <p
              className="font-semibold text-sm"
              style={{ color: config.color }}
            >
              {config.title}
            </p>
            <p className="text-xs text-[#9C8E85] mt-0.5">
              {config.description}
            </p>
          </div>
        </div>

        {/* Cards de planes — reutiliza el componente existente */}
        <PricingPlans
          currentPlan={subscription?.plan}
          currentStatus={subscription?.status}
          primaryColor={primaryColor}
        />

        {/* Nota de soporte */}
        <div className="text-center pb-4">
          <p className="text-xs text-[#C4B8B0]">
            ¿Tienes preguntas?{" "}
            <a
              href="mailto:soporte@beautysync.co"
              className="underline hover:text-[#9C8E85] transition-colors"
            >
              soporte@beautysync.co
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
