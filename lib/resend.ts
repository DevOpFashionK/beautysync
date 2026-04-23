// lib/resend.ts
//
// FIX TIMEZONE EN EMAILS:
// formatDateTimeES usaba new Date(iso) + toLocaleString con timeZone "America/Bogota".
// Dos problemas:
// 1. new Date(iso) convierte el string a UTC → hora incorrecta
// 2. "America/Bogota" es UTC-5, El Salvador es UTC-6 → 1 hora de diferencia
//
// SOLUCIÓN: formatDateTimeES ahora usa parseISOLocal() de @/lib/utils,
// que extrae año/mes/día/hora/minutos directamente del string ISO sin
// conversión de timezone — mismo approach que el dashboard.
// La hora que ve la clienta en el email es exactamente la que eligió.

import { Resend } from "resend";

// Importar parseISOLocal indirectamente a través de las funciones exportadas
// No podemos importar parseISOLocal directamente (es función privada de utils.ts)
// así que replicamos la lógica aquí — es pequeña y crítica para los emails.
// Esta es la única duplicación justificada: utils.ts es client-side safe,
// resend.ts corre en el servidor y necesita la misma lógica.

const DAYS_ES_FULL = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const MONTHS_ES_FULL = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/**
 * Parsea un string ISO extrayendo los componentes directamente del texto,
 * sin pasar por new Date() que haría conversión de timezone.
 * Acepta todos los formatos de Supabase:
 *   "2026-04-28 14:00:00+00"
 *   "2026-04-28T14:00:00Z"
 *   "2026-04-28T14:00:00+00:00"
 */
function parseISOForEmail(isoString: string): {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  dayOfWeek: number;
} {
  const clean = isoString
    .replace(" ", "T")
    .replace(/\.\d+/, "")
    .replace(/([Zz]|[+-]\d{2}(:\d{2})?)$/, "");

  const [datePart, timePart = "00:00:00"] = clean.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);

  const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { year, month: month - 1, day, hours, minutes, dayOfWeek: dow };
}

/**
 * Formatea fecha y hora para emails en español.
 * Usa parseISOForEmail para extraer la hora literal sin conversión de timezone.
 * Resultado: "Martes 28 de abril de 2026 a las 02:00 pm"
 */
function formatDateTimeES(isoString: string): string {
  const { year, month, day, hours, minutes, dayOfWeek } =
    parseISOForEmail(isoString);

  const ampm = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const timeStr = `${String(hour12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`;

  return `${DAYS_ES_FULL[dayOfWeek]} ${day} de ${MONTHS_ES_FULL[month]} de ${year} a las ${timeStr}`;
}

// ✅ Lazy initialization — no se ejecuta al importar, solo cuando se envía un email
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
  scheduledAt: string; // ISO string — se parsea con parseISOForEmail
  primaryColor?: string | null;
  confirmationToken?: string | null; // ← NUEVO: para el botón del recordatorio
}

export interface SalonNotificationData {
  salonName: string;
  ownerEmail: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string | null;
  serviceName: string;
  scheduledAt: string;
  primaryColor?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://beautysync.vercel.app";

  // Bloque CTA — solo aparece si hay token
  const ctaBlock = d.confirmationToken
    ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td align="center" style="padding:8px 0 4px;">
          <a href="${APP_URL}/confirm/${d.confirmationToken}"
             style="display:inline-block;background:${accent};color:#FFFFFF;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;font-family:Arial,sans-serif;letter-spacing:0.02em;">
            Confirmar mi cita
          </a>
        </td>
      </tr>
      <tr>
        <td align="center">
          <p style="margin:8px 0 0;font-size:12px;color:#9C8E85;">
            Un clic es suficiente. No necesitas crear una cuenta.
          </p>
        </td>
      </tr>
    </table>`
    : "";

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
    ${ctaBlock}
    <div style="background:${accent}18;border-left:3px solid ${accent};border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0;font-size:14px;color:#2D2420;line-height:1.6;">
        ⏰ <strong>Recuerda llegar 5 minutos antes</strong> de tu cita para una mejor experiencia.
      </p>
    </div>
    <p style="margin:0;font-size:13px;color:#9C8E85;">
      Para cancelar o reagendar, comunícate con <strong>${d.salonName}</strong>${d.salonPhone ? ` al ${d.salonPhone}` : ""}.
    </p>
  `;
  return emailWrapper(content, accent);
}

