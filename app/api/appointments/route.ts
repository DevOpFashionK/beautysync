// app/api/appointments/route.ts
//
// ARQUITECTURA DE TIMEZONE:
//
// El servidor corre en UTC. El cliente puede estar en cualquier timezone.
// Nunca asumir que la fecha del servidor == fecha del cliente.
//
// REGLAS:
// 1. Fechas claramente pasadas (antes de ayer UTC): rechazar siempre.
//    Si en UTC ya pasó ayer completo, no puede ser "hoy" en ningún timezone del mundo.
// 2. El día actual del usuario: el cliente envía ?offset=N (minutos de getTimezoneOffset()).
//    El servidor usa ese offset para calcular "hoy" desde la perspectiva del cliente
//    y así marcar correctamente los slots pasados del día actual.
// 3. Días futuros: nunca rechazar, siempre generar slots.
//
// FLUJO scheduled_at:
// - Widget construye: "2026-04-28T14:00:00Z" (Z para pasar validación Zod)
// - route.ts inserta AS IS en Supabase → "2026-04-28 14:00:00+00"
// - parseISOLocal() en utils.ts stripea Z/offset → lee "14:00" → dashboard muestra "02:00 pm" ✅

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkAppointmentLimit } from "@/lib/subscription";
import { z } from "zod";

// ─── Rate Limiting (in-memory, production → Redis) ───────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(
  ip: string,
  maxRequests = 10,
  windowMs = 3600000,
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) return false;
  record.count++;
  return true;
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────
// scheduled_at usa regex permisivo en vez de z.string().datetime().
// z.string().datetime() de Zod v3 rechaza strings con Z sin milisegundos
// en algunas versiones. El regex acepta todas las variantes ISO válidas.

const ISO_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;

const BookingSchema = z.object({
  salon_id: z.string().uuid("salon_id debe ser UUID válido"),
  service_id: z.string().uuid("service_id debe ser UUID válido"),
  client_name: z
    .string()
    .min(2, "Nombre muy corto")
    .max(100, "Nombre muy largo")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/, "Nombre con caracteres inválidos"),
  client_email: z
    .string()
    .email("Email inválido")
    .max(254)
    .optional()
    .or(z.literal("")),
  client_phone: z
    .string()
    .min(7, "Teléfono muy corto")
    .max(20, "Teléfono muy largo")
    .regex(/^[+\d\s\-().]+$/, "Teléfono inválido"),
  client_notes: z
    .string()
    .max(500, "Notas muy largas")
    .optional()
    .or(z.literal("")),
  scheduled_at: z
    .string()
    .regex(ISO_REGEX, "Fecha inválida — se requiere formato ISO 8601"),
});

