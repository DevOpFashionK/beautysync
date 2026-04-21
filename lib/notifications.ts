// lib/notifications.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  sendConfirmationEmail,
  sendReminderEmail,
  sendCancellationEmail,
  sendNewBookingToSalon,
  type AppointmentEmailData,
  type SalonNotificationData,
} from "@/lib/resend";

// Cliente admin (service role) para escribir notification_logs sin RLS
function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

  // Citas que necesitan recordatorio
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(
      `
      id, client_name, client_email, client_phone, scheduled_at, status,
      reminder_sent,
      services ( name ),
      salons ( name, phone, primary_color, owner_id )
    `,
    )
    .gte("scheduled_at", windowStart)
    .lte("scheduled_at", windowEnd)
    .eq("reminder_sent", false)
    .in("status", ["pending", "confirmed"]);

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
