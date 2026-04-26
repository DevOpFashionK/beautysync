"use client";

// components/booking/BookingWidget.tsx
// Fase 8.1 v2 — Stepper y layout adaptados a la estética oscura premium

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Check } from "lucide-react";
import dynamic from "next/dynamic";

import ServiceSelector from "@/components/booking/ServiceSelector";
import BookingForm from "@/components/booking/BookingForm";
import BookingConfirmation from "@/components/booking/BookingConfirmation";

const TimeSlotPicker = dynamic(
  () => import("@/components/booking/TimeSlotPicker"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 192,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.08)",
            borderTopColor: "rgba(255,255,255,0.3)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    ),
  },
);

import type {
  BookingStep,
  SelectedService,
  BookingFormData,
  SalonPublicData,
  ServicePublicData,
} from "@/types/booking.types";

interface BookingWidgetProps {
  salon: SalonPublicData;
  services: ServicePublicData[];
}

const STEPS_ORDER: BookingStep[] = ["service", "date", "form", "confirmation"];

const STEP_LABELS: Record<Exclude<BookingStep, "confirmation">, string> = {
  service: "Servicio",
  date: "Fecha y hora",
  form: "Tus datos",
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 48 : -48,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -48 : 48,
    opacity: 0,
  }),
};

// ─── Estilos del stepper ──────────────────────────────────────────────────────
const stepperStyles = `
.bw-stepper {
  display: flex;
  align-items: center;
  margin-bottom: 28px;
  gap: 4px;
  width: 100%;
  padding-right: 8px;
}

  .bw-steps {
    display: flex;
    align-items: center;
    gap: 0;
    flex: 1;
    min-width: 0;
  }

  .bw-step {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-shrink: 0;
  }

  .bw-step-circle {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 700;
    transition: all 0.3s ease;
    font-family: var(--font-jakarta), sans-serif;
  }

  .bw-step-circle.done {
    background: var(--color-brand);
    border: none;
  }

  .bw-step-circle.active {
    background: var(--color-brand);
    border: none;
    box-shadow: 0 0 16px color-mix(in srgb, var(--color-brand) 50%, transparent);
  }

  .bw-step-circle.pending {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
  }

  .bw-step-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
  transition: color 0.2s;
  font-family: var(--font-jakarta), sans-serif;
  display: none;
}

.bw-step-label.active {
  display: block;
  color: rgba(245,242,238,0.95);
}

.bw-step-label.done {
  display: none;
}

.bw-step-label.pending {
  display: none;
}

  .bw-connector {
    flex: 1;
    height: 1.5px;
    min-width: 12px;
    max-width: 32px;
    border-radius: 2px;
    transition: background-color 0.4s ease;
    margin: 0 4px;
  }

  .bw-connector.done    { background: var(--color-brand); }
  .bw-connector.pending { background: rgba(255,255,255,0.08); }

  .bw-divider {
    height: 1px;
    background: rgba(255,255,255,0.07);
    margin-bottom: 24px;
  }

  .bw-back-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
    color: rgba(245,242,238,0.4);
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 8px;
    flex-shrink: 0;
    transition: background 0.15s, color 0.15s;
    font-family: var(--font-jakarta), sans-serif;
  }

  .bw-back-btn:hover {
    background: rgba(255,255,255,0.06);
    color: rgba(245,242,238,0.8);
  }
`;

