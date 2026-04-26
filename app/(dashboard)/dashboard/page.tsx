// app/(dashboard)/dashboard/page.tsx
//
// Fase 8.2 — Dashboard con métricas y estadísticas
//
// Server Component puro — todas las queries corren en servidor.
// Client Components solo para interactividad (gráficas, animaciones).
//
// Queries ejecutadas en paralelo con Promise.all():
//   1. Datos del salón + suscripción + perfil
//   2. Citas del mes actual (con servicio)
//   3. Citas del mes anterior (solo conteo)
//   4. Citas de los últimos 90 días (para heatmap)
//   5. Citas de las últimas 8 semanas (para gráfica)
//
// TIMEZONE: America/El_Salvador (UTC-6) — siempre usando nowSV
// IDOR: todas las queries filtran por salon_id del usuario autenticado
// NUNCA exponer SUPABASE_SERVICE_ROLE_KEY al cliente

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

import { CalendarDays, DollarSign, UserPlus, TrendingDown } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard — BeautySync" };
export const dynamic = "force-dynamic";

// ─── Helpers de timezone ──────────────────────────────────────────────────────

/**
 * Retorna un Date en timezone America/El_Salvador.
 * NUNCA usar new Date() directamente — regla crítica del proyecto.
 */
function getNowSV(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/El_Salvador" }),
  );
}

/**
 * Retorna el inicio del mes actual en UTC como ISO string.
 * Ej: si es 26 abril 2026 en SV → "2026-04-01T06:00:00.000Z" (UTC-6)
 */
