import { createClient } from "@supabase/supabase-js";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  MapPin,
  LucideIcon,
} from "lucide-react";
import { formatTime, formatDateFull } from "@/lib/utils";

// ─── Tokens Dark Atelier ──────────────────────────────────────────────────────
const t = {
  bg: "#080706",
  surface: "#0E0C0B",
  surface2: "#131110",
  border: "rgba(255,255,255,0.055)",
  borderMid: "rgba(255,255,255,0.09)",
  rose: "#FF2D55",
  roseDim: "rgba(255,45,85,0.55)",
  roseGhost: "rgba(255,45,85,0.08)",
  roseBorder: "rgba(255,45,85,0.22)",
  textPrimary: "rgba(245,242,238,0.9)",
  textMid: "rgba(245,242,238,0.45)",
  textDim: "rgba(245,242,238,0.18)",
  green: "rgba(34,197,94,0.80)",
  greenBorder: "rgba(34,197,94,0.22)",
  greenGhost: "rgba(34,197,94,0.08)",
  amber: "rgba(245,158,11,0.80)",
  amberBorder: "rgba(245,158,11,0.22)",
  amberGhost: "rgba(245,158,11,0.08)",
  red: "rgba(239,68,68,0.80)",
  redBorder: "rgba(239,68,68,0.22)",
  redGhost: "rgba(239,68,68,0.08)",
};

// ─── Tipos — intactos ─────────────────────────────────────────────────────────
type ConfirmStatus =
  | "success"
  | "already_confirmed"
  | "expired"
  | "not_found"
  | "invalid"
  | "error";

interface AppointmentData {
  client_name: string;
  scheduled_at: string;
  ends_at: string | null;
  service_name: string;
  salon_name: string;
  primary_color: string;
}

interface StatusConfig {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  iconBorder: string;
  title: string;
  subtitle: string;
  showDetails: boolean;
}

// ─── Supabase service role — intacto ──────────────────────────────────────────
function serviceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

