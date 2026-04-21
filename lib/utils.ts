// lib/utils.ts
// Utilitarios de formateo determinísticos — mismo resultado en servidor y cliente.
// NUNCA usar toLocaleString/toLocaleDateString/toLocaleTimeString en componentes
// SSR ya que el formato depende del locale del OS y difiere entre Node y browser.

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

// ─── Tiempo ───────────────────────────────────────────────────────────────────

/**
 * Formatea hora en formato 12h: "02:30 pm"
 * Determinístico — no depende del locale del sistema.
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

/**
 * Formatea hora en formato 24h: "14:30"
 */
export function formatTime24(isoString: string): string {
  const date = new Date(isoString);
  const h = date.getHours();
  const m = date.getMinutes();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ─── Fechas ───────────────────────────────────────────────────────────────────

/**
 * Formatea fecha completa: "Lunes, 20 de Abril de 2026"
 */
export function formatDateFull(isoString: string): string {
  const date = new Date(isoString);
  const dayName = DAYS_ES[date.getDay()];
  const day = date.getDate();
  const month = MONTHS_ES[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} de ${month} de ${year}`;
}

/**
 * Formatea fecha corta: "Lun 20 de Abril"
 */
export function formatDateShort(isoString: string): string {
  const date = new Date(isoString);
  const dayName = DAYS_SHORT_ES[date.getDay()];
  const day = date.getDate();
  const month = MONTHS_ES[date.getMonth()];
  return `${dayName} ${day} de ${month}`;
}

/**
 * Formatea fecha mini: "20 Abr"
 */
export function formatDateMini(isoString: string): string {
  const date = new Date(isoString);
  return `${date.getDate()} ${MONTHS_SHORT_ES[date.getMonth()]}`;
}

/**
 * Formatea mes y año: "Abril de 2026"
 */
export function formatMonthYear(isoString: string): string {
  const date = new Date(isoString);
  return `${MONTHS_ES[date.getMonth()]} de ${date.getFullYear()}`;
}

/**
 * Fecha relativa: "Hoy", "Ayer", "Hace 3 días", "Hace 2 semanas", etc.
 */
export function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  // Comparar solo fechas, ignorar hora
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((nowOnly.getTime() - dateOnly.getTime()) / (1000 * 60 * 60 * 24));

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
 * Etiqueta de grupo para listas de citas: "Hoy", "Mañana", "Ayer", o fecha corta
 */
export function formatGroupDate(dateKey: string): string {
  // dateKey formato: "YYYY-MM-DD"
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const now = new Date();
  const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((date.getTime() - nowOnly.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Mañana";
  if (diffDays === -1) return "Ayer";

  const dayName = DAYS_ES[date.getDay()];
  const monthName = MONTHS_ES[date.getMonth()];
  return `${dayName} ${day} de ${monthName}`;
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