function getMonthRange(offsetMonths = 0): { start: string; end: string } {
  const now = getNowSV();
  const year = now.getFullYear();
  const month = now.getMonth() + offsetMonths;

  // Inicio: día 1 del mes a las 00:00 SV = 06:00 UTC
  const start = new Date(Date.UTC(year, month, 1, 6, 0, 0));
  // Fin: día 1 del mes siguiente a las 00:00 SV
  const end = new Date(Date.UTC(year, month + 1, 1, 6, 0, 0));

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/**
 * Retorna ISO string de hace N días desde ahora (SV).
 */
function daysAgoISO(days: number): string {
  const now = getNowSV();
  now.setDate(now.getDate() - days);
  return now.toISOString();
}

/**
 * Retorna el número de semana ISO (1–53) de una fecha.
 */
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

/**
 * Retorna "YYYY-Www" como clave única de semana.
 */
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

/**
 * Ingresos estimados: suma de price de citas confirmed + completed.
 */
function calcRevenue(appointments: AppointmentWithService[]): number {
  return appointments
    .filter((a) => a.status === "confirmed" || a.status === "completed")
    .reduce((sum, a) => sum + (a.services?.price ?? 0), 0);
}

/**
 * Clientas nuevas del mes: emails que NO aparecen en el mes anterior.
 * Compara client_email del mes actual vs mes anterior.
 */
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

/**
 * Tasa de cancelación del mes (%).
 */
function calcCancellationRate(appointments: AppointmentWithService[]): number {
  if (!appointments.length) return 0;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;
  return Math.round((cancelled / appointments.length) * 100);
}

/**
 * Delta porcentual entre dos números (mes actual vs mes anterior).
 * Retorna null si no hay datos previos suficientes.
 */
function calcDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Top 5 servicios del mes por cantidad de citas.
 */
function calcTopServices(
  appointments: AppointmentWithService[],
): TopServiceDataPoint[] {
  // Solo citas no canceladas
  const active = appointments.filter((a) => a.status !== "cancelled");

  // Agrupar por servicio
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

/**
 * Datos del heatmap: citas por día de semana (últimos 90 días).
 * day_of_week: 0 = Domingo en JS, pero mostramos Lun→Dom.
 */
function calcWeekdayHeatmap(
  appointments: AppointmentWithService[],
): WeekdayDataPoint[] {
  const DAYS: Array<{ day: string; dayFull: string; jsDay: number }> = [
    { day: "Lun", dayFull: "Lunes", jsDay: 1 },
    { day: "Mar", dayFull: "Martes", jsDay: 2 },
    { day: "Mié", dayFull: "Miércoles", jsDay: 3 },
    { day: "Jue", dayFull: "Jueves", jsDay: 4 },
    { day: "Vie", dayFull: "Viernes", jsDay: 5 },
    { day: "Sáb", dayFull: "Sábado", jsDay: 6 },
    { day: "Dom", dayFull: "Domingo", jsDay: 0 },
  ];

  // Contar por día de semana — solo citas no canceladas
  const counts = new Array(7).fill(0);
  for (const appt of appointments) {
    if (appt.status === "cancelled" || !appt.scheduled_at) continue;
    const date = new Date(appt.scheduled_at);
    const jsDay = date.getDay(); // 0 = Dom
    // Mapear jsDay a índice en DAYS (Lun=0 ... Dom=6)
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

/**
 * Datos de la gráfica de barras: citas por semana (últimas 8 semanas).
 */
function calcWeeklyChart(
  appointments: AppointmentWithService[],
): WeeklyDataPoint[] {
  const now = getNowSV();
  const currentKey = getWeekKey(now);

  // Construir mapa de las últimas 8 semanas
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

  // Rellenar con citas reales — solo no canceladas
  for (const appt of appointments) {
    if (appt.status === "cancelled" || !appt.scheduled_at) continue;
    const date = new Date(appt.scheduled_at);
    const key = getWeekKey(date);
    const week = weeksMap.get(key);
    if (!week) continue;
    week.citas += 1;
    if (appt.status === "confirmed" || appt.status === "completed") {
      week.ingresos += appt.services?.price ?? 0;
    }
  }

  // Retornar en orden cronológico (más antigua → más reciente)
  return Array.from(weeksMap.values());
}

/**
 * Formatea un número como moneda SV.
 * Ej: 1234.5 → "$1,234.50"
 */
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

  // ── Auth ────────────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Datos básicos del salón ─────────────────────────────────────────────────
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

  // ── Rangos de fecha ─────────────────────────────────────────────────────────
  const currentMonth = getMonthRange(0); // mes actual
  const previousMonth = getMonthRange(-1); // mes anterior
  const ninetyDaysAgo = daysAgoISO(90);
  const fiftyDaysAgo = daysAgoISO(56); // ~8 semanas

  // ── Queries en paralelo ─────────────────────────────────────────────────────
  // IDOR: todas filtran por salon.id — nunca por user.id directamente
  const [
    { data: currentAppts },
    { data: previousAppts },
    { data: ninetyDayAppts },
    { data: weeklyAppts },
  ] = await Promise.all([
    // Citas del mes actual con datos del servicio
    supabase
      .from("appointments")
      .select(
        "id, salon_id, service_id, client_email, scheduled_at, status, services(id, name, price)",
      )
      .eq("salon_id", salon.id)
      .gte("scheduled_at", currentMonth.start)
      .lt("scheduled_at", currentMonth.end),

    // Citas del mes anterior — solo lo necesario para comparar
    supabase
      .from("appointments")
      .select(
        "id, salon_id, service_id, client_email, scheduled_at, status, services(id, name, price)",
      )
      .eq("salon_id", salon.id)
      .gte("scheduled_at", previousMonth.start)
      .lt("scheduled_at", previousMonth.end),

    // Últimos 90 días para el heatmap
    supabase
      .from("appointments")
      .select("id, salon_id, scheduled_at, status")
      .eq("salon_id", salon.id)
      .gte("scheduled_at", ninetyDaysAgo),

    // Últimas ~8 semanas para la gráfica
    supabase
      .from("appointments")
      .select("id, salon_id, scheduled_at, status, services(id, name, price)")
      .eq("salon_id", salon.id)
      .gte("scheduled_at", fiftyDaysAgo),
  ]);

  // ── markPastAppointmentsAsNoShow ────────────────────────────────────────────
  // Corre después de las queries para no bloquear la carga principal
  await markPastAppointmentsAsNoShow(salon.id);

  // ── Calcular métricas ───────────────────────────────────────────────────────
  const safeCurrentAppts = (currentAppts ?? []) as AppointmentWithService[];
  const safePreviousAppts = (previousAppts ?? []) as AppointmentWithService[];
  const safeNinetyAppts = (ninetyDayAppts ?? []) as AppointmentWithService[];
  const safeWeeklyAppts = (weeklyAppts ?? []) as AppointmentWithService[];

  // KPIs del mes
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

  // Deltas (% vs mes anterior)
  const citasDelta = calcDelta(citasCurrentMonth, citasPreviousMonth);
  const revenueDelta = calcDelta(revenueCurrentMonth, revenuePreviousMonth);

  // Componentes de visualización
  const topServices = calcTopServices(safeCurrentAppts);
  const weekdayData = calcWeekdayHeatmap(safeNinetyAppts);
  const weeklyData = calcWeeklyChart(safeWeeklyAppts);

  // Datos de UI
  const isWelcome = params.welcome === "true";
  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  const primaryColor = salon.primary_color ?? "#D4375F";

  // ── Render ──────────────────────────────────────────────────────────────────
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

        {/* ── Sección: KPIs del mes ────────────────────────────────────────── */}
        <section>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#C4B8B0", letterSpacing: "0.12em" }}
          >
            Este mes
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={CalendarDays}
              label="Citas"
              value={String(citasCurrentMonth)}
              delta={citasDelta}
              deltaLabel="vs mes anterior"
              primaryColor={primaryColor}
              index={0}
            />
            <MetricCard
              icon={DollarSign}
              label="Ingresos estimados"
              value={formatCurrency(revenueCurrentMonth)}
              delta={revenueDelta}
              deltaLabel="vs mes anterior"
              primaryColor={primaryColor}
              index={1}
              skeletonWidth="w-24"
            />
            <MetricCard
              icon={UserPlus}
              label="Clientas nuevas"
              value={String(newClients)}
              primaryColor={primaryColor}
              index={2}
            />
            <MetricCard
              icon={TrendingDown}
              label="Cancelaciones"
              value={`${cancellationRate}%`}
              primaryColor={primaryColor}
              index={3}
            />
          </div>
        </section>

        {/* ── Sección: Agenda de hoy ──────────────────────────────────────── */}
        <section>
          <TodayAppointments salonId={salon.id} />
        </section>

        {/* ── Sección: Gráfica + Heatmap ──────────────────────────────────── */}
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

        {/* ── Sección: Servicios más populares ────────────────────────────── */}
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