// ─── Query — intacta ──────────────────────────────────────────────────────────
async function getAppointmentData(
  token: string,
): Promise<AppointmentData | null> {
  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!UUID_REGEX.test(token)) return null;

  const supabase = serviceRoleClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      client_name,
      scheduled_at,
      ends_at,
      services ( name ),
      salons ( name, primary_color )
    `,
    )
    .eq("confirmation_token", token)
    .maybeSingle();

  if (error || !data) return null;

  const services = data.services as unknown as { name: string } | null;
  const salons = data.salons as unknown as {
    name: string;
    primary_color: string;
  } | null;

  return {
    client_name: data.client_name,
    scheduled_at: data.scheduled_at,
    ends_at: data.ends_at,
    service_name: services?.name ?? "Servicio",
    salon_name: salons?.name ?? "Salón",
    primary_color: salons?.primary_color ?? "#FF2D55",
  };
}

// ─── Google Calendar URL — intacta ────────────────────────────────────────────
function buildGoogleCalendarUrl(appt: AppointmentData): string {
  const toGCal = (iso: string) =>
    iso.replace(/[-:]/g, "").replace(/\.\d+/, "").replace("Z", "");

  const start = toGCal(appt.scheduled_at);
  const end = appt.ends_at ? toGCal(appt.ends_at) : toGCal(appt.scheduled_at);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${appt.service_name} — ${appt.salon_name}`,
    dates: `${start}/${end}`,
    details: `Cita confirmada en ${appt.salon_name}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ─── Status config — tokens Dark Atelier ─────────────────────────────────────
const STATUS_CONFIG: Record<ConfirmStatus, StatusConfig> = {
  success: {
    icon: CheckCircle,
    iconColor: t.green,
    iconBg: t.greenGhost,
    iconBorder: t.greenBorder,
    title: "¡Cita confirmada!",
    subtitle: "Tu asistencia ha sido registrada. Te esperamos.",
    showDetails: true,
  },
  already_confirmed: {
    icon: CheckCircle,
    iconColor: t.green,
    iconBg: t.greenGhost,
    iconBorder: t.greenBorder,
    title: "Ya estás confirmada",
    subtitle: "Tu cita ya había sido confirmada anteriormente.",
    showDetails: true,
  },
  expired: {
    icon: Clock,
    iconColor: t.amber,
    iconBg: t.amberGhost,
    iconBorder: t.amberBorder,
    title: "Link ya no está activo",
    subtitle: "Esta cita ya pasó o el tiempo de confirmación venció.",
    showDetails: false,
  },
  not_found: {
    icon: AlertCircle,
    iconColor: t.amber,
    iconBg: t.amberGhost,
    iconBorder: t.amberBorder,
    title: "Link no encontrado",
    subtitle:
      "No encontramos una cita asociada a este link. Verifica el email original.",
    showDetails: false,
  },
  invalid: {
    icon: XCircle,
    iconColor: t.red,
    iconBg: t.redGhost,
    iconBorder: t.redBorder,
    title: "Link inválido",
    subtitle: "Este link de confirmación no tiene el formato correcto.",
    showDetails: false,
  },
  error: {
    icon: XCircle,
    iconColor: t.red,
    iconBg: t.redGhost,
    iconBorder: t.redBorder,
    title: "Algo salió mal",
    subtitle:
      "Ocurrió un error inesperado. Por favor contacta al salón directamente.",
    showDetails: false,
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { token } = await params;
  const { status: rawStatus } = await searchParams;

  // Validación de status — intacta
  const status: ConfirmStatus =
    rawStatus && rawStatus in STATUS_CONFIG
      ? (rawStatus as ConfirmStatus)
      : "error";

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const appt = config.showDetails ? await getAppointmentData(token) : null;
  const primaryColor = appt?.primary_color ?? "#FF2D55";

  // Hex a rgba para usar como acento dinámico del salón
  const brandGhost = `${primaryColor}14`;
  const brandBorder = `${primaryColor}38`;

  return (
    <div
      style={{
        margin: 0,
        padding: "40px 16px 64px",
        background: t.bg,
        backgroundImage: `radial-gradient(ellipse at top center, rgba(255,45,85,0.05) 0%, transparent 55%)`,
        fontFamily:
          "var(--font-jakarta), 'Plus Jakarta Sans', system-ui, sans-serif",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: "480px" }}>
        {/* ── Card principal ─────────────────────────────────────────────── */}
        <div
          style={{
            position: "relative",
            background: t.surface,
            border: `1px solid ${t.borderMid}`,
            borderRadius: "18px",
            padding: "36px 32px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
            textAlign: "center",
            overflow: "hidden",
          }}
        >
          {/* Acento esquina superior derecha */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "14px",
              height: "14px",
              borderTop: `1px solid ${t.roseBorder}`,
              borderRight: `1px solid ${t.roseBorder}`,
              borderTopRightRadius: "18px",
              pointerEvents: "none",
            }}
          />

          {/* Radial sutil del color del salón en esquina superior */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "120px",
              background: `radial-gradient(ellipse at top center, ${brandGhost} 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />

          {/* ── Brand BeautySync ──────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "28px",
              position: "relative",
            }}
          >
            <span
              style={{
                display: "block",
                width: "14px",
                height: "1px",
                background: t.roseDim,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-cormorant), Georgia, serif",
                fontSize: "18px",
                fontWeight: 300,
                color: t.textPrimary,
                letterSpacing: "0.08em",
              }}
            >
              BeautySync
            </span>
            <span
              style={{
                display: "block",
                width: "14px",
                height: "1px",
                background: t.roseDim,
              }}
            />
          </div>

          {/* ── Ícono de estado ───────────────────────────────────────── */}
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: config.iconBg,
              border: `1px solid ${config.iconBorder}`,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <Icon
              style={{ color: config.iconColor, width: 24, height: 24 }}
              strokeWidth={1.5}
            />
          </div>

          {/* ── Título ───────────────────────────────────────────────── */}
          <h1
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "28px",
              fontWeight: 300,
              color: t.textPrimary,
              margin: "0 0 10px",
              lineHeight: 1.15,
              letterSpacing: "0.01em",
            }}
          >
            {config.title}
          </h1>

          {/* ── Subtítulo ─────────────────────────────────────────────── */}
          <p
            style={{
              fontFamily: "var(--font-jakarta), sans-serif",
              fontSize: "13px",
              color: t.textMid,
              margin: "0 0 28px",
              lineHeight: 1.65,
            }}
          >
            {config.subtitle}
          </p>

          {/* ── Detalles de la cita ───────────────────────────────────── */}
          {config.showDetails && appt && (
            <div style={{ position: "relative" }}>
              {/* Divisor */}
              <div
                style={{
                  height: "1px",
                  background: t.border,
                  margin: "0 0 24px",
                }}
              />

              {/* Nombre del salón — eyebrow */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    display: "block",
                    width: "14px",
                    height: "1px",
                    background: t.roseDim,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-jakarta), sans-serif",
                    fontSize: "10px",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.16em",
                    color: t.roseDim,
                  }}
                >
                  {appt.salon_name}
                </span>
                <span
                  style={{
                    display: "block",
                    width: "14px",
                    height: "1px",
                    background: t.roseDim,
                  }}
                />
              </div>

              {/* Card de detalles */}
              <div
                style={{
                  background: t.surface2,
                  border: `1px solid ${brandBorder}`,
                  borderRadius: "12px",
                  padding: "18px 20px",
                  textAlign: "left",
                  marginBottom: "24px",
                }}
              >
                {/* Nombre cliente */}
                <p
                  style={{
                    fontFamily: "var(--font-cormorant), Georgia, serif",
                    fontSize: "20px",
                    fontWeight: 300,
                    color: t.textPrimary,
                    margin: "0 0 14px",
                    letterSpacing: "0.01em",
                  }}
                >
                  {appt.client_name}
                </p>

                {/* Servicio */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "10px",
                  }}
                >
                  <MapPin
                    style={{
                      width: 13,
                      height: 13,
                      color: t.textDim,
                      flexShrink: 0,
                    }}
                    strokeWidth={1.5}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-jakarta), sans-serif",
                      fontSize: "13px",
                      color: t.textMid,
                    }}
                  >
                    {appt.service_name}
                  </span>
                </div>

                {/* Fecha y hora */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Calendar
                    style={{
                      width: 13,
                      height: 13,
                      color: t.textDim,
                      flexShrink: 0,
                    }}
                    strokeWidth={1.5}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-jakarta), sans-serif",
                      fontSize: "13px",
                      color: t.textMid,
                    }}
                  >
                    {formatDateFull(appt.scheduled_at)} —{" "}
                    {formatTime(appt.scheduled_at)}
                    {appt.ends_at ? ` a ${formatTime(appt.ends_at)}` : ""}
                  </span>
                </div>
              </div>

              {/* CTA — Agregar al calendario */}
              <a
                href={buildGoogleCalendarUrl(appt)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: t.roseGhost,
                  border: `1px solid ${t.roseBorder}`,
                  color: t.roseDim,
                  textDecoration: "none",
                  padding: "11px 24px",
                  borderRadius: "10px",
                  fontFamily: "var(--font-jakarta), sans-serif",
                  fontSize: "13px",
                  fontWeight: 500,
                  letterSpacing: "0.01em",
                  transition: "background 0.18s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,45,85,0.16)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = t.roseGhost)
                }
              >
                <Calendar style={{ width: 14, height: 14 }} strokeWidth={1.5} />
                Agregar al calendario
              </a>
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <p
          style={{
            textAlign: "center",
            fontFamily: "var(--font-jakarta), sans-serif",
            fontSize: "11px",
            color: t.textDim,
            marginTop: "20px",
            letterSpacing: "0.04em",
          }}
        >
          Reservas por{" "}
          <span
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "13px",
              fontWeight: 300,
              color: t.textMid,
              letterSpacing: "0.06em",
            }}
          >
            BeautySync
          </span>
        </p>
      </div>
    </div>
  );
}
