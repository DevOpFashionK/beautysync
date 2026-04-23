// lib/notifications.ts
// lib/notifications.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  sendConfirmationEmail,
  sendReminderEmail,
  sendCancellationEmail,
  sendNewBookingToSalon,
  sendTrialExpiringEmail,
  type AppointmentEmailData,
  type SalonNotificationData,
  type TrialExpiringEmailData,
} from "@/lib/resend";

// Cliente admin (service role) para escribir notification_logs sin RLS
function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

// ─── Helper: registrar en notification_logs ───────────────────────────────────

async function logNotification(
  appointmentId: string,
  channel: "email" | "whatsapp" | "sms",
  type: "reminder" | "confirmation" | "cancellation" | "new_booking",
  status: "sent" | "failed" | "pending",
  errorMessage?: string,
) {
  const supabase = getAdminClient();
  await supabase.from("notification_logs").insert({
    appointment_id: appointmentId,
    channel,
    type,
    status,
    sent_at: status === "sent" ? new Date().toISOString() : null,
    error_message: errorMessage ?? null,
  });
}

// ─── 1. Confirmación al crear una cita (para la clienta) ─────────────────────

export async function notifyNewBookingToClient(
  appointmentId: string,
  data: AppointmentEmailData,
) {
  if (!data.clientEmail) return; // Sin email no se envía

  try {
    await sendConfirmationEmail(data);
    await logNotification(appointmentId, "email", "confirmation", "sent");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await logNotification(
      appointmentId,
      "email",
      "confirmation",
      "failed",
      msg,
    );
  }
}

// ─── 2. Notificación al salón cuando llega nueva reserva ─────────────────────

export async function notifyNewBookingToSalon(
  appointmentId: string,
  data: SalonNotificationData,
) {
  try {
    await sendNewBookingToSalon(data);
    await logNotification(appointmentId, "email", "new_booking", "sent");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await logNotification(appointmentId, "email", "new_booking", "failed", msg);
  }
}

// ─── 3. Recordatorio 24h antes (llamado por cron) ────────────────────────────

