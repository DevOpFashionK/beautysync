// app/(dashboard)/dashboard/page.tsx
//
// FIX Hydration Error #418:
// DashboardHeader se carga con dynamic() + ssr:false para que NUNCA
// se renderice en el servidor. El servidor no puede conocer la timezone
// del usuario, así que cualquier contenido que dependa de new Date()
// local debe cargarse exclusivamente en el cliente.

import { redirect } from "next/navigation";
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { markPastAppointmentsAsNoShow } from "@/lib/autoNoShow";
import TodayAppointments from "@/components/dashboard/TodayAppointments";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import SubscriptionStatus from "@/components/dashboard/SubscriptionStatus";

// ssr:false → nunca se renderiza en servidor → elimina hydration mismatch #418
const DashboardHeader = dynamic(
  () => import("@/components/dashboard/DashboardHeader"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse">
        <div className="h-3 w-24 rounded-full bg-[#EDE8E3] mb-3" />
        <div className="h-10 w-72 rounded-xl bg-[#EDE8E3] mb-2" />
        <div className="h-3 w-40 rounded-full bg-[#EDE8E3]" />
        <div className="mt-5 h-px w-full bg-[#E8E0D8]" />
      </div>
    ),
  },
);

export const metadata: Metadata = { title: "Dashboard — BeautySync" };
export const revalidate = 0; // equivalente a force-dynamic para Server Components

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

        <DashboardHeader
          salonName={salon.name}
          firstName={firstName}
          primaryColor={salon.primary_color ?? "#D4375F"}
        />

        <TodayAppointments salonId={salon.id} />
      </div>
    </div>
  );
}
