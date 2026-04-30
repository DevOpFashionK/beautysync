"use client";

// components/dashboard/clients/ClientDetailModal.tsx
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Phone,
  Mail,
  Scissors,
  Calendar,
  DollarSign,
  Clock,
  Star,
} from "lucide-react";
import {
  formatTime,
  formatDateMini,
  formatMonthYear,
  formatPrice,
  formatRelativeDate,
} from "@/lib/utils";
import type { ClientProfile } from "./ClientsClient";

interface ClientDetailModalProps {
  client: ClientProfile | null;
  primaryColor: string;
  onClose: () => void;
}

// ─── Status config Dark ───────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió",
};

const STATUS_STYLES: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  pending: {
    bg: "rgba(234,179,8,0.07)",
    color: "rgba(251,191,36,0.85)",
    border: "rgba(234,179,8,0.2)",
  },
  confirmed: {
    bg: "rgba(59,130,246,0.07)",
    color: "rgba(147,197,253,0.85)",
    border: "rgba(59,130,246,0.2)",
  },
  completed: {
    bg: "rgba(16,185,129,0.07)",
    color: "rgba(110,231,183,0.85)",
    border: "rgba(16,185,129,0.2)",
  },
  cancelled: {
    bg: "rgba(255,255,255,0.03)",
    color: "rgba(245,242,238,0.25)",
    border: "rgba(255,255,255,0.07)",
  },
  no_show: {
    bg: "rgba(239,68,68,0.07)",
    color: "rgba(252,165,165,0.85)",
    border: "rgba(239,68,68,0.2)",
  },
};

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const avatarPalettes = [
  { bg: "rgba(255,45,85,0.1)", text: "rgba(255,45,85,0.7)" },
  { bg: "rgba(59,130,246,0.1)", text: "rgba(147,197,253,0.7)" },
  { bg: "rgba(16,185,129,0.1)", text: "rgba(52,211,153,0.7)" },
  { bg: "rgba(234,179,8,0.1)", text: "rgba(251,191,36,0.7)" },
  { bg: "rgba(168,85,247,0.1)", text: "rgba(216,180,254,0.7)" },
];

function getAvatarPalette(name: string) {
  return avatarPalettes[name.charCodeAt(0) % avatarPalettes.length];
}