export async function sendPendingReminders(): Promise<{
  processed: number;
  sent: number;
  failed: number;
  autoCancelled: number;
}> {
  const supabase = getAdminClient();
  const now = new Date();

  // Ventana: citas en las próximas 24–25h donde reminder_sent = false
  const windowStart = new Date(
    now.getTime() + 23 * 60 * 60 * 1000,
  ).toISOString();
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

  // Citas que necesitan recordatorio — SIN filtro de ventana temporal (modo prueba)
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(
      `
    id, client_name, client_email, client_phone, scheduled_at, status,
    reminder_sent, confirmation_token,
    services ( name ),
    salons ( name, phone, primary_color, owner_id )
  `,
    )
    .eq("reminder_sent", false)
    .in("status", ["pending", "confirmed"])
    .gte("scheduled_at", windowStart)
    .lte("scheduled_at", windowEnd);

  if (error || !appointments) {
    console.error("[Reminders] Error fetching appointments:", error);
    return { processed: 0, sent: 0, failed: 0, autoCancelled: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const appt of appointments) {
    const salon = Array.isArray(appt.salons) ? appt.salons[0] : appt.salons;
    const service = Array.isArray(appt.services)
      ? appt.services[0]
      : appt.services;

    if (!appt.client_email || !salon || !service) {
      // Sin email → marcar como sent para no reintentar, pero no enviar
      await supabase
        .from("appointments")
        .update({ reminder_sent: true })
        .eq("id", appt.id);
      continue;
    }

    const emailData: AppointmentEmailData = {
      clientName: appt.client_name,
      clientEmail: appt.client_email,
      salonName: salon.name,
      salonPhone: salon.phone,
      serviceName: service.name,
      scheduledAt: appt.scheduled_at,
      primaryColor: salon.primary_color,
      confirmationToken: appt.confirmation_token,
    };

    try {
      await sendReminderEmail(emailData);
      await supabase
        .from("appointments")
        .update({ reminder_sent: true })
        .eq("id", appt.id);
      await logNotification(appt.id, "email", "reminder", "sent");
      sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await logNotification(appt.id, "email", "reminder", "failed", msg);
      failed++;
    }
  }

  // ─── Auto-cancelación: citas en "pending" con reminder_sent=true
  //     cuya cita es en menos de 4h ─────────────────────────────────────────
  const cancelWindow = new Date(
    now.getTime() + 4 * 60 * 60 * 1000,
  ).toISOString();

  const { data: toCancel } = await supabase
    .from("appointments")
    .select(
      `
      id, client_name, client_email, scheduled_at,
      services ( name ),
      salons ( name, phone, primary_color )
    `,
    )
    .eq("status", "pending")
    .eq("reminder_sent", true)
    .lte("scheduled_at", cancelWindow)
    .gte("scheduled_at", now.toISOString());

  let autoCancelled = 0;

  if (toCancel) {
    for (const appt of toCancel) {
      const salon = Array.isArray(appt.salons) ? appt.salons[0] : appt.salons;
      const service = Array.isArray(appt.services)
        ? appt.services[0]
        : appt.services;

      await supabase
        .from("appointments")
        .update({
          status: "cancelled",
          cancellation_reason:
            "Cancelación automática — sin confirmación del cliente",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", appt.id);

      if (appt.client_email && salon && service) {
        try {
          await sendCancellationEmail({
            clientName: appt.client_name,
            clientEmail: appt.client_email,
            salonName: salon.name,
            salonPhone: salon.phone,
            serviceName: service.name,
            scheduledAt: appt.scheduled_at,
            primaryColor: salon.primary_color,
          });
          await logNotification(appt.id, "email", "cancellation", "sent");
        } catch {
          await logNotification(appt.id, "email", "cancellation", "failed");
        }
      }

      autoCancelled++;
    }
  }

  return { processed: appointments.length, sent, failed, autoCancelled };
}

// ─── 4. Emails de trial por vencer (llamado por cron) ────────────────────────

export async function sendPendingTrialExpiringEmails(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const supabase = getAdminClient();

  // Fecha actual en hora de El Salvador (UTC-6)
  const nowUTC = new Date();
  const nowSV = new Date(nowUTC.getTime() - 6 * 60 * 60 * 1000);
  const todayStr = nowSV.toISOString().slice(0, 10); // "YYYY-MM-DD"

  // Rango: desde mañana hasta 3 días — cubrimos los 3 casos en una sola query
  const rangeStart = `${todayStr}T06:00:00+00:00`; // hoy medianoche SV = 06:00 UTC
  const d3 = new Date(nowSV);
  d3.setUTCDate(d3.getUTCDate() + 3);
  const rangeEnd = `${d3.toISOString().slice(0, 10)}T23:59:59+00:00`;

  const { data: subs, error: subsError } = await supabase
    .from("subscriptions")
    .select(
      `
      id, trial_ends_at, salon_id,
      salons ( id, name, primary_color, owner_id )
    `,
    )
    .eq("status", "trialing")
    .is("trial_expiring_notified_at", null)
    .gte("trial_ends_at", rangeStart)
    .lte("trial_ends_at", rangeEnd);

  if (subsError || !subs) {
    console.error("[TrialExpiring] Error fetching subscriptions:", subsError);
    return { processed: 0, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const sub of subs) {
    const salon = Array.isArray(sub.salons) ? sub.salons[0] : sub.salons;

    if (!salon || !sub.trial_ends_at) {
      console.warn(
        `[TrialExpiring] Suscripción ${sub.id} sin salón o sin trial_ends_at — omitida`,
      );
      continue;
    }

    // Calcular días restantes (comparando solo fechas, sin horas)
    const trialDateStr = sub.trial_ends_at.slice(0, 10);
    const trialDate = new Date(`${trialDateStr}T00:00:00Z`);
    const todayDate = new Date(`${todayStr}T00:00:00Z`);
    const diffMs = trialDate.getTime() - todayDate.getTime();
    const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (![1, 2, 3].includes(daysRemaining)) {
      console.warn(
        `[TrialExpiring] Suscripción ${sub.id} — ${daysRemaining} días fuera de ventana, omitida`,
      );
      continue;
    }

    // Obtener email del owner (requiere service role)
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(salon.owner_id);

    if (userError || !userData?.user?.email) {
      console.error(
        `[TrialExpiring] No se pudo obtener email del owner ${salon.owner_id}:`,
        userError,
      );
      failed++;
      continue;
    }

    const emailData: TrialExpiringEmailData = {
      ownerEmail: userData.user.email,
      ownerName: userData.user.user_metadata?.full_name ?? "Dueña",
      salonName: salon.name,
      trialEndsAt: sub.trial_ends_at,
      daysRemaining,
      primaryColor: salon.primary_color,
    };

    try {
      await sendTrialExpiringEmail(emailData);

      await supabase
        .from("subscriptions")
        .update({ trial_expiring_notified_at: new Date().toISOString() })
        .eq("id", sub.id);

      console.log(
        `[TrialExpiring] Email enviado — salón: ${salon.name}, días: ${daysRemaining}`,
      );
      sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error(
        `[TrialExpiring] Error enviando para salón ${salon.name}:`,
        msg,
      );
      failed++;
    }
  }

  return { processed: subs.length, sent, failed };
}
