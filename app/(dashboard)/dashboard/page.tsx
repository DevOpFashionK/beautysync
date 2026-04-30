// app/(dashboard)/dashboard/page.tsx
//
// Fase 8.3 — Dashboard completo con métricas por categorías + exportación PDF
// Dark Atelier redesign — solo cambia el shell visual, lógica intacta.
//
// Secciones:
//   - Actividad   : Citas, No-Shows, Cancelaciones
//   - Finanzas    : Ingresos, Ticket Promedio, Comparativo anual
//   - Tendencias  : Gráfica barras + Gráfica líneas
//   - Retención   : Anillos Rebooking + Frecuencia de visita
//   - Servicios   : Top 5 del mes
//
// Timezone: America/El_Salvador via getNowSV()
// IDOR: todas las queries filtran por salon.id

import { redirect } from "next/navigation";
import { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { markPastAppointmentsAsNoShow } from "@/lib/autoNoShow";

// Componentes existentes
import TodayAppointments from "@/components/dashboard/TodayAppointments";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import SubscriptionStatus from "@/components/dashboard/SubscriptionStatus";
import DashboardHeaderWrapper from "@/components/dashboard/DashboardHeaderWrapper";

// Componentes Fase 8.2
import MetricCard from "@/components/dashboard/metrics/MetricCard";
import AppointmentsChart from "@/components/dashboard/metrics/AppointmentsChart";
import TopServices from "@/components/dashboard/metrics/TopServices";
import WeekdayHeatmap from "@/components/dashboard/metrics/WeekdayHeatmap";

// Componentes Fase 8.3
import RevenueLineChart from "@/components/dashboard/metrics/RevenueLineChart";
import RetentionMetrics from "@/components/dashboard/metrics/RetentionMetrics";
import ExportReportButton from "@/components/dashboard/metrics/ExportReportButton";

import type { WeeklyDataPoint } from "@/components/dashboard/metrics/AppointmentsChart";
import type { WeekdayDataPoint } from "@/components/dashboard/metrics/WeekdayHeatmap";
import type { TopServiceDataPoint } from "@/components/dashboard/metrics/TopServices";
import type { DailyRevenuePoint } from "@/components/dashboard/metrics/RevenueLineChart";
import type { RetentionData } from "@/components/dashboard/metrics/RetentionMetrics";
import type { ReportData } from "@/components/dashboard/metrics/ExportReportButton";

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

function getMonthLabel(offsetMonths = 0): string {
  const now = getNowSV();
  const date = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1);
  return date.toLocaleDateString("es-SV", {
    month: "long",
    year: "numeric",
    timeZone: "America/El_Salvador",
  });
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

interface AppointmentRow {
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
    duration_minutes: number;
  } | null;
}

// ─── Helpers de formato ───────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function calcDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

// ─── Cálculo de métricas ──────────────────────────────────────────────────────

function calcRevenue(appts: AppointmentRow[]): number {
  return appts
    .filter((a) => a.status === "confirmed" || a.status === "completed")
    .reduce((sum, a) => sum + (a.services?.price ?? 0), 0);
}

function calcTicketPromedio(appts: AppointmentRow[]): number {
  const completed = appts.filter((a) => a.status === "completed");
  if (!completed.length) return 0;
  return (
    completed.reduce((sum, a) => sum + (a.services?.price ?? 0), 0) /
    completed.length
  );
}

function calcNewClients(
  current: AppointmentRow[],
  previous: AppointmentRow[],
): number {
  const prevEmails = new Set(
    previous.map((a) => a.client_email).filter(Boolean) as string[],
  );
  return new Set(
    current
      .map((a) => a.client_email)
      .filter((e): e is string => Boolean(e) && !prevEmails.has(e!)),
  ).size;
}

function calcNoShowRate(appts: AppointmentRow[]): number {
  if (!appts.length) return 0;
  return Math.round(
    (appts.filter((a) => a.status === "no_show").length / appts.length) * 100,
  );
}

function calcCancellationRate(appts: AppointmentRow[]): number {
  if (!appts.length) return 0;
  return Math.round(
    (appts.filter((a) => a.status === "cancelled").length / appts.length) * 100,
  );
}

