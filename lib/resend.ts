// lib/resend.ts
import { Resend } from "resend";

// ✅ Lazy initialization — no se ejecuta al importar, solo cuando se envía un email
// Esto evita que el build de Next.js falle si RESEND_API_KEY no está definida
function getResendClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY no está definida");
  return new Resend(key);
}

const FROM =
  process.env.RESEND_FROM_EMAIL ?? "BeautySync <notificaciones@beautysync.co>";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface AppointmentEmailData {
  clientName: string;
  clientEmail: string;
  salonName: string;
  salonPhone?: string | null;
  serviceName: string;
  scheduledAt: string; // ISO string — se formatea aquí
  primaryColor?: string | null;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function formatDateTimeES(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Bogota",
  });
}

function accentColor(primary?: string | null): string {
  return primary ?? "#D4375F";
}

// ─── Base HTML wrapper ────────────────────────────────────────────────────────

function emailWrapper(content: string, accent: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>BeautySync</title>
</head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0EB;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:${accent};padding:28px 40px;">
            <p style="margin:0;font-family:Georgia,serif;font-size:22px;color:#FFFFFF;letter-spacing:0.04em;font-weight:400;">
              BeautySync
            </p>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding:36px 40px 28px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#FAF8F5;padding:20px 40px;border-top:1px solid #EDE8E3;">
            <p style="margin:0;font-size:12px;color:#9C8E85;text-align:center;">
              BeautySync · El salón que trabaja solo<br/>
              Este es un mensaje automático, no responder a este correo.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Template: Nueva reserva (para la clienta) ────────────────────────────────

function tplConfirmacion(d: AppointmentEmailData): string {
  const accent = accentColor(d.primaryColor);
  const content = `
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;color:#2D2420;font-weight:400;">
      ¡Reserva confirmada! 🎉
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:#9C8E85;">
      Hola <strong style="color:#2D2420;">${d.clientName}</strong>, tu cita ha sido agendada con éxito.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;border-radius:12px;padding:24px;margin-bottom:28px;">
      <tr>
        <td style="padding:6px 0;">
          <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#9C8E85;">Salón</p>
          <p style="margin:4px 0 0;font-size:16px;color:#2D2420;font-weight:600;">${d.salonName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0 6px;border-top:1px solid #EDE8E3;">
          <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#9C8E85;">Servicio</p>
          <p style="margin:4px 0 0;font-size:16px;color:#2D2420;">${d.serviceName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0 6px;border-top:1px solid #EDE8E3;">
          <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#9C8E85;">Fecha y hora</p>
          <p style="margin:4px 0 0;font-size:16px;color:#2D2420;font-weight:600;">${formatDateTimeES(d.scheduledAt)}</p>
        </td>
      </tr>
      ${
        d.salonPhone
          ? `
      <tr>
        <td style="padding:12px 0 6px;border-top:1px solid #EDE8E3;">
          <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#9C8E85;">Teléfono del salón</p>
          <p style="margin:4px 0 0;font-size:16px;color:#2D2420;">${d.salonPhone}</p>
        </td>
      </tr>`
          : ""
      }
    </table>
    <p style="margin:0;font-size:14px;color:#9C8E85;line-height:1.6;">
      Recibirás un recordatorio 24 horas antes de tu cita. 
      Si necesitas cancelar, por favor comunícate directamente con el salón.
    </p>
  `;
  return emailWrapper(content, accent);
}

// ─── Template: Recordatorio (24h antes) ──────────────────────────────────────

function tplRecordatorio(d: AppointmentEmailData): string {
  const accent = accentColor(d.primaryColor);
  const content = `
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;color:#2D2420;font-weight:400;">
      Recordatorio de cita 💅
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:#9C8E85;">
      Hola <strong style="color:#2D2420;">${d.clientName}</strong>, te recordamos tu cita de mañana.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;border-radius:12px;padding:24px;margin-bottom:28px;">
      <tr>
        <td style="padding:6px 0;">
          <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#9C8E85;">Salón</p>
          <p style="margin:4px 0 0;font-size:16px;color:#2D2420;font-weight:600;">${d.salonName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0 6px;border-top:1px solid #EDE8E3;">
          <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#9C8E85;">Servicio</p>
          <p style="margin:4px 0 0;font-size:16px;color:#2D2420;">${d.serviceName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0 6px;border-top:1px solid #EDE8E3;">
          <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#9C8E85;">Fecha y hora</p>
          <p style="margin:4px 0 0;font-size:16px;color:#2D2420;font-weight:600;">${formatDateTimeES(d.scheduledAt)}</p>
        </td>
      </tr>
    </table>
    <div style="background:${accent}18;border-left:3px solid ${accent};border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0;font-size:14px;color:#2D2420;line-height:1.6;">
        ⏰ <strong>Recuerda llegar 5 minutos antes</strong> de tu cita para una mejor experiencia.
      </p>
    </div>
    <p style="margin:0;font-size:13px;color:#9C8E85;">
      Para cancelar o reagendar, comunícate con <strong>${d.salonName}</strong>
      ${d.salonPhone ? ` al ${d.salonPhone}` : ""}.
    </p>
  `;
  return emailWrapper(content, accent);
}

// ─── Template: Cancelación automática ────────────────────────────────────────

function tplCancelacion(d: AppointmentEmailData): string {
  const accent = accentColor(d.primaryColor);
  const content = `
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;color:#2D2420;font-weight:400;">
      Cita cancelada
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:#9C8E85;">
      Hola <strong style="color:#2D2420;">${d.clientName}</strong>, tu cita ha sido cancelada.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;border-radius:12px;padding:24px;margin-bottom:28px;">
      <tr>
        <td style="padding:6px 0;">
          <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#9C8E85;">Servicio cancelado</p>
          <p style="margin:4px 0 0;font-size:16px;color:#2D2420;">${d.serviceName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0 6px;border-top:1px solid #EDE8E3;">
          <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#9C8E85;">Fecha que tenías</p>
          <p style="margin:4px 0 0;font-size:16px;color:#2D2420;">${formatDateTimeES(d.scheduledAt)}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px;font-size:14px;color:#9C8E85;line-height:1.6;">
      Si quieres reagendar, puedes reservar nuevamente a través del sitio del salón.
    </p>
    <p style="margin:0;font-size:13px;color:#C4B8B0;">
      Disculpa cualquier inconveniente.
    </p>
  `;
  return emailWrapper(content, accent);
}

// ─── Template: Nueva reserva (para el salón) ─────────────────────────────────

interface SalonNotificationData {
  salonName: string;
  ownerEmail: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string | null;
  serviceName: string;
  scheduledAt: string;
  primaryColor?: string | null;
}

function tplNuevaReservaSalon(d: SalonNotificationData): string {
  const accent = accentColor(d.primaryColor);
  const content = `
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;color:#2D2420;font-weight:400;">
      Nueva reserva 📅
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:#9C8E85;">
      Una nueva clienta ha agendado una cita en <strong style="color:#2D2420;">${d.salonName}</strong>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5;border-radius:12px;padding:24px;margin-bottom:28px;">
      <tr>
        <td style="padding:6px 0;">
          <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#9C8E85;">Cliente</p>
          <p style="margin:4px 0 0;font-size:18px;color:#2D2420;font-weight:600;">${d.clientName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0 6px;border-top:1px solid #EDE8E3;">
          <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#9C8E85;">Teléfono</p>
          <p style="margin:4px 0 0;font-size:16px;color:#2D2420;">${d.clientPhone}</p>
        </td>
      </tr>
      ${
        d.clientEmail
          ? `
      <tr>
        <td style="padding:12px 0 6px;border-top:1px solid #EDE8E3;">
          <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#9C8E85;">Email</p>
          <p style="margin:4px 0 0;font-size:16px;color:#2D2420;">${d.clientEmail}</p>
        </td>
      </tr>`
          : ""
      }
      <tr>
        <td style="padding:12px 0 6px;border-top:1px solid #EDE8E3;">
          <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#9C8E85;">Servicio</p>
          <p style="margin:4px 0 0;font-size:16px;color:#2D2420;">${d.serviceName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0 6px;border-top:1px solid #EDE8E3;">
          <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#9C8E85;">Fecha y hora</p>
          <p style="margin:4px 0 0;font-size:20px;color:#2D2420;font-weight:700;">${formatDateTimeES(d.scheduledAt)}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;color:#9C8E85;">
      Puedes ver y gestionar esta cita desde tu dashboard de BeautySync.
    </p>
  `;
  return emailWrapper(content, accent);
}

// ─── Funciones públicas de envío ──────────────────────────────────────────────

export async function sendConfirmationEmail(data: AppointmentEmailData) {
  return getResendClient().emails.send({
    from: FROM,
    to: data.clientEmail,
    subject: `✅ Cita confirmada en ${data.salonName}`,
    html: tplConfirmacion(data),
  });
}

export async function sendReminderEmail(data: AppointmentEmailData) {
  return getResendClient().emails.send({
    from: FROM,
    to: data.clientEmail,
    subject: `💅 Recordatorio: Tu cita mañana en ${data.salonName}`,
    html: tplRecordatorio(data),
  });
}

export async function sendCancellationEmail(data: AppointmentEmailData) {
  return getResendClient().emails.send({
    from: FROM,
    to: data.clientEmail,
    subject: `Cita cancelada — ${data.salonName}`,
    html: tplCancelacion(data),
  });
}

export async function sendNewBookingToSalon(data: SalonNotificationData) {
  return getResendClient().emails.send({
    from: FROM,
    to: data.ownerEmail,
    subject: `📅 Nueva reserva: ${data.clientName} — ${formatDateTimeES(data.scheduledAt)}`,
    html: tplNuevaReservaSalon(data),
  });
}

export type { SalonNotificationData };