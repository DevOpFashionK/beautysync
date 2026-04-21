// app/api/notifications/new-booking/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  notifyNewBookingToClient,
  notifyNewBookingToSalon,
} from "@/lib/notifications";

// Este endpoint es llamado INTERNAMENTE desde /api/appointments (POST)
// No es público — verificamos con CRON_SECRET también
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { appointmentId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { appointmentId } = body;
  if (!appointmentId) {
    return NextResponse.json(
      { error: "appointmentId requerido" },
      { status: 400 },
    );
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Obtener datos completos de la cita
  const { data: appt, error } = await supabase
    .from("appointments")
    .select(
      `
      id, client_name, client_email, client_phone, scheduled_at,
      services ( name ),
      salons ( id, name, phone, primary_color, owner_id )
    `,
    )
    .eq("id", appointmentId)
    .single();

  if (error || !appt) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  const salon = Array.isArray(appt.salons) ? appt.salons[0] : appt.salons;
  const service = Array.isArray(appt.services)
    ? appt.services[0]
    : appt.services;

  if (!salon || !service) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  // Obtener email del dueño del salón
  const { data: ownerData } = await supabase.auth.admin.getUserById(
    salon.owner_id,
  );
  const ownerEmail = ownerData?.user?.email;

  // Enviar emails en paralelo (no bloqueante — fire and forget con log)
  const promises: Promise<void>[] = [];

  if (appt.client_email) {
    promises.push(
      notifyNewBookingToClient(appt.id, {
        clientName: appt.client_name,
        clientEmail: appt.client_email,
        salonName: salon.name,
        salonPhone: salon.phone,
        serviceName: service.name,
        scheduledAt: appt.scheduled_at,
        primaryColor: salon.primary_color,
      }),
    );
  }

  if (ownerEmail) {
    promises.push(
      notifyNewBookingToSalon(appt.id, {
        salonName: salon.name,
        ownerEmail,
        clientName: appt.client_name,
        clientPhone: appt.client_phone,
        clientEmail: appt.client_email,
        serviceName: service.name,
        scheduledAt: appt.scheduled_at,
        primaryColor: salon.primary_color,
      }),
    );
  }

  await Promise.allSettled(promises);

  return NextResponse.json({ ok: true });
}
