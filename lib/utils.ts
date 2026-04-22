// lib/utils.ts
// Utilitarios de formateo determinísticos — mismo resultado en servidor y cliente.
// NUNCA usar toLocaleString/toLocaleDateString/toLocaleTimeString en componentes
// SSR ya que el formato depende del locale del OS y difiere entre Node y browser.
//
// REGLA CRÍTICA DE TIMEZONE:
// Supabase puede retornar timestamps en múltiples formatos:
//   "2026-04-28 14:00:00+00"      ← formato Postgres con espacio
//   "2026-04-28T14:00:00+00:00"   ← ISO 8601 completo
//   "2026-04-28T14:00:00Z"        ← ISO 8601 con Z
//   "2026-04-28T14:00:00"         ← sin offset (ya stripeado)
//
// SOLUCIÓN: Parsear el string ISO manualmente extrayendo año/mes/día/hora/min
// directamente del texto, sin dejar que JavaScript haga conversión de timezone.
//
// FIX en formatGroupDate y formatRelativeDate:
// Antes usaban getUTCFullYear/getUTCMonth/getUTCDate para calcular "hoy",
// lo que causaba que a las 6pm+ en UTC-6 el servidor ya dijera que era
// el día siguiente → citas de mañana aparecían como "Hoy".
// Ahora usan getFullYear/getMonth/getDate (timezone local del browser).
// Estas funciones solo se llaman desde componentes cliente ("use client"),
// por lo que new Date() siempre corre en el browser con timezone correcta.

const DAYS_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const DAYS_SHORT_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const MONTHS_SHORT_ES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

// ─── Parser ISO sin conversión de timezone ────────────────────────────────────
//
// Extrae los componentes de fecha/hora directamente del string ISO,
// ignorando cualquier offset. Funciona con TODOS los formatos de Supabase:
//   "2026-04-28T14:00:00"
//   "2026-04-28T14:00:00+00"
//   "2026-04-28T14:00:00+00:00"
//   "2026-04-28T14:00:00-06:00"
//   "2026-04-28T14:00:00Z"
//   "2026-04-28 14:00:00+00"        ← formato nativo Postgres
//   "2026-04-28 14:00:00.000+00"    ← con microsegundos

function parseISOLocal(isoString: string): {
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

  if (
    isNaN(year) ||
    isNaN(month) ||
    isNaN(day) ||
    isNaN(hours) ||
    isNaN(minutes)
  ) {
    console.error(
      "[parseISOLocal] String ISO inválido:",
      isoString,
      "→ clean:",
      clean,
    );
    return { year: 2000, month: 0, day: 1, hours: 0, minutes: 0, dayOfWeek: 0 };
  }

  const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { year, month: month - 1, day, hours, minutes, dayOfWeek: dow };
}

// ─── Tiempo ───────────────────────────────────────────────────────────────────

/**
 * Formatea hora en formato 12h: "02:30 pm"
 */
export function formatTime(isoString: string): string {
  const { hours, minutes } = parseISOLocal(isoString);
  const ampm = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(hour12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

/**
 * Formatea hora en formato 24h: "14:30"
 */
export function formatTime24(isoString: string): string {
  const { hours, minutes } = parseISOLocal(isoString);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

// ─── Fechas ───────────────────────────────────────────────────────────────────

/**
 * Formatea fecha completa: "Lunes, 20 de Abril de 2026"
 */
export function formatDateFull(isoString: string): string {
  const { year, month, day, dayOfWeek } = parseISOLocal(isoString);
  return `${DAYS_ES[dayOfWeek]}, ${day} de ${MONTHS_ES[month]} de ${year}`;
}

/**
 * Formatea fecha corta: "Lun 20 de Abril"
 */
export function formatDateShort(isoString: string): string {
  const { month, day, dayOfWeek } = parseISOLocal(isoString);
  return `${DAYS_SHORT_ES[dayOfWeek]} ${day} de ${MONTHS_ES[month]}`;
}

/**
 * Formatea fecha mini: "20 Abr"
 */
export function formatDateMini(isoString: string): string {
  const { month, day } = parseISOLocal(isoString);
  return `${day} ${MONTHS_SHORT_ES[month]}`;
}

/**
 * Formatea mes y año: "Abril de 2026"
 */
export function formatMonthYear(isoString: string): string {
  const { year, month } = parseISOLocal(isoString);
  return `${MONTHS_ES[month]} de ${year}`;
}

/**
 * Fecha relativa: "Hoy", "Ayer", "Hace 3 días", etc.
 *
 * FIX: Usa getFullYear/getMonth/getDate (timezone local del browser)
 * en vez de getUTC* para calcular "hoy". Solo se llama desde componentes
 * cliente, por lo que new Date() siempre tiene la timezone correcta.
 */
export function formatRelativeDate(isoString: string): string {
  const { year, month, day } = parseISOLocal(isoString);
  const now = new Date();
  // Fecha de la cita en UTC puro (solo la parte de fecha, sin hora)
  const dateUTC = Date.UTC(year, month, day);
  // "Hoy" del usuario en UTC puro — usar getFullYear/Month/Date (local)
  const nowLocal = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((nowLocal - dateUTC) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays === -1) return "Mañana";
  if (diffDays < 0) return `En ${Math.abs(diffDays)} días`;
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 14) return "Hace 1 semana";
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 60) return "Hace 1 mes";
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
  if (diffDays < 730) return "Hace 1 año";
  return `Hace ${Math.floor(diffDays / 365)} años`;
}

/**
 * Etiqueta de grupo para listas de citas: "Hoy", "Mañana", "Ayer", o fecha corta.
 * dateKey formato: "YYYY-MM-DD"
 *
 * FIX: Usa getFullYear/getMonth/getDate (timezone local del browser)
 * en vez de getUTC* para calcular "hoy". A las 9:53pm en UTC-6, getUTC*
 * ya retornaba el día siguiente → citas de mañana aparecían como "Hoy".
 * Solo se llama desde AppointmentsClient ("use client"), siempre en browser.
 */
export function formatGroupDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const now = new Date();
  // Fecha del grupo en UTC puro
  const dateUTC = Date.UTC(year, month - 1, day);
  // "Hoy" del usuario usando timezone local del browser
  const nowLocal = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((dateUTC - nowLocal) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Mañana";
  if (diffDays === -1) return "Ayer";

  const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${DAYS_ES[dow]} ${day} de ${MONTHS_ES[month - 1]}`;
}

// ─── Precio ───────────────────────────────────────────────────────────────────

/**
 * Formatea precio en USD: "$15.00"
 */
export function formatPrice(amount: number): string {
  const dollars = Math.floor(amount);
  const cents = Math.round((amount - dollars) * 100);
  return `$${dollars}.${String(cents).padStart(2, "0")}`;
}

/**
 * Formatea precio sin centavos si es entero: "$15" o "$15.50"
 */
export function formatPriceShort(amount: number): string {
  if (amount % 1 === 0) return `$${amount}`;
  const dollars = Math.floor(amount);
  const cents = Math.round((amount - dollars) * 100);
  return `$${dollars}.${String(cents).padStart(2, "0")}`;
}

// ─── Duración ─────────────────────────────────────────────────────────────────

/**
 * Formatea duración en minutos: "45 min", "1h", "1h 30min"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ─── Texto ────────────────────────────────────────────────────────────────────

/**
 * Genera iniciales de un nombre: "María García" → "MG"
 */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Sanitiza texto para prevenir XSS básico
 */
export function sanitizeText(value: string): string {
  return value
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

/**
 * Trunca texto con ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}
