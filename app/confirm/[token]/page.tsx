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
  title: string;
  subtitle: string;
  showDetails: boolean;
}

function serviceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

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
    primary_color: salons?.primary_color ?? "#D4375F",
  };
}

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

const STATUS_CONFIG: Record<ConfirmStatus, StatusConfig> = {
  success: {
    icon: CheckCircle,
    iconColor: "#22c55e",
    title: "¡Cita confirmada!",
    subtitle: "Tu asistencia ha sido registrada. Te esperamos.",
    showDetails: true,
  },
  already_confirmed: {
    icon: CheckCircle,
    iconColor: "#22c55e",
    title: "Ya estás confirmada",
    subtitle: "Tu cita ya había sido confirmada anteriormente.",
    showDetails: true,
  },
  expired: {
    icon: Clock,
    iconColor: "#f59e0b",
    title: "Link ya no está activo",
    subtitle: "Esta cita ya pasó o el tiempo de confirmación venció.",
    showDetails: false,
  },
  not_found: {
    icon: AlertCircle,
    iconColor: "#f59e0b",
    title: "Link no encontrado",
    subtitle:
      "No encontramos una cita asociada a este link. Verifica el email original.",
    showDetails: false,
  },
  invalid: {
    icon: XCircle,
    iconColor: "#ef4444",
    title: "Link inválido",
    subtitle: "Este link de confirmación no tiene el formato correcto.",
    showDetails: false,
  },
  error: {
    icon: XCircle,
    iconColor: "#ef4444",
    title: "Algo salió mal",
    subtitle:
      "Ocurrió un error inesperado. Por favor contacta al salón directamente.",
    showDetails: false,
  },
};

export default async function ConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { token } = await params;
  const { status: rawStatus } = await searchParams;

  const status: ConfirmStatus =
    rawStatus && rawStatus in STATUS_CONFIG
      ? (rawStatus as ConfirmStatus)
      : "error";

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const appt = config.showDetails ? await getAppointmentData(token) : null;
  const primaryColor = appt?.primary_color ?? "#D4375F";

  return (
    <div
      style={{
        margin: 0,
        padding: "40px 16px",
        backgroundColor: "#FAF8F5",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: "480px" }}>
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #EDE8E3",
            borderRadius: "16px",
            padding: "40px 32px",
            boxShadow: "0 2px 16px rgba(45, 36, 32, 0.06)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "22px",
              fontWeight: 600,
              color: primaryColor,
              margin: "0 0 32px 0",
              letterSpacing: "0.04em",
            }}
          >
            BeautySync
          </p>

          <div style={{ marginBottom: "20px" }}>
            <Icon
              style={{
                color: config.iconColor,
                width: 56,
                height: 56,
                display: "inline-block",
              }}
              strokeWidth={1.5}
            />
          </div>

          <h1
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "28px",
              fontWeight: 600,
              color: "#2D2420",
              margin: "0 0 10px 0",
              lineHeight: 1.2,
            }}
          >
            {config.title}
          </h1>

          <p
            style={{
              fontSize: "15px",
              color: "#9C8E85",
              margin: "0 0 32px 0",
              lineHeight: 1.6,
            }}
          >
            {config.subtitle}
          </p>

          {config.showDetails && appt && (
            <div>
              <div
                style={{
                  height: "1px",
                  backgroundColor: "#EDE8E3",
                  margin: "0 0 24px 0",
                }}
              />

              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: primaryColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  margin: "0 0 16px 0",
                }}
              >
                {appt.salon_name}
              </p>

              <div
                style={{
                  backgroundColor: "#FAF8F5",
                  border: "1px solid #EDE8E3",
                  borderRadius: "10px",
                  padding: "16px 20px",
                  textAlign: "left",
                  marginBottom: "24px",
                }}
              >
                <p
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#2D2420",
                    margin: "0 0 12px 0",
                  }}
                >
                  {appt.client_name}
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <MapPin
                    style={{
                      width: 14,
                      height: 14,
                      color: "#9C8E85",
                      flexShrink: 0,
                    }}
                    strokeWidth={1.5}
                  />
                  <span style={{ fontSize: "14px", color: "#2D2420" }}>
                    {appt.service_name}
                  </span>
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Calendar
                    style={{
                      width: 14,
                      height: 14,
                      color: "#9C8E85",
                      flexShrink: 0,
                    }}
                    strokeWidth={1.5}
                  />
                  <span style={{ fontSize: "14px", color: "#2D2420" }}>
                    {formatDateFull(appt.scheduled_at)} —{" "}
                    {formatTime(appt.scheduled_at)}
                    {appt.ends_at ? ` a ${formatTime(appt.ends_at)}` : ""}
                  </span>
                </div>
              </div>

              <a
                href={buildGoogleCalendarUrl(appt)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: primaryColor,
                  color: "#FFFFFF",
                  textDecoration: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                }}
              >
                <Calendar style={{ width: 16, height: 16 }} strokeWidth={2} />
                Agregar al calendario
              </a>
            </div>
          )}
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "#C4B8B0",
            marginTop: "20px",
          }}
        >
          Powered by{" "}
          <span
            style={{
              fontFamily: "Georgia, serif",
              fontWeight: 600,
              color: "#9C8E85",
            }}
          >
            BeautySync
          </span>
        </p>
      </div>
    </div>
  );
}
