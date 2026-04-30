"use client";

// components/dashboard/SubscriptionGate.tsx
//
// Bloquea acceso al dashboard cuando la suscripción no está activa.
// Named export { SubscriptionGate } — coincide con el import del layout.
//
// El layout ya lo monta correctamente:
//   <SubscriptionGate status={effectiveStatus} trialDaysRemaining={trialDaysRemaining}
//     primaryColor={primaryColor} salonName={salon.name}>
//     {children}
//   </SubscriptionGate>

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CreditCard,
  LogOut,
  RefreshCw,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SubscriptionGateProps {
  status: string | null;
  trialDaysRemaining: number | null;
  salonName: string;
  primaryColor: string;
  children: React.ReactNode;
}

const BLOCKED_STATUSES = ["expired", "canceled", "past_due"];

const T = {
  bg: "#080706",
  surface: "#0E0C0B",
  border: "rgba(255,255,255,0.055)",
  borderMid: "rgba(255,255,255,0.09)",
  textPrimary: "rgba(245,242,238,0.9)",
  textMid: "rgba(245,242,238,0.45)",
  textDim: "rgba(245,242,238,0.18)",
  roseDim: "rgba(255,45,85,0.55)",
  roseGhost: "rgba(255,45,85,0.08)",
  roseBorder: "rgba(255,45,85,0.22)",
};

const STATUS_CONFIG: Record<
  string,
  {
    title: string;
    message: string;
    cta: string;
    accent: { bg: string; border: string; icon: string };
  }
> = {
  expired: {
    title: "Tu período de prueba terminó",
    message:
      "Tu trial de 14 días ha finalizado. Activa un plan para seguir recibiendo reservas y gestionando tu salón.",
    cta: "Activar plan",
    accent: {
      bg: "rgba(234,179,8,0.07)",
      border: "rgba(234,179,8,0.2)",
      icon: "rgba(251,191,36,0.75)",
    },
  },
  canceled: {
    title: "Suscripción cancelada",
    message:
      "Tu suscripción fue cancelada. Reactívala para que tus clientas puedan volver a agendar en línea.",
    cta: "Reactivar plan",
    accent: {
      bg: "rgba(255,255,255,0.03)",
      border: "rgba(255,255,255,0.055)", // ✅ fix: 0.07 → border 0.055
      icon: "rgba(245,242,238,0.18)", // ✅ fix: 0.3 → textDim 0.18
    },
  },
  past_due: {
    title: "Pago pendiente",
    message:
      "Hay un problema con tu método de pago. Actualízalo para restablecer el acceso completo a tu panel.",
    cta: "Actualizar método de pago",
    accent: {
      bg: "rgba(239,68,68,0.07)",
      border: "rgba(239,68,68,0.18)",
      icon: "rgba(252,165,165,0.8)",
    },
  },
};

// ─── Banner de trial próximo a vencer ────────────────────────────────────────
function TrialBanner({ daysRemaining }: { daysRemaining: number }) {
  if (daysRemaining > 3) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 20px",
        background: "rgba(234,179,8,0.07)",
        borderBottom: "1px solid rgba(234,179,8,0.14)",
        flexShrink: 0,
      }}
    >
      <Clock
        size={12}
        strokeWidth={1.75}
        style={{ color: "rgba(251,191,36,0.7)", flexShrink: 0 }}
      />
      <p
        style={{
          fontSize: "12px",
          color: "rgba(251,191,36,0.7)",
          letterSpacing: "0.02em",
        }}
      >
        {daysRemaining === 0
          ? "Tu trial vence hoy"
          : `Tu trial vence en ${daysRemaining} día${daysRemaining !== 1 ? "s" : ""}`}
        {" — "}
        <Link
          href="/dashboard/billing"
          style={{
            color: "rgba(251,191,36,0.95)",
            fontWeight: 500,
            textDecoration: "underline",
            textUnderlineOffset: "2px",
          }}
        >
          activar plan ahora
        </Link>
      </p>
    </motion.div>
  );
}