export default function ClientDetailModal({
  client,
  primaryColor,
  onClose,
}: ClientDetailModalProps) {
  if (!client) return null;

  const sortedAppointments = [...client.appointments].sort((a, b) =>
    b.scheduled_at.localeCompare(a.scheduled_at),
  );

  const palette = getAvatarPalette(client.name);

  return (
    <AnimatePresence>
      {client && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
              background: "rgba(8,7,6,0.8)",
              backdropFilter: "blur(6px)",
            }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-x-4 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2
                       sm:-translate-x-1/2 sm:-translate-y-1/2
                       z-50 w-full sm:w-[500px] max-h-[92vh] sm:max-h-[85vh]
                       overflow-hidden flex flex-col"
            style={{
              background: "#0E0C0B",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "14px 14px 0 0",
              boxShadow: "0 32px 80px rgba(0,0,0,0.65)",
            }}
          >
            {/* Acento top */}
            <div
              style={{
                height: "2px",
                background: `linear-gradient(90deg, ${primaryColor}88, transparent)`,
                flexShrink: 0,
              }}
            />

            {/* Header */}
            <div
              style={{
                padding: "20px 22px 16px",
                flexShrink: 0,
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: `radial-gradient(ellipse at top left, ${primaryColor}06, transparent 60%)`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "14px" }}
                >
                  {/* Avatar grande */}
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      fontWeight: 600,
                      flexShrink: 0,
                      background: palette.bg,
                      color: palette.text,
                      letterSpacing: "0.03em",
                    }}
                  >
                    {getInitials(client.name)}
                  </div>

                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "4px",
                      }}
                    >
                      <h2
                        style={{
                          fontFamily:
                            "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
                          fontSize: "1.4rem",
                          fontWeight: 300,
                          color: "rgba(245,242,238,0.88)",
                          letterSpacing: "-0.02em",
                          margin: 0,
                        }}
                      >
                        {client.name}
                      </h2>
                      {client.isFrequent && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "2px 8px",
                            borderRadius: "20px",
                            fontSize: "10px",
                            background: "rgba(234,179,8,0.08)",
                            border: "1px solid rgba(234,179,8,0.2)",
                            color: "rgba(251,191,36,0.8)",
                            letterSpacing: "0.04em",
                          }}
                        >
                          <Star
                            size={9}
                            strokeWidth={0}
                            style={{ fill: "rgba(251,191,36,0.7)" }}
                          />
                          Frecuente
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "rgba(245,242,238,0.22)",
                        margin: 0,
                        letterSpacing: "0.03em",
                      }}
                    >
                      Clienta desde {formatMonthYear(client.firstVisit)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(245,242,238,0.2)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color =
                      "rgba(245,242,238,0.5)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color =
                      "rgba(245,242,238,0.2)")
                  }
                >
                  <X size={15} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div
              style={{
                overflowY: "auto",
                flex: 1,
                padding: "18px 22px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {/* Métricas */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "8px",
                }}
              >
                {[
                  {
                    icon: <Calendar size={12} />,
                    label: "Citas",
                    value: client.totalAppointments.toString(),
                  },
                  {
                    icon: <DollarSign size={12} />,
                    label: "Gastado",
                    value: formatPrice(client.totalSpent),
                  },
                  {
                    icon: <Clock size={12} />,
                    label: "Última visita",
                    value: formatRelativeDate(client.lastVisit),
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    style={{
                      borderRadius: "8px",
                      padding: "12px 10px",
                      textAlign: "center",
                      background: `${primaryColor}08`,
                      border: `1px solid ${primaryColor}12`,
                    }}
                  >
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: `${primaryColor}14`,
                        color: `${primaryColor}CC`,
                        margin: "0 auto 6px",
                      }}
                    >
                      {m.icon}
                    </div>
                    <p
                      style={{
                        fontFamily:
                          "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
                        fontSize: "1.1rem",
                        fontWeight: 300,
                        lineHeight: 1,
                        color: `${primaryColor}CC`,
                        margin: 0,
                      }}
                    >
                      {m.value}
                    </p>
                    <p
                      style={{
                        fontSize: "9px",
                        color: "rgba(245,242,238,0.2)",
                        marginTop: "4px",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      {m.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Servicio favorito */}
              {client.favoriteService && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.055)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "7px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: `${primaryColor}12`,
                      border: `1px solid ${primaryColor}20`,
                      flexShrink: 0,
                    }}
                  >
                    <Scissors
                      size={13}
                      strokeWidth={1.75}
                      style={{ color: `${primaryColor}99` }}
                    />
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "10px",
                        color: "rgba(245,242,238,0.2)",
                        margin: "0 0 3px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      Servicio favorito
                    </p>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "rgba(245,242,238,0.7)",
                        margin: 0,
                      }}
                    >
                      {client.favoriteService}
                    </p>
                  </div>
                </div>
              )}

              {/* Contacto */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <p
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(245,242,238,0.18)",
                    margin: 0,
                  }}
                >
                  Contacto
                </p>
                <a
                  href={`tel:${client.phone}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.055)",
                    background: "transparent",
                    textDecoration: "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "rgba(255,255,255,0.03)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "transparent")
                  }
                >
                  <Phone
                    size={13}
                    strokeWidth={1.5}
                    style={{ color: "rgba(245,242,238,0.25)" }}
                  />
                  <span
                    style={{ fontSize: "13px", color: "rgba(245,242,238,0.6)" }}
                  >
                    {client.phone}
                  </span>
                </a>
                {client.email && (
                  <a
                    href={`mailto:${client.email}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.055)",
                      background: "transparent",
                      textDecoration: "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "rgba(255,255,255,0.03)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "transparent")
                    }
                  >
                    <Mail
                      size={13}
                      strokeWidth={1.5}
                      style={{ color: "rgba(245,242,238,0.25)" }}
                    />
                    <span
                      style={{
                        fontSize: "13px",
                        color: "rgba(245,242,238,0.6)",
                      }}
                    >
                      {client.email}
                    </span>
                  </a>
                )}
              </div>

              {/* Historial */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <p
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(245,242,238,0.18)",
                    margin: 0,
                  }}
                >
                  Historial de citas
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {sortedAppointments.map((appt, i) => {
                    const ss =
                      STATUS_STYLES[appt.status] ?? STATUS_STYLES.cancelled;
                    return (
                      <motion.div
                        key={appt.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid rgba(255,255,255,0.055)",
                          background: "rgba(255,255,255,0.015)",
                        }}
                      >
                        {/* Bloque fecha/hora */}
                        <div
                          style={{
                            flexShrink: 0,
                            textAlign: "center",
                            padding: "6px 8px",
                            borderRadius: "6px",
                            minWidth: "52px",
                            background: `${primaryColor}10`,
                            border: `1px solid ${primaryColor}18`,
                          }}
                        >
                          <p
                            style={{
                              fontSize: "11px",
                              fontWeight: 400,
                              lineHeight: 1,
                              color: `${primaryColor}CC`,
                              margin: 0,
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {formatTime(appt.scheduled_at)}
                          </p>
                          <p
                            style={{
                              fontSize: "9px",
                              color: "rgba(245,242,238,0.2)",
                              marginTop: "3px",
                              margin: "3px 0 0",
                            }}
                          >
                            {formatDateMini(appt.scheduled_at)}
                          </p>
                        </div>

                        {/* Servicio */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: "12px",
                              fontWeight: 400,
                              color: "rgba(245,242,238,0.7)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              margin: 0,
                            }}
                          >
                            {appt.services?.name ?? "Servicio eliminado"}
                          </p>
                          {appt.services && (
                            <p
                              style={{
                                fontSize: "10px",
                                color: "rgba(245,242,238,0.25)",
                                margin: "2px 0 0",
                              }}
                            >
                              {formatPrice(appt.services.price)}
                            </p>
                          )}
                        </div>

                        {/* Status badge */}
                        <span
                          style={{
                            flexShrink: 0,
                            fontSize: "10px",
                            padding: "2px 8px",
                            borderRadius: "20px",
                            background: ss.bg,
                            color: ss.color,
                            border: `1px solid ${ss.border}`,
                            letterSpacing: "0.04em",
                          }}
                        >
                          {STATUS_LABELS[appt.status] ?? appt.status}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