// ─── Componente principal ─────────────────────────────────────────────────────
export default function BookingWidget({ salon, services }: BookingWidgetProps) {
  const primaryColor = salon.primary_color || "#D4375F";

  const [step, setStep] = useState<BookingStep>("service");
  const [direction, setDirection] = useState(1);
  const [selectedService, setSelectedService] =
    useState<SelectedService | null>(null);
  const [selectedDatetime, setSelectedDatetime] = useState<string>("");
  const [selectedTimeDisplay, setSelectedTimeDisplay] = useState<string>("");
  const [selectedDateDisplay, setSelectedDateDisplay] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── Navegación ──────────────────────────────────────────────────────────────
  const goTo = useCallback(
    (nextStep: BookingStep) => {
      const currentIdx = STEPS_ORDER.indexOf(step);
      const nextIdx = STEPS_ORDER.indexOf(nextStep);
      setDirection(nextIdx > currentIdx ? 1 : -1);
      setStep(nextStep);
    },
    [step],
  );

  const goBack = useCallback(() => {
    const idx = STEPS_ORDER.indexOf(step);
    if (idx > 0) goTo(STEPS_ORDER[idx - 1]);
  }, [step, goTo]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleServiceSelect = useCallback(
    (service: SelectedService) => {
      setSelectedService(service);
      goTo("date");
    },
    [goTo],
  );

  const handleSlotSelect = useCallback(
    (datetime: string, timeDisplay: string, dateDisplay: string) => {
      setSelectedDatetime(datetime);
      setSelectedTimeDisplay(timeDisplay);
      setSelectedDateDisplay(dateDisplay);
      goTo("form");
    },
    [goTo],
  );

  const handleFormSubmit = useCallback(
    async (formData: BookingFormData) => {
      if (!selectedService) return;
      setIsSubmitting(true);
      setApiError(null);

      try {
        const payload = {
          salon_id: salon.id,
          service_id: selectedService.id,
          client_name: formData.client_name,
          client_email: formData.client_email || undefined,
          client_phone: formData.client_phone,
          client_notes: formData.client_notes || undefined,
          scheduled_at: selectedDatetime,
        };

        const res = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          setApiError(
            data.error || "No se pudo crear la reserva. Intenta nuevamente.",
          );
          return;
        }

        setClientName(formData.client_name);
        goTo("confirmation");
      } catch {
        setApiError(
          "Error de conexión. Verifica tu internet e intenta nuevamente.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [salon.id, selectedService, selectedDatetime, goTo],
  );

  const handleBookAnother = useCallback(() => {
    setSelectedService(null);
    setSelectedDatetime("");
    setSelectedTimeDisplay("");
    setSelectedDateDisplay("");
    setClientName("");
    setApiError(null);
    setDirection(-1);
    setStep("service");
  }, []);

  // ── Datos derivados ─────────────────────────────────────────────────────────
  const currentStepIndex = STEPS_ORDER.indexOf(step);
  const showBack = step !== "service" && step !== "confirmation";
  const showStepper = step !== "confirmation";
  const visibleSteps = STEPS_ORDER.filter(
    (s) => s !== "confirmation",
  ) as Exclude<BookingStep, "confirmation">[];

  return (
    <>
      <style>{stepperStyles}</style>

      {/* ── Botón volver — fila propia encima del stepper ── */}
      <AnimatePresence>
        {showBack && (
          <motion.button
            key="back"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            onClick={goBack}
            className="bw-back-btn"
            style={{ marginBottom: 12, padding: "4px 0" }}
          >
            <ChevronLeft size={14} />
            Volver
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Stepper — solo números y conectores ── */}
      {showStepper && (
        <div className="bw-stepper">
          <div className="bw-steps">
            {visibleSteps.map((s, idx) => {
              const isActive = s === step;
              const isDone = STEPS_ORDER.indexOf(s) < currentStepIndex;
              const stateClass = isActive
                ? "active"
                : isDone
                  ? "done"
                  : "pending";
              const isLast = idx === visibleSteps.length - 1;

              return (
                <div
                  key={s}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flex: isLast ? 0 : 1,
                    minWidth: 0,
                  }}
                >
                  <div className="bw-step">
                    <motion.div
                      className={`bw-step-circle ${stateClass}`}
                      animate={{ scale: isActive ? 1.08 : 1 }}
                      transition={{ duration: 0.25 }}
                    >
                      {isDone ? (
                        <Check size={12} color="#fff" strokeWidth={3} />
                      ) : (
                        <span
                          style={{
                            color: isActive ? "#fff" : "rgba(245,242,238,0.25)",
                          }}
                        >
                          {idx + 1}
                        </span>
                      )}
                    </motion.div>

                    <span className={`bw-step-label ${stateClass}`}>
                      {STEP_LABELS[s]}
                    </span>
                  </div>

                  {!isLast && (
                    <div
                      className={`bw-connector ${isDone ? "done" : "pending"}`}
                      style={{ flex: 1 }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showStepper && <div className="bw-divider" />}

      {/* ── Contenido del paso activo ── */}
      <div style={{ position: "relative", overflow: "hidden", minHeight: 420 }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {step === "service" && (
              <ServiceSelector
                services={services}
                primaryColor={primaryColor}
                onSelect={handleServiceSelect}
              />
            )}

            {step === "date" && selectedService && (
              <TimeSlotPicker
                salonId={salon.id}
                service={selectedService}
                primaryColor={primaryColor}
                onSelect={handleSlotSelect}
              />
            )}

            {step === "form" && selectedService && (
              <BookingForm
                service={selectedService}
                selectedDateDisplay={selectedDateDisplay}
                selectedTimeDisplay={selectedTimeDisplay}
                primaryColor={primaryColor}
                onSubmit={handleFormSubmit}
                isLoading={isSubmitting}
                apiError={apiError}
              />
            )}

            {step === "confirmation" && selectedService && (
              <BookingConfirmation
                salonName={salon.name}
                salonPhone={salon.phone}
                service={selectedService}
                selectedDateDisplay={selectedDateDisplay}
                selectedTimeDisplay={selectedTimeDisplay}
                clientName={clientName}
                primaryColor={primaryColor}
                onBookAnother={handleBookAnother}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
