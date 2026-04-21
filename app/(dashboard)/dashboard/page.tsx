import { redirect } from "next/navigation";
import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { markPastAppointmentsAsNoShow } from "@/lib/autoNoShow";
import TodayAppointments from "@/components/dashboard/TodayAppointments";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import SubscriptionStatus from "@/components/dashboard/SubscriptionStatus";

export const metadata: Metadata = { title: "Dashboard — BeautySync" };
export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams: Promise<{ welcome?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createServerSupabaseClient();
  const params = await searchParams;

  const { data: { user } } = await supabase.auth.getUser();
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

  // Auto no_show server-side — una sola vez, sin hooks ni errores 405
  await markPastAppointmentsAsNoShow(salon.id);

  const isWelcome = params.welcome === "true";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  const dateStr = new Date().toLocaleDateString("es-SV", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const dateFormatted = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

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

        {/* Header editorial */}
        <div>
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-2"
            style={{ color: salon.primary_color ?? "#D4375F", letterSpacing: "0.14em" }}
          >
            {salon.name}
          </p>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1">
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 500,
                color: "#2D2420",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              {greeting}{firstName ? `, ${firstName}` : ""}.
            </h1>
            <p className="text-sm pb-1" style={{ color: "#B5A99F", fontWeight: 400 }}>
              {dateFormatted}
            </p>
          </div>

          <div
            className="mt-5 h-px w-full"
            style={{ background: "linear-gradient(90deg, #E8E0D8 0%, transparent 80%)" }}
          />
        </div>

        <TodayAppointments salonId={salon.id} />

      </div>
    </div>
  );
}