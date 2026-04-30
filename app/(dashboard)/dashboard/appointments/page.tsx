// app/(dashboard)/dashboard/appointments/page.tsx
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { markPastAppointmentsAsNoShow } from "@/lib/autoNoShow";
import AppointmentsClient from "@/components/dashboard/appointments/AppointmentsClient";

export const metadata = { title: "Citas · BeautySync" };
export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, primary_color")
    .eq("owner_id", user.id)
    .single();

  if (!salon) redirect("/dashboard");

  // Auto no_show server-side — antes de cargar las citas
  await markPastAppointmentsAsNoShow(salon.id);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      `
      id, client_name, client_email, client_phone, client_notes,
      scheduled_at, ends_at, status, cancellation_reason, cancelled_at, created_at,
      services(id, name, duration_minutes, price)
    `,
    )
    .eq("salon_id", salon.id)
    .gte("scheduled_at", thirtyDaysAgo.toISOString())
    .order("scheduled_at", { ascending: false });

  return (
    <div style={{ minHeight: "100vh", background: "#080706" }}>
      <AppointmentsClient
        salonId={salon.id}
        primaryColor={salon.primary_color || "#FF2D55"}
        initialAppointments={
          (appointments as Parameters<
            typeof AppointmentsClient
          >[0]["initialAppointments"]) || []
        }
      />
    </div>
  );
}
