"use client";

// components/dashboard/clients/ClientCard.tsx
import { motion } from "framer-motion";
import { Phone, Scissors, Star, ChevronRight } from "lucide-react";
import type { ClientProfile } from "./ClientsClient";

interface ClientCardProps {
  client: ClientProfile;
  primaryColor: string;
  index: number;
  onClick: () => void;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(price);
}

function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem.`;
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
  return `Hace ${Math.floor(diffDays / 365)} año(s)`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// Paletas de avatar dark
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

export default function ClientCard({
  client,
  primaryColor,
  index,
  onClick,
}: ClientCardProps) {
  const initials = getInitials(client.name);
  const palette = getAvatarPalette(client.name);

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      onClick={onClick}
      className="group"
      style={{
        width: "100%",
        textAlign: "left",
        background: "#0E0C0B",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.055)",
        padding: "18px",
        cursor: "pointer",
        transition: "border-color 0.2s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "rgba(255,255,255,0.1)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor =
          "rgba(255,255,255,0.055)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Avatar */}
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: 600,
              flexShrink: 0,
              background: palette.bg,
              color: palette.text,
              letterSpacing: "0.03em",
            }}
          >
            {initials}
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 400,
                  color: "rgba(245,242,238,0.85)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  margin: 0,
                }}
              >
                {client.name}
              </p>
              {client.isFrequent && (
                <Star
                  size={11}
                  strokeWidth={0}
                  style={{
                    color: "rgba(251,191,36,0.7)",
                    fill: "rgba(251,191,36,0.7)",
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
            <p
              style={{
                fontSize: "11px",
                color: "rgba(245,242,238,0.22)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                marginTop: "2px",
              }}
            >
              <Phone size={10} strokeWidth={1.5} />
              {client.phone}
            </p>
          </div>
        </div>

        <ChevronRight
          size={13}
          strokeWidth={1.5}
          style={{
            color: "rgba(245,242,238,0.15)",
            flexShrink: 0,
            marginTop: "2px",
          }}
        />
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "8px",
          marginBottom: "14px",
        }}
      >
        {/* Citas */}
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily:
                "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "1.3rem",
              fontWeight: 300,
              lineHeight: 1,
              color: `${primaryColor}CC`,
              margin: 0,
            }}
          >
            {client.totalAppointments}
          </p>
          <p
            style={{
              fontSize: "9px",
              color: "rgba(245,242,238,0.2)",
              marginTop: "3px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {client.totalAppointments === 1 ? "cita" : "citas"}
          </p>
        </div>

        {/* Gastado */}
        <div
          style={{
            textAlign: "center",
            borderLeft: "1px solid rgba(255,255,255,0.05)",
            borderRight: "1px solid rgba(255,255,255,0.05)",
          }}
        >
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
            {formatPrice(client.totalSpent)}
          </p>
          <p
            style={{
              fontSize: "9px",
              color: "rgba(245,242,238,0.2)",
              marginTop: "3px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            gastado
          </p>
        </div>

        {/* Última visita */}
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 400,
              color: "rgba(245,242,238,0.5)",
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            {formatRelativeDate(client.lastVisit)}
          </p>
          <p
            style={{
              fontSize: "9px",
              color: "rgba(245,242,238,0.2)",
              marginTop: "3px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            última visita
          </p>
        </div>
      </div>

      {/* Servicio favorito */}
      {client.favoriteService && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 10px",
            borderRadius: "6px",
            background: `${primaryColor}10`,
            border: `1px solid ${primaryColor}18`,
          }}
        >
          <Scissors
            size={9}
            strokeWidth={1.75}
            style={{ color: `${primaryColor}88` }}
          />
          <span
            style={{
              fontSize: "10px",
              color: `${primaryColor}AA`,
              letterSpacing: "0.04em",
            }}
          >
            {client.favoriteService}
          </span>
        </div>
      )}
    </motion.button>
  );
}
