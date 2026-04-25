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

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const INACTIVITY_MS = 25 * 60 * 1000; // 25 min → muestra aviso
const WARNING_MS = 5 * 60 * 1000; //  5 min → tiempo del countdown
const TOTAL_MS = INACTIVITY_MS + WARNING_MS; // 30 min total

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

  // ─── LOGOUT ───────────────────────────────────────────────────────────────
  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    // Limpiar timers antes de salir
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);

    await supabase.auth.signOut();
    router.replace("/login?timeout=true");
  }, [supabase, router]);

  // ─── INICIAR COUNTDOWN (cuando aparece el aviso) ──────────────────────────
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

  // ─── RESETEAR TIMER DE INACTIVIDAD ───────────────────────────────────────
  const resetTimer = useCallback(() => {
    // Si ya se está cerrando sesión, no hacer nada
    if (isSigningOut) return;

    // Si el aviso está visible, no resetear por actividad accidental
    // (el usuario debe hacer clic en "Seguir conectada" explícitamente)
    if (showWarning) return;

    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);

    inactivityTimer.current = setTimeout(() => {
      setShowWarning(true);
      startCountdown();
    }, INACTIVITY_MS);
  }, [isSigningOut, showWarning, startCountdown]);

  // ─── CONTINUAR SESIÓN (botón del modal) ──────────────────────────────────
  const handleContinue = useCallback(() => {
    // Detener countdown
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    setShowWarning(false);
    setSecondsLeft(WARNING_MS / 1000);

    // Reiniciar timer de inactividad desde cero
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setShowWarning(true);
      startCountdown();
    }, INACTIVITY_MS);
  }, [startCountdown]);

  // ─── MONTAR/DESMONTAR LISTENERS ───────────────────────────────────────────
  useEffect(() => {
    // Iniciar timer al montar
    resetTimer();

    // Throttle: no procesar eventos más de 1 vez por segundo
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
      // Cleanup completo al desmontar
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar — resetTimer se llama desde handleActivity

  // ─── FORMATO MM:SS ────────────────────────────────────────────────────────
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const countdown = `${minutes}:${String(seconds).padStart(2, "0")}`;

  // ─── NADA SI NO HAY AVISO ─────────────────────────────────────────────────
  // El componente no renderiza nada visible durante operación normal
  return (
    <AnimatePresence>
      {showWarning && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 10, 30, 0.75)",
              backdropFilter: "blur(4px)",
              zIndex: 9998,
            }}
            onClick={handleContinue} // Clic en overlay = continuar
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
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
              background: "rgba(26, 20, 45, 0.97)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "20px",
              padding: "2rem",
              boxShadow:
                "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
              fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
            }}
          >
            {/* Ícono */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "14px",
                background: "rgba(255, 185, 0, 0.12)",
                border: "1px solid rgba(255, 185, 0, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1.25rem",
              }}
            >
              <Timer size={24} color="#FFC107" />
            </div>

            {/* Título */}
            <h2
              id="timeout-title"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "1.5rem",
                fontWeight: 600,
                color: "#F5F3FF",
                margin: "0 0 0.5rem",
                lineHeight: 1.2,
              }}
            >
              ¿Sigues ahí?
            </h2>

            {/* Descripción */}
            <p
              id="timeout-desc"
              style={{
                fontSize: "0.875rem",
                color: "#B3B0C2",
                margin: "0 0 1.5rem",
                lineHeight: 1.6,
              }}
            >
              Por seguridad, cerraremos tu sesión por inactividad. Tu progreso
              guardado no se perderá.
            </p>

            {/* Countdown */}
            <div
              style={{
                background: "rgba(255, 185, 0, 0.06)",
                border: "1px solid rgba(255, 185, 0, 0.15)",
                borderRadius: "12px",
                padding: "0.875rem 1rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <Timer size={16} color="#FFC107" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: "0.8125rem", color: "#B3B0C2" }}>
                Sesión se cerrará en{" "}
                <span
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "#FFC107",
                  }}
                >
                  {countdown}
                </span>
              </span>
            </div>

            {/* Botones */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {/* Primario: seguir conectada */}
              <button
                onClick={handleContinue}
                disabled={isSigningOut}
                style={{
                  width: "100%",
                  padding: "0.9375rem",
                  background:
                    "linear-gradient(135deg, #FF2D55 0%, #D4003C 100%)",
                  border: "none",
                  borderRadius: "10px",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  boxShadow: "0 4px 20px rgba(255,45,85,0.35)",
                  transition: "opacity 0.15s",
                  opacity: isSigningOut ? 0.5 : 1,
                }}
              >
                <RefreshCw size={16} />
                Seguir conectada
              </button>

              {/* Secundario: cerrar sesión ahora */}
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                style={{
                  width: "100%",
                  padding: "0.875rem",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#B3B0C2",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  transition: "all 0.15s",
                  opacity: isSigningOut ? 0.5 : 1,
                }}
              >
                {isSigningOut ? (
                  "Cerrando sesión…"
                ) : (
                  <>
                    <LogOut size={15} /> Cerrar sesión ahora
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