// ─── Pantalla de bloqueo ──────────────────────────────────────────────────────
function BlockedScreen({
  status,
  salonName,
  primaryColor,
}: {
  status: string;
  salonName: string;
  primaryColor: string;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.expired;

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${primaryColor}07 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: "100%",
          maxWidth: "400px",
          background: T.surface,
          border: `1px solid ${T.borderMid}`,
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            height: "2px",
            background: `linear-gradient(90deg, ${primaryColor}88, transparent)`,
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "14px",
            height: "14px",
            borderTop: `1px solid ${T.roseBorder}`,
            borderRight: `1px solid ${T.roseBorder}`,
            borderTopRightRadius: "16px",
            pointerEvents: "none",
          }}
        />

        <div style={{ padding: "32px 28px" }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 }}
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: cfg.accent.bg,
              border: `1px solid ${cfg.accent.border}`,
              marginBottom: "20px",
            }}
          >
            <AlertTriangle
              size={22}
              strokeWidth={1.75}
              style={{ color: cfg.accent.icon }}
            />
          </motion.div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "10px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "12px",
                height: "1px",
                background: T.roseDim,
              }}
            />
            <span
              style={{
                fontSize: "10px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: T.roseDim,
              }}
            >
              {salonName}
            </span>
          </div>

          <h1
            style={{
              fontFamily:
                "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "1.65rem",
              fontWeight: 300,
              color: T.textPrimary,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
              margin: "0 0 12px",
            }}
          >
            {cfg.title}
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: T.textDim,
              lineHeight: 1.7,
              letterSpacing: "0.02em",
              margin: "0 0 28px",
            }}
          >
            {cfg.message}
          </p>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <Link href="/dashboard/billing" style={{ textDecoration: "none" }}>
              <motion.div
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "13px",
                  borderRadius: "9px",
                  border: `1px solid ${T.roseBorder}`,
                  background: T.roseGhost,
                  color: T.roseDim,
                  fontSize: "12px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,45,85,0.16)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(255,45,85,0.42)";
                  (e.currentTarget as HTMLElement).style.color = "#FF2D55";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    T.roseGhost;
                  (e.currentTarget as HTMLElement).style.borderColor =
                    T.roseBorder;
                  (e.currentTarget as HTMLElement).style.color = T.roseDim;
                }}
              >
                <CreditCard size={14} strokeWidth={1.75} />
                {cfg.cta}
              </motion.div>
            </Link>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.reload()}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                padding: "11px",
                borderRadius: "9px",
                border: `1px solid ${T.border}`,
                background: "transparent",
                color: T.textDim,
                fontSize: "12px",
                letterSpacing: "0.06em",
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  T.borderMid;
                (e.currentTarget as HTMLElement).style.color = T.textMid;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = T.border;
                (e.currentTarget as HTMLElement).style.color = T.textDim;
              }}
            >
              <RefreshCw size={13} strokeWidth={1.75} />
              Ya pagué — recargar
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                padding: "10px",
                borderRadius: "9px",
                border: "none",
                background: "transparent",
                color: T.textDim,
                fontSize: "11px",
                letterSpacing: "0.06em",
                cursor: loggingOut ? "not-allowed" : "pointer",
                opacity: loggingOut ? 0.4 : 1,
                transition: "color 0.2s",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = T.textMid)
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color = T.textDim)
              }
            >
              <LogOut size={12} strokeWidth={1.75} />
              Cerrar sesión
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Componente principal — named export ──────────────────────────────────────
export function SubscriptionGate({
  status,
  trialDaysRemaining,
  salonName,
  primaryColor,
  children,
}: SubscriptionGateProps) {
  if (status && BLOCKED_STATUSES.includes(status)) {
    return (
      <BlockedScreen
        status={status}
        salonName={salonName}
        primaryColor={primaryColor}
      />
    );
  }

  return (
    <>
      {status === "trialing" && trialDaysRemaining !== null && (
        <TrialBanner daysRemaining={trialDaysRemaining} />
      )}
      {children}
    </>
  );
}
