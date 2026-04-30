"use client";

/**
 * components/providers/SessionTimeout.tsx
 * BeautySync — Fase 7.5
 *
 * Detecta inactividad del usuario y cierra sesión automáticamente
 * después de 30 minutos sin actividad, con aviso previo de 5 minutos.
 *
 * Eventos que resetean el timer: mousemove, keydown, mousedown,
 * touchstart, scroll, click
 *
 * No interrumpe flujos activos — solo avisa y espera confirmación.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, LogOut, RefreshCw } from "lucide-react";

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
};

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const INACTIVITY_MS = 25 * 60 * 1000; // 25 min → muestra aviso
const WARNING_MS = 5 * 60 * 1000; //  5 min → tiempo del countdown
// const TOTAL_MS = INACTIVITY_MS + WARNING_MS; // 30 min total

// Eventos de actividad que resetean el timer
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "click",
] as const;

export default function SessionTimeout() {
  const router = useRouter();
  const supabase = createClient();

  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_MS / 1000);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Refs para timers (evita closures stales)
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── LOGOUT ─────────────────────────────────────────────────────────────────
  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);

    await supabase.auth.signOut();
    router.replace("/login?timeout=true");
  }, [supabase, router]);

  // ─── INICIAR COUNTDOWN ──────────────────────────────────────────────────────
  const startCountdown = useCallback(() => {
    setSecondsLeft(WARNING_MS / 1000);
    if (countdownTimer.current) clearInterval(countdownTimer.current);

    countdownTimer.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer.current!);
          handleSignOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleSignOut]);

  // ─── RESETEAR TIMER DE INACTIVIDAD ──────────────────────────────────────────
  const resetTimer = useCallback(() => {
    if (isSigningOut) return;
    if (showWarning) return; // el usuario debe confirmar explícitamente

    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);

    inactivityTimer.current = setTimeout(() => {
      setShowWarning(true);
      startCountdown();
    }, INACTIVITY_MS);
  }, [isSigningOut, showWarning, startCountdown]);

  // ─── CONTINUAR SESIÓN ───────────────────────────────────────────────────────
  const handleContinue = useCallback(() => {
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    setShowWarning(false);
    setSecondsLeft(WARNING_MS / 1000);

    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setShowWarning(true);
      startCountdown();
    }, INACTIVITY_MS);
  }, [startCountdown]);

  // ─── MONTAR / DESMONTAR LISTENERS ───────────────────────────────────────────
  useEffect(() => {
    resetTimer();

    let lastActivity = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivity < 1000) return;
      lastActivity = now;
      resetTimer();
    };

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar

  // ─── FORMATO MM:SS ───────────────────────────────────────────────────────────
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const countdown = `${minutes}:${String(seconds).padStart(2, "0")}`;

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {showWarning && (
        <>
          {/* ── Overlay ───────────────────────────────────────────────────── */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(8,7,6,0.82)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              zIndex: 9998,
            }}
            onClick={handleContinue}
            aria-hidden="true"
          />

          {/* ── Modal ─────────────────────────────────────────────────────── */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 14 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="timeout-title"
            aria-describedby="timeout-desc"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 9999,
              width: "min(420px, calc(100vw - 2rem))",
              background: t.surface,
              border: `1px solid ${t.borderMid}`,
              borderRadius: "18px",
              padding: "28px",
              boxShadow: "0 24px 80px rgba(0,0,0,0.60)",
              // Radial sutil
              backgroundImage: `radial-gradient(ellipse at top left, rgba(255,45,85,0.05) 0%, transparent 60%)`,
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

            {/* ── Eyebrow ───────────────────────────────────────────────── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "20px",
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
                Seguridad de sesión
              </span>
            </div>

            {/* ── Ícono ─────────────────────────────────────────────────── */}
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: t.roseGhost,
                border: `1px solid ${t.roseBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "18px",
              }}
            >
              <Timer size={20} color={t.roseDim} />
            </div>

            {/* ── Título ────────────────────────────────────────────────── */}
            <h2
              id="timeout-title"
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontSize: "24px",
                fontWeight: 300,
                color: t.textPrimary,
                margin: "0 0 8px",
                lineHeight: 1.2,
                letterSpacing: "0.01em",
              }}
            >
              ¿Sigues ahí?
            </h2>

            {/* ── Descripción ───────────────────────────────────────────── */}
            <p
              id="timeout-desc"
              style={{
                fontFamily: "var(--font-jakarta), sans-serif",
                fontSize: "13px",
                color: t.textMid,
                margin: "0 0 20px",
                lineHeight: 1.65,
              }}
            >
              Por seguridad, cerraremos tu sesión por inactividad. Tu progreso
              guardado no se perderá.
            </p>

            {/* ── Countdown ─────────────────────────────────────────────── */}
            <div
              style={{
                background: t.roseGhost,
                border: `1px solid ${t.roseBorder}`,
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Timer size={15} color={t.roseDim} style={{ flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: "var(--font-jakarta), sans-serif",
                  fontSize: "13px",
                  color: t.textMid,
                }}
              >
                Sesión se cerrará en{" "}
                <span
                  style={{
                    fontFamily: "var(--font-cormorant), serif",
                    fontSize: "20px",
                    fontWeight: 300,
                    color: t.rose,
                    letterSpacing: "0.02em",
                  }}
                >
                  {countdown}
                </span>
              </span>
            </div>

            {/* ── Divisor ───────────────────────────────────────────────── */}
            <div
              style={{
                height: "1px",
                background: t.border,
                marginBottom: "20px",
              }}
            />

            {/* ── Botones ───────────────────────────────────────────────── */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {/* Primario: seguir conectada */}
              <button
                onClick={handleContinue}
                disabled={isSigningOut}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: t.rose,
                  border: `1px solid ${t.rose}`,
                  borderRadius: "10px",
                  fontFamily: "var(--font-jakarta), sans-serif",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#fff",
                  cursor: isSigningOut ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "filter 0.18s ease",
                  opacity: isSigningOut ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSigningOut)
                    e.currentTarget.style.filter = "brightness(1.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = "brightness(1)";
                }}
              >
                <RefreshCw size={14} />
                Seguir conectada
              </button>

              {/* Secundario: cerrar sesión ahora */}
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                style={{
                  width: "100%",
                  padding: "11px",
                  background: "transparent",
                  border: `1px solid ${t.border}`,
                  borderRadius: "10px",
                  fontFamily: "var(--font-jakarta), sans-serif",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: t.textMid,
                  cursor: isSigningOut ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "border-color 0.18s, color 0.18s",
                  opacity: isSigningOut ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSigningOut) {
                    e.currentTarget.style.borderColor = t.borderMid;
                    e.currentTarget.style.color = t.textPrimary;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = t.border;
                  e.currentTarget.style.color = t.textMid;
                }}
              >
                {isSigningOut ? (
                  "Cerrando sesión…"
                ) : (
                  <>
                    <LogOut size={14} />
                    Cerrar sesión ahora
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
