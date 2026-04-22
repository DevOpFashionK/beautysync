// lib/utils.ts
// Utilitarios de formateo determinísticos — mismo resultado en servidor y cliente.
// NUNCA usar toLocaleString/toLocaleDateString/toLocaleTimeString en componentes
// SSR ya que el formato depende del locale del OS y difiere entre Node y browser.
//
// REGLA CRÍTICA DE TIMEZONE:
// Supabase guarda las horas como strings tipo "2026-04-28T14:00:00+00"
// new Date("2026-04-28T14:00:00+00") en el servidor (UTC) lee 14:00 ✅
// new Date("2026-04-28T14:00:00+00") en el browser (UTC-6) lee 08:00 ❌
//
// SOLUCIÓN: Parsear el string ISO manualmente extrayendo año/mes/día/hora/min
// directamente del texto, sin dejar que JavaScript haga conversión de timezone.

const DAYS_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DAYS_SHORT_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const MONTHS_SHORT_ES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

// ─── Parser ISO sin conversión de timezone ────────────────────────────────────
//
// Extrae los componentes de fecha/hora directamente del string ISO,
// ignorando cualquier offset. Funciona con:
//   "2026-04-28T14:00:00"
//   "2026-04-28T14:00:00+00"
//   "2026-04-28T14:00:00+00:00"
//   "2026-04-28 14:00:00+00"  (formato Supabase)

function parseISOLocal(isoString: string): {
  year: number; month: number; day: number;
  hours: number; minutes: number; dayOfWeek: number;
} {
  // Normalizar: reemplazar espacio por T, quitar offset
  const clean = isoString.replace(" ", "T").replace(/([+-]\d{2}:?\d{2}|Z)$/, "");
  const [datePart, timePart = "00:00:00"] = clean.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);

  // Calcular día de la semana sin new Date() con timezone
  // Usamos Date.UTC que siempre opera en UTC puro
  const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  return { year, month: month - 1, day, hours, minutes, dayOfWeek: dow };
}

// ─── Tiempo ───────────────────────────────────────────────────────────────────

/**
 * Formatea hora en formato 12h: "02:30 pm"
 * Lee el string ISO directamente sin conversión de timezone.
 */
export function formatTime(isoString: string): string {
  const { hours, minutes } = parseISOLocal(isoString);
  const ampm   = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(hour12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

/**
 * Formatea hora en formato 24h: "14:30"
 * Lee el string ISO directamente sin conversión de timezone.
 */
export function formatTime24(isoString: string): string {
  const { hours, minutes } = parseISOLocal(isoString);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

// ─── Fechas ───────────────────────────────────────────────────────────────────

/**
 * Formatea fecha completa: "Lunes, 20 de Abril de 2026"
 * Lee el string ISO directamente sin conversión de timezone.
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
 * Compara fechas en UTC puro para consistencia servidor/cliente.
 */
export function formatRelativeDate(isoString: string): string {
  const { year, month, day } = parseISOLocal(isoString);
  const now     = new Date();
  const dateUTC = Date.UTC(year, month, day);
  const nowUTC  = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const diffDays = Math.round((nowUTC - dateUTC) / (1000 * 60 * 60 * 24));

  if (diffDays === 0)  return "Hoy";
  if (diffDays === 1)  return "Ayer";
  if (diffDays === -1) return "Mañana";
  if (diffDays < 0)    return `En ${Math.abs(diffDays)} días`;
  if (diffDays < 7)    return `Hace ${diffDays} días`;
  if (diffDays < 14)   return "Hace 1 semana";
  if (diffDays < 30)   return `Hace ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 60)   return "Hace 1 mes";
  if (diffDays < 365)  return `Hace ${Math.floor(diffDays / 30)} meses`;
  if (diffDays < 730)  return "Hace 1 año";
  return `Hace ${Math.floor(diffDays / 365)} años`;
}

/**
 * Etiqueta de grupo para listas de citas: "Hoy", "Mañana", "Ayer", o fecha corta
 * dateKey formato: "YYYY-MM-DD"
 */
export function formatGroupDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const now     = new Date();
  const dateUTC = Date.UTC(year, month - 1, day);
  const nowUTC  = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const diffDays = Math.round((dateUTC - nowUTC) / (1000 * 60 * 60 * 24));

  if (diffDays === 0)  return "Hoy";
  if (diffDays === 1)  return "Mañana";
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
  const cents   = Math.round((amount - dollars) * 100);
  return `$${dollars}.${String(cents).padStart(2, "0")}`;
}

/**
 * Formatea precio sin centavos si es entero: "$15" o "$15.50"
 */
export function formatPriceShort(amount: number): string {
  if (amount % 1 === 0) return `$${amount}`;
  const dollars = Math.floor(amount);
  const cents   = Math.round((amount - dollars) * 100);
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