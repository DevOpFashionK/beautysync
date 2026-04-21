// app/api/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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
    .datetime({ message: "Fecha inválida (ISO 8601 requerido)" }),
});

// ─── Sanitize ─────────────────────────────────────────────────────────────────
function sanitize(value: string): string {
  return value
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

// ─── Helper: "HH:MM:SS" → minutos ────────────────────────────────────────────
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

// ─── GET /api/appointments?salon_id=&date=&service_id= ────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const salon_id = searchParams.get("salon_id");
    const date = searchParams.get("date");
    const service_id = searchParams.get("service_id");

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

    const selectedDate = new Date(date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
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
    const dayOfWeek = selectedDate.getDay();

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
    const dayStart = `${date}T00:00:00`;
    const dayEnd = `${date}T23:59:59`;

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

    // 5. Generar slots con horario real del salón
    const duration = service.duration_minutes;
    const SLOT_INTERVAL_MINUTES = 30;
    const openMinutes = timeToMinutes(businessHours.open_time);
    const closeMinutes = timeToMinutes(businessHours.close_time);

    const slots: { time: string; available: boolean; datetime: string }[] = [];
    const baseDate = new Date(`${date}T00:00:00`);
    const now = new Date();

    for (
      let minutes = openMinutes;
      minutes + duration <= closeMinutes;
      minutes += SLOT_INTERVAL_MINUTES
    ) {
      const slotStart = new Date(baseDate);
      slotStart.setHours(0, minutes, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);

      const hasConflict = (existingAppointments || []).some((appt) => {
        const apptStart = new Date(appt.scheduled_at);
        const apptEnd = new Date(appt.ends_at);
        return slotStart < apptEnd && slotEnd > apptStart;
      });

      const isPast = slotStart <= now;

      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      const timeLabel = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

      slots.push({
        time: timeLabel,
        available: !hasConflict && !isPast,
        datetime: slotStart.toISOString(),
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
    // Rate limiting por IP
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

    // 2. Verificar servicio
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

    // 3. Verificar que el día está abierto
    const scheduledAt = new Date(sanitizedData.scheduled_at);
    const dayOfWeek = scheduledAt.getDay();

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

    // 4. Límite de reservas por cliente por día (máx 2)
    const apptDay = scheduledAt.toISOString().slice(0, 10);
    const clientDayStart = `${apptDay}T00:00:00`;
    const clientDayEnd = `${apptDay}T23:59:59`;

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

    // 5. Verificar disponibilidad en tiempo real (anti race condition)
    const endsAt = new Date(scheduledAt);
    endsAt.setMinutes(endsAt.getMinutes() + service.duration_minutes);

    const { data: conflictingAppts } = await supabase
      .from("appointments")
      .select("id")
      .eq("salon_id", sanitizedData.salon_id)
      .not("status", "in", '("cancelled","no_show")')
      .lt("scheduled_at", endsAt.toISOString())
      .gt("ends_at", scheduledAt.toISOString());

    if (conflictingAppts && conflictingAppts.length > 0) {
      return NextResponse.json(
        { error: "Este horario ya no está disponible. Por favor elige otro." },
        { status: 409 },
      );
    }

    // 6. Crear la cita
    const { data: newAppt, error: insertError } = await supabase
      .from("appointments")
      .insert({
        salon_id: sanitizedData.salon_id,
        service_id: sanitizedData.service_id,
        client_name: sanitizedData.client_name,
        client_email: sanitizedData.client_email,
        client_phone: sanitizedData.client_phone,
        client_notes: sanitizedData.client_notes,
        scheduled_at: sanitizedData.scheduled_at,
        ends_at: endsAt.toISOString(),
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