// ─── Template: Cancelación ────────────────────────────────────────────────────

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

// ─── Tipo: Email de bienvenida (para la dueña del salón) ─────────────────────

export interface WelcomeEmailData {
  ownerEmail: string;
  ownerName: string;
  salonName: string;
  trialEndsAt: string | null; // ISO string — fecha de vencimiento del trial
  primaryColor?: string | null;
}

// ─── Template: Bienvenida + info del trial ────────────────────────────────────

function tplBienvenida(d: WelcomeEmailData): string {
  const accent = accentColor(d.primaryColor);
  const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://beautysync.vercel.app";

  // Formatear fecha de vencimiento del trial
  const { year, month, day } = parseISOForEmail(d.trialEndsAt!);
  const trialEndFormatted = `${day} de ${MONTHS_ES_FULL[month]} de ${year}`;

  const content = `
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:28px;color:#2D2420;font-weight:400;">
      ¡Bienvenida a BeautySync! ✨
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:#9C8E85;">
      Hola <strong style="color:#2D2420;">${d.ownerName}</strong>, tu salón
      <strong style="color:#2D2420;">${d.salonName}</strong> está listo.
      Tienes <strong style="color:${accent};">14 días gratis</strong> para explorar todo lo que BeautySync puede hacer por ti.
    </p>

    <!-- Info del trial -->
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#FAF8F5;border-radius:12px;padding:24px;margin-bottom:28px;">
      <tr>
        <td style="padding:6px 0;">
          <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#9C8E85;">
            Tu período de prueba
          </p>
          <p style="margin:4px 0 0;font-size:18px;color:#2D2420;font-weight:600;">
            14 días gratuitos
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0 6px;border-top:1px solid #EDE8E3;">
          <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#9C8E85;">
            Vence el
          </p>
          <p style="margin:4px 0 0;font-size:16px;color:#2D2420;font-weight:600;">
            ${trialEndFormatted}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0 6px;border-top:1px solid #EDE8E3;">
          <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#9C8E85;">
            Tarjeta de crédito
          </p>
          <p style="margin:4px 0 0;font-size:16px;color:#2D2420;">
            No requerida durante el trial
          </p>
        </td>
      </tr>
    </table>

    <!-- Qué incluye -->
    <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#2D2420;">
      Durante tu prueba tienes acceso a:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${[
        "Widget de reservas online para tus clientas",
        "Dashboard de agenda en tiempo real",
        "Emails de confirmación automáticos",
        "Recordatorios 24h antes de cada cita",
      ]
        .map(
          (feature) => `
      <tr>
        <td style="padding:6px 0;">
          <p style="margin:0;font-size:14px;color:#2D2420;">
            <span style="color:${accent};font-weight:700;">✓</span>
            &nbsp;${feature}
          </p>
        </td>
      </tr>`,
        )
        .join("")}
    </table>

    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td align="center" style="padding:8px 0;">
          <a href="${APP_URL}/dashboard"
            style="display:inline-block;background:${accent};color:#FFFFFF;text-decoration:none;
                   padding:14px 40px;border-radius:8px;font-size:15px;font-weight:600;
                   font-family:Arial,sans-serif;letter-spacing:0.02em;">
            Ir a mi dashboard
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#9C8E85;line-height:1.6;">
      ¿Tienes preguntas? Escríbenos a
      <a href="mailto:soporte@beautysync.co"
        style="color:${accent};text-decoration:none;font-weight:600;">
        soporte@beautysync.co
      </a>
    </p>
  `;
  return emailWrapper(content, accent);
}

// ─── Función pública: Email de bienvenida ─────────────────────────────────────

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  return getResendClient().emails.send({
    from: FROM,
    to: data.ownerEmail,
    subject: `✨ Bienvenida a BeautySync — Tu prueba de 14 días ha comenzado`,
    html: tplBienvenida(data),
  });
}