// ─── Sanitize ─────────────────────────────────────────────────────────────────
function sanitize(value: string): string {
  return value
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

// ─── Helper: "HH:MM" o "HH:MM:SS" → minutos ──────────────────────────────────
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

// ─── Helper: sumar minutos a un ISO string sin conversión de timezone ─────────
// No usar new Date(isoString) para calcular ends_at porque haría
// conversión de timezone en el servidor UTC, desplazando la hora literal.
function addMinutesToISO(isoString: string, minutesToAdd: number): string {
  const clean = isoString.replace(/(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/, "");
  const [datePart, timePart = "00:00:00"] = clean.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);

  let totalMinutes = hours * 60 + minutes + minutesToAdd;
  let extraDays = 0;

  if (totalMinutes >= 24 * 60) {
    extraDays = Math.floor(totalMinutes / (24 * 60));
    totalMinutes = totalMinutes % (24 * 60);
  }

  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;

  let newDay = day + extraDays;
  let newMonth = month;
  let newYear = year;
  const daysInMonth = new Date(year, month, 0).getDate();
  if (newDay > daysInMonth) {
    newDay -= daysInMonth;
    newMonth++;
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
  }

  return [
    `${newYear}-${String(newMonth).padStart(2, "0")}-${String(newDay).padStart(2, "0")}`,
    `T${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}:00Z`,
  ].join("");
}

// ─── Helper: calcular "hoy" desde la perspectiva del cliente ─────────────────
// El cliente envía ?offset=N donde N = new Date().getTimezoneOffset() del browser.
// getTimezoneOffset() retorna minutos DETRÁS de UTC:
//   UTC-6 (El Salvador) → offset = +360
//   UTC+1 (España)      → offset = -60
// Para reconstruir la hora local del cliente: UTC_ms - offset_ms
function getClientDateInfo(offsetMinutes: number): {
  clientToday: string;
  clientNowMinutes: number;
} {
  const clientNowMs = Date.now() - offsetMinutes * 60 * 1000;
  const clientNow = new Date(clientNowMs);
  const y = clientNow.getUTCFullYear();
  const m = String(clientNow.getUTCMonth() + 1).padStart(2, "0");
  const d = String(clientNow.getUTCDate()).padStart(2, "0");
  return {
    clientToday: `${y}-${m}-${d}`,
    clientNowMinutes: clientNow.getUTCHours() * 60 + clientNow.getUTCMinutes(),
  };
}

// ─── GET /api/appointments?salon_id=&date=&service_id=&offset= ────────────────
//
// offset: minutos de timezone del cliente (new Date().getTimezoneOffset()).
//         Opcional — si no se envía, se asume UTC (offset=0).
//         El cliente SIEMPRE debe enviarlo para cálculo correcto de slots pasados.

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const salon_id = searchParams.get("salon_id");
    const date = searchParams.get("date");
    const service_id = searchParams.get("service_id");
    const offsetStr = searchParams.get("offset");

    if (!salon_id || !date || !service_id) {
      return NextResponse.json(
        { error: "salon_id, date y service_id son requeridos" },
        { status: 400 },
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Formato de fecha inválido (YYYY-MM-DD)" },
        { status: 400 },
      );
    }

    // Parsear offset — valor de getTimezoneOffset() del browser
    // Rango válido: -840 (UTC+14) a +720 (UTC-12)
    const offsetMinutes = (() => {
      if (!offsetStr) return 0;
      const n = parseInt(offsetStr, 10);
      if (isNaN(n) || n < -840 || n > 720) return 0;
      return n;
    })();

    // REGLA 1: Rechazar fechas claramente pasadas.
    // Usar "ayer UTC" como límite: si la fecha es anterior a ayer en UTC,
    // no puede ser hoy ni futuro en NINGÚN timezone del mundo.
    // Esto evita rechazar "hoy" para usuarios en timezones detrás de UTC
    // (como UTC-6 después de las 6pm, donde el servidor ya dice que es mañana).
    const [ry, rm, rd] = date.split("-").map(Number);
    const requestedDateUTC = Date.UTC(ry, rm - 1, rd);
    const now = new Date();
    const yesterdayUTC = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - 1,
    );

    if (requestedDateUTC < yesterdayUTC) {
      return NextResponse.json(
        { error: "No se pueden reservar fechas pasadas" },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabaseClient();

    // 1. Verificar salón activo
    const { data: salon, error: salonError } = await supabase
      .from("salons")
      .select("id, is_active, timezone")
      .eq("id", salon_id)
      .eq("is_active", true)
      .single();

    if (salonError || !salon) {
      return NextResponse.json(
        { error: "Salón no encontrado o inactivo" },
        { status: 404 },
      );
    }

    // 2. Obtener servicio
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id, duration_minutes, is_active")
      .eq("id", service_id)
      .eq("salon_id", salon_id)
      .eq("is_active", true)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
        { status: 404 },
      );
    }

    // 3. Verificar business_hours
    // dayOfWeek calculado en UTC puro desde el string date
    const dayOfWeek = new Date(Date.UTC(ry, rm - 1, rd)).getUTCDay();

    const { data: businessHours, error: hoursError } = await supabase
      .from("business_hours")
      .select("is_open, open_time, close_time")
      .eq("salon_id", salon_id)
      .eq("day_of_week", dayOfWeek)
      .single();

    if (hoursError || !businessHours || !businessHours.is_open) {
      return NextResponse.json(
        { slots: [], duration: service.duration_minutes, closed: true },
        { status: 200 },
      );
    }

    // 4. Citas existentes del día
    const dayStart = `${date}T00:00:00Z`;
    const dayEnd = `${date}T23:59:59Z`;

    const { data: existingAppointments, error: apptError } = await supabase
      .from("appointments")
      .select("scheduled_at, ends_at, status")
      .eq("salon_id", salon_id)
      .gte("scheduled_at", dayStart)
      .lte("scheduled_at", dayEnd)
      .not("status", "in", '("cancelled","no_show")');

    if (apptError) {
      return NextResponse.json(
        { error: "Error al consultar disponibilidad" },
        { status: 500 },
      );
    }

    // 5. Generar slots
    const duration = service.duration_minutes;
    const SLOT_INTERVAL = 30;
    const openMinutes = timeToMinutes(businessHours.open_time);
    const closeMinutes = timeToMinutes(businessHours.close_time);

    // REGLA 2: Calcular hora actual del cliente con su offset para marcar slots pasados
    const { clientToday, clientNowMinutes } = getClientDateInfo(offsetMinutes);
    const isToday = date === clientToday;

    const slots: { time: string; available: boolean; datetime: string }[] = [];

    for (
      let minutes = openMinutes;
      minutes + duration <= closeMinutes;
      minutes += SLOT_INTERVAL
    ) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const timeLabel = `${hh}:${mm}`;
      const datetime = `${date}T${hh}:${mm}:00Z`;
      const endMin = minutes + duration;
      const endHH = String(Math.floor(endMin / 60)).padStart(2, "0");
      const endMM = String(endMin % 60).padStart(2, "0");
      const slotEnd = `${date}T${endHH}:${endMM}:00Z`;

      // Slot pasado: solo aplica si el cliente está viendo su día actual
      const isPast = isToday && minutes <= clientNowMinutes;

      // Conflicto con citas existentes — comparación lexicográfica de ISO strings UTC
      const hasConflict = (existingAppointments || []).some((appt) => {
        const apptStart = appt.scheduled_at ?? "";
        const apptEnd = appt.ends_at ?? "";
        return datetime < apptEnd && slotEnd > apptStart;
      });

      slots.push({
        time: timeLabel,
        available: !hasConflict && !isPast,
        datetime,
      });
    }

    return NextResponse.json({ slots, duration }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/appointments]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// ─── POST /api/appointments ───────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    if (!checkRateLimit(ip, 10, 3600000)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta en una hora." },
        { status: 429 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Body JSON inválido" },
        { status: 400 },
      );
    }

    const result = BookingSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Datos inválidos", details: errors },
        { status: 422 },
      );
    }

    const data = result.data;

    const sanitizedData = {
      ...data,
      client_name: sanitize(data.client_name),
      client_notes: data.client_notes ? sanitize(data.client_notes) : null,
      client_email: data.client_email || null,
    };

    const supabase = await createServerSupabaseClient();

    // 1. Verificar salón activo
    const { data: salon, error: salonError } = await supabase
      .from("salons")
      .select("id, is_active")
      .eq("id", sanitizedData.salon_id)
      .eq("is_active", true)
      .single();

    if (salonError || !salon) {
      return NextResponse.json(
        { error: "Salón no disponible para reservas" },
        { status: 404 },
      );
    }

    // 2. Verificar límite de citas del plan
    const limitCheck = await checkAppointmentLimit(sanitizedData.salon_id);

    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error:
            `Este salón alcanzó el límite de ${limitCheck.limit} citas mensuales de su plan. ` +
            `Contacta al salón para más información.`,
        },
        { status: 403 },
      );
    }

    // 3. Verificar servicio  ← (este comentario cambia de 2 a 3)

    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id, duration_minutes, is_active")
      .eq("id", sanitizedData.service_id)
      .eq("salon_id", sanitizedData.salon_id)
      .eq("is_active", true)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        { error: "Servicio no disponible" },
        { status: 404 },
      );
    }

    // 4. Verificar que el día está abierto
    const scheduledStr = sanitizedData.scheduled_at;
    const datePart = scheduledStr.slice(0, 10);
    const [sy, sm, sd] = datePart.split("-").map(Number);
    const dayOfWeek = new Date(Date.UTC(sy, sm - 1, sd)).getUTCDay();

    const { data: businessHours } = await supabase
      .from("business_hours")
      .select("is_open")
      .eq("salon_id", sanitizedData.salon_id)
      .eq("day_of_week", dayOfWeek)
      .single();

    if (!businessHours || !businessHours.is_open) {
      return NextResponse.json(
        { error: "El salón no atiende ese día." },
        { status: 400 },
      );
    }

    // 5. Límite de reservas por cliente por día (máx 2)
    const clientDayStart = `${datePart}T00:00:00Z`;
    const clientDayEnd = `${datePart}T23:59:59Z`;

    const { data: clientAppts } = await supabase
      .from("appointments")
      .select("id")
      .eq("salon_id", sanitizedData.salon_id)
      .eq("client_phone", sanitizedData.client_phone)
      .gte("scheduled_at", clientDayStart)
      .lte("scheduled_at", clientDayEnd)
      .not("status", "in", '("cancelled","no_show")');

    if (clientAppts && clientAppts.length >= 2) {
      return NextResponse.json(
        {
          error:
            "Ya tienes 2 reservas para este día. Contacta al salón para más información.",
        },
        { status: 429 },
      );
    }

    // 6. Verificar disponibilidad en tiempo real (anti race condition)
    const endsAtStr = addMinutesToISO(scheduledStr, service.duration_minutes);

    const { data: conflictingAppts } = await supabase
      .from("appointments")
      .select("id")
      .eq("salon_id", sanitizedData.salon_id)
      .not("status", "in", '("cancelled","no_show")')
      .lt("scheduled_at", endsAtStr)
      .gt("ends_at", scheduledStr);

    if (conflictingAppts && conflictingAppts.length > 0) {
      return NextResponse.json(
        { error: "Este horario ya no está disponible. Por favor elige otro." },
        { status: 409 },
      );
    }

    // 7. Crear la cita — scheduled_at se inserta AS IS para preservar hora literal
    const { data: newAppt, error: insertError } = await supabase
      .from("appointments")
      .insert({
        salon_id: sanitizedData.salon_id,
        service_id: sanitizedData.service_id,
        client_name: sanitizedData.client_name,
        client_email: sanitizedData.client_email,
        client_phone: sanitizedData.client_phone,
        client_notes: sanitizedData.client_notes,
        scheduled_at: scheduledStr,
        ends_at: endsAtStr,
        status: "pending",
      })
      .select("id, scheduled_at, status")
      .single();

    if (insertError) {
      console.error("[POST /api/appointments] Insert error:", insertError);
      return NextResponse.json(
        { error: "No se pudo crear la cita. Intenta nuevamente." },
        { status: 500 },
      );
    }

    // Notificaciones — fire and forget (no bloquea la respuesta al widget)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && newAppt?.id) {
      fetch(`${appUrl}/api/notifications/new-booking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cronSecret}`,
        },
        body: JSON.stringify({ appointmentId: newAppt.id }),
      }).catch((err) => {
        console.error("[Notifications] Error triggering new-booking:", err);
      });
    }

    return NextResponse.json(
      {
        success: true,
        appointment: {
          id: newAppt.id,
          scheduled_at: newAppt.scheduled_at,
          status: newAppt.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/appointments]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
