// app/(dashboard)/dashboard/clients/page.tsx
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import ClientsClient from "@/components/dashboard/clients/ClientsClient";

export const metadata = {
  title: "Clientas · BeautySync",
};

export default async function ClientsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, primary_color")
    .eq("owner_id", user.id)
    .single();

  if (!salon) redirect("/dashboard");

  const { data: rawAppointments } = await supabase
    .from("appointments")
    .select(`
      id, client_name, client_email, client_phone,
      scheduled_at, status,
      services(id, name, price)
    `)
    .eq("salon_id", salon.id)
    .not("status", "in", '("cancelled","no_show")')
    .order("scheduled_at", { ascending: false });

  const appointments = (rawAppointments ?? []).map((a) => ({
    ...a,
    status: (a.status ?? "pending") as
      | "pending"
      | "confirmed"
      | "cancelled"
      | "completed"
      | "no_show",
  }));

  return (
    <ClientsClient
      primaryColor={salon.primary_color ?? "#D4375F"}
      appointments={appointments}
    />
  );
}