function calcTopServices(appts: AppointmentRow[]): TopServiceDataPoint[] {
  const active = appts.filter((a) => a.status !== "cancelled");
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

function calcWeekdayHeatmap(appts: AppointmentRow[]): WeekdayDataPoint[] {
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
  for (const appt of appts) {
    if (appt.status === "cancelled" || !appt.scheduled_at) continue;
    const idx = DAYS.findIndex(
      (d) => d.jsDay === new Date(appt.scheduled_at!).getDay(),
    );
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

function calcWeeklyChart(appts: AppointmentRow[]): WeeklyDataPoint[] {
  const now = getNowSV();
  const currentKey = getWeekKey(now);
  const weeksMap = new Map<string, WeeklyDataPoint>();
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
  for (const appt of appts) {
    if (appt.status === "cancelled" || !appt.scheduled_at) continue;
    const week = weeksMap.get(getWeekKey(new Date(appt.scheduled_at)));
    if (!week) continue;
    week.citas += 1;
    if (appt.status === "confirmed" || appt.status === "completed") {
      week.ingresos += appt.services?.price ?? 0;
    }
  }
  return Array.from(weeksMap.values());
}

function calcDailyRevenue(
  currentAppts: AppointmentRow[],
  previousAppts: AppointmentRow[],
): DailyRevenuePoint[] {
  const now = getNowSV();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const todayDay = now.getDate();
  const prevDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();

  const currentByDay = new Array(daysInMonth + 1).fill(0);
  const previousByDay = new Array(prevDays + 1).fill(0);

  for (const appt of currentAppts) {
    if (
      (appt.status !== "confirmed" && appt.status !== "completed") ||
      !appt.scheduled_at
    )
      continue;
    const day = new Date(appt.scheduled_at).getDate();
    if (day >= 1 && day <= daysInMonth)
      currentByDay[day] += appt.services?.price ?? 0;
  }
  for (const appt of previousAppts) {
    if (
      (appt.status !== "confirmed" && appt.status !== "completed") ||
      !appt.scheduled_at
    )
      continue;
    const day = new Date(appt.scheduled_at).getDate();
    if (day >= 1 && day <= prevDays)
      previousByDay[day] += appt.services?.price ?? 0;
  }

  const points: DailyRevenuePoint[] = [];
  let cumulCurrent = 0,
    cumulPrevious = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    cumulCurrent += currentByDay[day] ?? 0;
    cumulPrevious += previousByDay[day] ?? 0;
    points.push({
      day,
      dayLabel: String(day),
      cumulativeCurrent: day <= todayDay ? cumulCurrent : 0,
      cumulativePrevious: day <= prevDays ? cumulPrevious : 0,
    });
  }
  return points;
}

function calcRetention(appts90Days: AppointmentRow[]): RetentionData {
  const valid = appts90Days.filter(
    (a) => a.status !== "cancelled" && a.client_email,
  );
  const clientMap = new Map<string, Date[]>();
  for (const appt of valid) {
    if (!appt.client_email || !appt.scheduled_at) continue;
    const dates = clientMap.get(appt.client_email) ?? [];
    dates.push(new Date(appt.scheduled_at));
    clientMap.set(appt.client_email, dates);
  }
  const totalClients = clientMap.size;
  const sixtyDaysAgo = new Date(
    getNowSV().getTime() - 60 * 24 * 60 * 60 * 1000,
  );
  let rebookingCount = 0;
  const freqDiffs: number[] = [];

  for (const [, dates] of clientMap) {
    const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
    if (sorted.filter((d) => d >= sixtyDaysAgo).length >= 2) rebookingCount++;
    for (let i = 1; i < sorted.length; i++) {
      const diff =
        (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24);
      if (diff > 0 && diff <= 180) freqDiffs.push(diff);
    }
  }

  return {
    rebookingRate:
      totalClients > 0 ? Math.round((rebookingCount / totalClients) * 100) : 0,
    rebookingCount,
    visitFrequency:
      freqDiffs.length > 0
        ? Math.round(freqDiffs.reduce((a, b) => a + b, 0) / freqDiffs.length)
        : 0,
    totalClients,
  };
}

// ─── Subcomponente: Section Label — Dark Atelier ──────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "16px",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: "16px",
          height: "1px",
          background: "rgba(255,45,85,0.55)",
          flexShrink: 0,
        }}
      />
      <p
        style={{
          fontSize: "10px",
          fontWeight: 400,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "rgba(255,45,85,0.55)",
          margin: 0,
        }}
      >
        {children}
      </p>
      <span
        style={{
          flex: 1,
          height: "1px",
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.05) 0%, transparent 100%)",
        }}
      />
    </div>
  );
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
  const yearAgoMonth = getMonthRange(-12);
  const ninetyDaysAgo = daysAgoISO(90);
  const fiftyDaysAgo = daysAgoISO(56);

  // Queries en paralelo — todas con salon.id (IDOR prevention)
  const [
    { data: currentAppts },
    { data: previousAppts },
    { data: yearAgoAppts },
    { data: ninetyDayAppts },
    { data: weeklyAppts },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, salon_id, service_id, client_email, scheduled_at, status, services(id, name, price, duration_minutes)",
      )
      .eq("salon_id", salon.id)
      .gte("scheduled_at", currentMonth.start)
      .lt("scheduled_at", currentMonth.end),
    supabase
      .from("appointments")
      .select(
        "id, salon_id, service_id, client_email, scheduled_at, status, services(id, name, price, duration_minutes)",
      )
      .eq("salon_id", salon.id)
      .gte("scheduled_at", previousMonth.start)
      .lt("scheduled_at", previousMonth.end),
    supabase
      .from("appointments")
      .select("id, salon_id, scheduled_at, status, services(id, name, price)")
      .eq("salon_id", salon.id)
      .gte("scheduled_at", yearAgoMonth.start)
      .lt("scheduled_at", yearAgoMonth.end),
    supabase
      .from("appointments")
      .select(
        "id, salon_id, client_email, scheduled_at, status, services(id, name, price)",
      )
      .eq("salon_id", salon.id)
      .gte("scheduled_at", ninetyDaysAgo),
    supabase
      .from("appointments")
      .select("id, salon_id, scheduled_at, status, services(id, name, price)")
      .eq("salon_id", salon.id)
      .gte("scheduled_at", fiftyDaysAgo),
  ]);

  await markPastAppointmentsAsNoShow(salon.id);

  // Normalizar
  const safeCurrentAppts = (currentAppts ?? []) as AppointmentRow[];
  const safePreviousAppts = (previousAppts ?? []) as AppointmentRow[];
  const safeYearAgoAppts = (yearAgoAppts ?? []) as AppointmentRow[];
  const safeNinetyAppts = (ninetyDayAppts ?? []) as AppointmentRow[];
  const safeWeeklyAppts = (weeklyAppts ?? []) as AppointmentRow[];

  // Métricas de Actividad
  const citasCurrentMonth = safeCurrentAppts.filter(
    (a) => a.status !== "cancelled",
  ).length;
  const citasPreviousMonth = safePreviousAppts.filter(
    (a) => a.status !== "cancelled",
  ).length;
  const noShowRate = calcNoShowRate(safeCurrentAppts);
  const noShowRatePrev = calcNoShowRate(safePreviousAppts);
  const cancellationRate = calcCancellationRate(safeCurrentAppts);
  const cancellationRatePrev = calcCancellationRate(safePreviousAppts);
  const citasDelta = calcDelta(citasCurrentMonth, citasPreviousMonth);
  const noShowDelta = calcDelta(noShowRate, noShowRatePrev);
  const cancellationDelta = calcDelta(cancellationRate, cancellationRatePrev);

  // Métricas de Finanzas
  const revenueCurrentMonth = calcRevenue(safeCurrentAppts);
  const revenuePreviousMonth = calcRevenue(safePreviousAppts);
  const revenueYearAgo = calcRevenue(safeYearAgoAppts);
  const ticketPromedio = calcTicketPromedio(safeCurrentAppts);
  const ticketPrevio = calcTicketPromedio(safePreviousAppts);
  const newClients = calcNewClients(safeCurrentAppts, safePreviousAppts);
  const revenueDelta = calcDelta(revenueCurrentMonth, revenuePreviousMonth);
  const revenueYearDelta = calcDelta(revenueCurrentMonth, revenueYearAgo);
  const ticketDelta = calcDelta(ticketPromedio, ticketPrevio);

  // Visualizaciones
  const topServices = calcTopServices(safeCurrentAppts);
  const weekdayData = calcWeekdayHeatmap(safeNinetyAppts);
  const weeklyData = calcWeeklyChart(safeWeeklyAppts);
  const dailyData = calcDailyRevenue(safeCurrentAppts, safePreviousAppts);
  const retentionData = calcRetention(safeNinetyAppts);

  // Labels
  const currentMonthLabel = getMonthLabel(0);
  const previousMonthLabel = getMonthLabel(-1);

  // UI
  const isWelcome = params.welcome === "true";
  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  const primaryColor = salon.primary_color ?? "#FF2D55";

  // ── ReportData para ExportReportButton ──────────────────────────────────────
  const reportData: ReportData = {
    citasDelMes: citasCurrentMonth,
    citasDelta,
    noShowRate,
    noShowDelta,
    cancellationRate,
    cancellationDelta,
    ingresos: revenueCurrentMonth,
    ingresosDelta: revenueDelta,
    ticketPromedio,
    ticketDelta,
    ingresosYearAgo: revenueYearAgo,
    revenueYearDelta,
    clientasNuevas: newClients,
    clientasVolvieron: retentionData.rebookingCount,
    totalClients: retentionData.totalClients,
    rebookingRate: retentionData.rebookingRate,
    rebookingCount: retentionData.rebookingCount,
    visitFrequency: retentionData.visitFrequency,
    topServices: topServices.map((s) => ({
      name: s.name,
      count: s.count,
      revenue: s.revenue,
      isTop: s.isTop,
    })),
    salonName: salon.name,
    primaryColor,
    currentMonth: currentMonthLabel,
    previousMonth: previousMonthLabel,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#080706" }}>
      {/* Radial de fondo — sutil, no distrae */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(circle at top right, rgba(255,45,85,0.05) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        className="relative max-w-5xl mx-auto flex flex-col"
        style={{
          padding: "40px 32px 80px",
          gap: "48px",
          zIndex: 1,
        }}
      >
        {/* ── Banners ───────────────────────────────────────────────── */}
        {isWelcome && <WelcomeBanner salonName={salon.name} />}
        {subscription && (
          <SubscriptionStatus
            status={subscription.status ?? "trialing"}
            trialEndsAt={subscription.trial_ends_at}
            periodEnd={subscription.current_period_end}
          />
        )}

        {/* ── Header + exportar ─────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <DashboardHeaderWrapper
            salonName={salon.name}
            firstName={firstName}
            primaryColor={primaryColor}
          />
          <ExportReportButton data={reportData} />
        </div>

        {/* ── Agenda del día ────────────────────────────────────────── */}
        <section>
          <TodayAppointments salonId={salon.id} />
        </section>

        {/* ── ACTIVIDAD ─────────────────────────────────────────────── */}
        <section>
          <SectionLabel>Actividad · {currentMonthLabel}</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              icon="calendar"
              label="Citas del mes"
              value={String(citasCurrentMonth)}
              delta={citasDelta}
              deltaLabel="vs mes anterior"
              primaryColor={primaryColor}
              index={0}
            />
            <MetricCard
              icon="no-show"
              label="Tasa de No-Show"
              value={`${noShowRate}%`}
              sublabel="de citas no atendidas"
              delta={noShowDelta != null ? -noShowDelta : null}
              deltaLabel="vs mes anterior"
              primaryColor={primaryColor}
              index={1}
            />
            <MetricCard
              icon="trending-down"
              label="Cancelaciones"
              value={`${cancellationRate}%`}
              sublabel="del total de citas"
              delta={cancellationDelta != null ? -cancellationDelta : null}
              deltaLabel="vs mes anterior"
              primaryColor={primaryColor}
              index={2}
            />
          </div>
        </section>

        {/* ── FINANZAS ──────────────────────────────────────────────── */}
        <section>
          <SectionLabel>Finanzas · {currentMonthLabel}</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              icon="dollar"
              label="Ingresos estimados"
              value={formatCurrency(revenueCurrentMonth)}
              delta={revenueDelta}
              deltaLabel="vs mes anterior"
              primaryColor={primaryColor}
              index={0}
              skeletonWidth="w-24"
            />
            <MetricCard
              icon="ticket"
              label="Ticket promedio"
              value={formatCurrency(ticketPromedio)}
              sublabel="por cita completada"
              delta={ticketDelta}
              deltaLabel="vs mes anterior"
              primaryColor={primaryColor}
              index={1}
              skeletonWidth="w-20"
            />
            <MetricCard
              icon="trending-up"
              label="Vs año anterior"
              value={formatCurrency(revenueYearAgo)}
              sublabel={getMonthLabel(-12)}
              delta={revenueYearDelta}
              deltaLabel="vs mismo mes año ant."
              primaryColor={primaryColor}
              index={2}
              skeletonWidth="w-24"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <MetricCard
              icon="user-plus"
              label="Clientas nuevas"
              value={String(newClients)}
              sublabel="que no visitaron el mes anterior"
              primaryColor={primaryColor}
              index={3}
            />
            <MetricCard
              icon="rebooking"
              label="Clientas que volvieron"
              value={String(retentionData.rebookingCount)}
              sublabel={`de ${retentionData.totalClients} clientas en 60 días`}
              primaryColor={primaryColor}
              index={4}
            />
          </div>
        </section>

        {/* ── TENDENCIAS ────────────────────────────────────────────── */}
        <section>
          <SectionLabel>Tendencias</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <AppointmentsChart
              weeklyData={weeklyData}
              primaryColor={primaryColor}
            />
            <WeekdayHeatmap
              weekdayData={weekdayData}
              primaryColor={primaryColor}
            />
          </div>
          <RevenueLineChart
            dailyData={dailyData}
            primaryColor={primaryColor}
            currentMonth={currentMonthLabel}
            previousMonth={previousMonthLabel}
          />
        </section>

        {/* ── RETENCIÓN ─────────────────────────────────────────────── */}
        <section>
          <SectionLabel>Retención de clientas</SectionLabel>
          <RetentionMetrics data={retentionData} primaryColor={primaryColor} />
        </section>

        {/* ── SERVICIOS ─────────────────────────────────────────────── */}
        <section>
          <SectionLabel>Servicios · {currentMonthLabel}</SectionLabel>
          <TopServices services={topServices} primaryColor={primaryColor} />
        </section>
      </div>
    </div>
  );
}
