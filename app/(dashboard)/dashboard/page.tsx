// app/(dashboard)/dashboard/page.tsx
//
// Fase 8.2 — Dashboard con métricas y estadísticas
//
// FIX: MetricCard recibe icon como string identifier ("calendar", "dollar", etc.)
// en vez de componente función (CalendarDays, DollarSign).
// Next.js 16 no permite pasar funciones desde Server → Client Components.
//
// Server Component puro — todas las queries corren en servidor.
// Client Components solo para interactividad (gráficas, animaciones).

import { redirect } from "next/navigation";
import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { markPastAppointmentsAsNoShow } from "@/lib/autoNoShow";

// Componentes existentes — NO tocar
import TodayAppointments from "@/components/dashboard/TodayAppointments";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import SubscriptionStatus from "@/components/dashboard/SubscriptionStatus";
import DashboardHeaderWrapper from "@/components/dashboard/DashboardHeaderWrapper";

// Componentes nuevos Fase 8.2
import MetricCard from "@/components/dashboard/metrics/MetricCard";
import AppointmentsChart from "@/components/dashboard/metrics/AppointmentsChart";
import TopServices from "@/components/dashboard/metrics/TopServices";
import WeekdayHeatmap from "@/components/dashboard/metrics/WeekdayHeatmap";

import type { WeeklyDataPoint } from "@/components/dashboard/metrics/AppointmentsChart";
import type { WeekdayDataPoint } from "@/components/dashboard/metrics/WeekdayHeatmap";
import type { TopServiceDataPoint } from "@/components/dashboard/metrics/TopServices";

export const metadata: Metadata = { title: "Dashboard — BeautySync" };
export const dynamic = "force-dynamic";

// ─── Helpers de timezone ──────────────────────────────────────────────────────

function getNowSV(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/El_Salvador" }),
  );
}

function getMonthRange(offsetMonths = 0): { start: string; end: string } {
  const now = getNowSV();
  const year = now.getFullYear();
  const month = now.getMonth() + offsetMonths;
  const start = new Date(Date.UTC(year, month, 1, 6, 0, 0));
  const end = new Date(Date.UTC(year, month + 1, 1, 6, 0, 0));
  return { start: start.toISOString(), end: end.toISOString() };
}

function daysAgoISO(days: number): string {
  const now = getNowSV();
  now.setDate(now.getDate() - days);
  return now.toISOString();
}

function getISOWeek(date: Date): number {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    )
  );
}

