// app/(dashboard)/dashboard/services/page.tsx
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import ServicesClient from "@/components/dashboard/services/ServicesClient";

export const metadata = {
  title: "Mis Servicios · BeautySync",
};

export default async function ServicesPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, primary_color")
    .eq("owner_id", user.id)
    .single();

  if (!salon) redirect("/dashboard");

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("salon_id", salon.id)
    .order("created_at", { ascending: true });

  return (
    <ServicesClient
      salonId={salon.id}
      salonName={salon.name}
      primaryColor={salon.primary_color || "#D4375F"}
      initialServices={services || []}
    />
  );
}