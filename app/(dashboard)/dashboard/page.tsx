// app/(dashboard)/dashboard/page.tsx
//
// FIX Hydration Error #418:
// Importa DashboardHeaderWrapper (componente cliente) en vez de DashboardHeader.
// El wrapper usa dynamic() + ssr:false internamente — Next.js App Router
// solo permite ssr:false dentro de componentes "use client", no aquí.
//
// Server Component → DashboardHeaderWrapper ("use client")
//   → dynamic(DashboardHeader, { ssr: false })
//     → DashboardHeader nunca se renderiza en servidor → sin mismatch → sin #418

import { redirect } from "next/navigation";
import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { markPastAppointmentsAsNoShow } from "@/lib/autoNoShow";
import TodayAppointments from "@/components/dashboard/TodayAppointments";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import SubscriptionStatus from "@/components/dashboard/SubscriptionStatus";
import DashboardHeaderWrapper from "@/components/dashboard/DashboardHeaderWrapper";

export const metadata: Metadata = { title: "Dashboard — BeautySync" };
export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams: Promise<{ welcome?: string }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const supabase = await createServerSupabaseClient();
  const params = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, slug, primary_color")
    .eq("owner_id", user.id)
    .single();

  if (!salon) redirect("/register");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, trial_ends_at, current_period_end")
    .eq("salon_id", salon.id)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", user.id)
    .single();

  await markPastAppointmentsAsNoShow(salon.id);

  const isWelcome = params.welcome === "true";
  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-16 md:px-10 flex flex-col gap-8">
        {isWelcome && <WelcomeBanner salonName={salon.name} />}

        {subscription && (
          <SubscriptionStatus
            status={subscription.status ?? "trialing"}
            trialEndsAt={subscription.trial_ends_at}
            periodEnd={subscription.current_period_end}
          />
        )}

        {/* Wrapper cliente que carga DashboardHeader con ssr:false */}
        <DashboardHeaderWrapper
          salonName={salon.name}
          firstName={firstName}
          primaryColor={salon.primary_color ?? "#D4375F"}
        />

        <TodayAppointments salonId={salon.id} />
      </div>
    </div>
  );
}