function getWeekKey(date: Date): string {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-W${String(getISOWeek(date)).padStart(2, "0")}`;
}

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface AppointmentWithService {
  id: string;
  salon_id: string;
  service_id: string | null;
  client_email: string | null;
  scheduled_at: string | null;
  status: string | null;
  services: {
    id: string;
    name: string;
    price: number;
  } | null;
}

// ─── Cálculo de métricas ──────────────────────────────────────────────────────

function calcRevenue(appointments: AppointmentWithService[]): number {
  return appointments
    .filter((a) => a.status === "confirmed" || a.status === "completed")
    .reduce((sum, a) => sum + (a.services?.price ?? 0), 0);
}

function calcNewClients(
  currentAppts: AppointmentWithService[],
  previousAppts: AppointmentWithService[],
): number {
  const prevEmails = new Set(
    previousAppts.map((a) => a.client_email).filter(Boolean) as string[],
  );
  const newEmails = new Set(
    currentAppts
      .map((a) => a.client_email)
      .filter((e): e is string => Boolean(e) && !prevEmails.has(e!)),
  );
  return newEmails.size;
}

function calcCancellationRate(appointments: AppointmentWithService[]): number {
  if (!appointments.length) return 0;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;
  return Math.round((cancelled / appointments.length) * 100);
}

function calcDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function calcTopServices(
  appointments: AppointmentWithService[],
): TopServiceDataPoint[] {
  const active = appointments.filter((a) => a.status !== "cancelled");
  const map = new Map<
    string,
    { id: string; name: string; count: number; revenue: number }
  >();

  for (const appt of active) {
    if (!appt.services) continue;
    const key = appt.services.id;
    const current = map.get(key) ?? {
      id: appt.services.id,
      name: appt.services.name,
      count: 0,
      revenue: 0,
    };
    current.count += 1;
    if (appt.status === "confirmed" || appt.status === "completed") {
      current.revenue += appt.services.price;
    }
    map.set(key, current);
  }

  const sorted = Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const maxCount = sorted[0]?.count ?? 1;

  return sorted.map((s, i) => ({
    id: s.id,
    name: s.name,
    count: s.count,
    revenue: s.revenue,
    pct: Math.round((s.count / maxCount) * 100),
    isTop: i === 0,
  }));
}

function calcWeekdayHeatmap(
  appointments: AppointmentWithService[],
): WeekdayDataPoint[] {
  const DAYS = [
    { day: "Lun", dayFull: "Lunes", jsDay: 1 },
    { day: "Mar", dayFull: "Martes", jsDay: 2 },
    { day: "Mié", dayFull: "Miércoles", jsDay: 3 },
    { day: "Jue", dayFull: "Jueves", jsDay: 4 },
    { day: "Vie", dayFull: "Viernes", jsDay: 5 },
    { day: "Sáb", dayFull: "Sábado", jsDay: 6 },
    { day: "Dom", dayFull: "Domingo", jsDay: 0 },
  ];

  const counts = new Array(7).fill(0);
  for (const appt of appointments) {
    if (appt.status === "cancelled" || !appt.scheduled_at) continue;
    const jsDay = new Date(appt.scheduled_at).getDay();
    const idx = DAYS.findIndex((d) => d.jsDay === jsDay);
    if (idx !== -1) counts[idx]++;
  }

  const maxCount = Math.max(...counts, 1);

  return DAYS.map((d, i) => ({
    day: d.day,
    dayFull: d.dayFull,
    count: counts[i],
    pct: Math.round((counts[i] / maxCount) * 100),
    isMax: counts[i] === maxCount && counts[i] > 0,
  }));
}

function calcWeeklyChart(
  appointments: AppointmentWithService[],
): WeeklyDataPoint[] {
  const now = getNowSV();
  const currentKey = getWeekKey(now);

  const weeksMap = new Map<
    string,
    {
      weekLabel: string;
      weekKey: string;
      citas: number;
      ingresos: number;
      isCurrent: boolean;
    }
  >();

  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getTime());
    d.setDate(d.getDate() - i * 7);
    const key = getWeekKey(d);
    const week = getISOWeek(d);
    const label = key === currentKey ? "Esta" : `S${week}`;
    if (!weeksMap.has(key)) {
      weeksMap.set(key, {
        weekLabel: label,
        weekKey: key,
        citas: 0,
        ingresos: 0,
        isCurrent: key === currentKey,
      });
    }
  }

  for (const appt of appointments) {
    if (appt.status === "cancelled" || !appt.scheduled_at) continue;
    const key = getWeekKey(new Date(appt.scheduled_at));
    const week = weeksMap.get(key);
    if (!week) continue;
    week.citas += 1;
    if (appt.status === "confirmed" || appt.status === "completed") {
      week.ingresos += appt.services?.price ?? 0;
    }
  }

  return Array.from(weeksMap.values());
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface DashboardPageProps {
  searchParams: Promise<{ welcome?: string }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const supabase = await createServerSupabaseClient();
  const params = await searchParams;

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Datos básicos
  const [{ data: salon }, { data: profile }] = await Promise.all([
    supabase
      .from("salons")
      .select("id, name, slug, primary_color")
      .eq("owner_id", user.id)
      .single(),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single(),
  ]);

  if (!salon) redirect("/register");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, trial_ends_at, current_period_end")
    .eq("salon_id", salon.id)
    .single();

  // Rangos de fecha
  const currentMonth = getMonthRange(0);
  const previousMonth = getMonthRange(-1);
  const ninetyDaysAgo = daysAgoISO(90);
  const fiftyDaysAgo = daysAgoISO(56);

  // Queries en paralelo — todas filtradas por salon.id (IDOR prevention)
  const [
    { data: currentAppts },
    { data: previousAppts },
    { data: ninetyDayAppts },
    { data: weeklyAppts },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, salon_id, service_id, client_email, scheduled_at, status, services(id, name, price)",
      )
      .eq("salon_id", salon.id)
      .gte("scheduled_at", currentMonth.start)
      .lt("scheduled_at", currentMonth.end),

    supabase
      .from("appointments")
      .select(
        "id, salon_id, service_id, client_email, scheduled_at, status, services(id, name, price)",
      )
      .eq("salon_id", salon.id)
      .gte("scheduled_at", previousMonth.start)
      .lt("scheduled_at", previousMonth.end),

    supabase
      .from("appointments")
      .select("id, salon_id, scheduled_at, status")
      .eq("salon_id", salon.id)
      .gte("scheduled_at", ninetyDaysAgo),

    supabase
      .from("appointments")
      .select("id, salon_id, scheduled_at, status, services(id, name, price)")
      .eq("salon_id", salon.id)
      .gte("scheduled_at", fiftyDaysAgo),
  ]);

  await markPastAppointmentsAsNoShow(salon.id);

  // Calcular métricas
  const safeCurrentAppts = (currentAppts ?? []) as AppointmentWithService[];
  const safePreviousAppts = (previousAppts ?? []) as AppointmentWithService[];
  const safeNinetyAppts = (ninetyDayAppts ?? []) as AppointmentWithService[];
  const safeWeeklyAppts = (weeklyAppts ?? []) as AppointmentWithService[];

  const citasCurrentMonth = safeCurrentAppts.filter(
    (a) => a.status !== "cancelled",
  ).length;
  const citasPreviousMonth = safePreviousAppts.filter(
    (a) => a.status !== "cancelled",
  ).length;
  const revenueCurrentMonth = calcRevenue(safeCurrentAppts);
  const revenuePreviousMonth = calcRevenue(safePreviousAppts);
  const newClients = calcNewClients(safeCurrentAppts, safePreviousAppts);
  const cancellationRate = calcCancellationRate(safeCurrentAppts);
  const citasDelta = calcDelta(citasCurrentMonth, citasPreviousMonth);
  const revenueDelta = calcDelta(revenueCurrentMonth, revenuePreviousMonth);

  const topServices = calcTopServices(safeCurrentAppts);
  const weekdayData = calcWeekdayHeatmap(safeNinetyAppts);
  const weeklyData = calcWeeklyChart(safeWeeklyAppts);

  const isWelcome = params.welcome === "true";
  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  const primaryColor = salon.primary_color ?? "#D4375F";

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-16 md:px-10 flex flex-col gap-8">
        {/* Banners y header — sin cambios */}
        {isWelcome && <WelcomeBanner salonName={salon.name} />}

        {subscription && (
          <SubscriptionStatus
            status={subscription.status ?? "trialing"}
            trialEndsAt={subscription.trial_ends_at}
            periodEnd={subscription.current_period_end}
          />
        )}

        <DashboardHeaderWrapper
          salonName={salon.name}
          firstName={firstName}
          primaryColor={primaryColor}
        />

        {/* ── KPIs del mes ─────────────────────────────────────────────────── */}
        <section>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#C4B8B0", letterSpacing: "0.12em" }}
          >
            Este mes
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* FIX: icon como string — no función */}
            <MetricCard
              icon="calendar"
              label="Citas"
              value={String(citasCurrentMonth)}
              delta={citasDelta}
              deltaLabel="vs mes anterior"
              primaryColor={primaryColor}
              index={0}
            />
            <MetricCard
              icon="dollar"
              label="Ingresos estimados"
              value={formatCurrency(revenueCurrentMonth)}
              delta={revenueDelta}
              deltaLabel="vs mes anterior"
              primaryColor={primaryColor}
              index={1}
              skeletonWidth="w-24"
            />
            <MetricCard
              icon="user-plus"
              label="Clientas nuevas"
              value={String(newClients)}
              primaryColor={primaryColor}
              index={2}
            />
            <MetricCard
              icon="trending-down"
              label="Cancelaciones"
              value={`${cancellationRate}%`}
              primaryColor={primaryColor}
              index={3}
            />
          </div>
        </section>

        {/* ── Agenda de hoy ─────────────────────────────────────────────────── */}
        <section>
          <TodayAppointments salonId={salon.id} />
        </section>

        {/* ── Gráfica + Heatmap ────────────────────────────────────────────── */}
        <section>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#C4B8B0", letterSpacing: "0.12em" }}
          >
            Tendencias
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AppointmentsChart
              weeklyData={weeklyData}
              primaryColor={primaryColor}
            />
            <WeekdayHeatmap
              weekdayData={weekdayData}
              primaryColor={primaryColor}
            />
          </div>
        </section>

        {/* ── Servicios más populares ──────────────────────────────────────── */}
        <section>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#C4B8B0", letterSpacing: "0.12em" }}
          >
            Servicios
          </p>

          <TopServices services={topServices} primaryColor={primaryColor} />
        </section>
      </div>
    </div>
  );
}
