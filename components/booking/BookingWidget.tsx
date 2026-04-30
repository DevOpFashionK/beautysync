"use client";

// components/booking/BookingWidget.tsx
// Stepper rediseñado. Lógica de navegación, handlers y fetch 100% intactos.

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
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.07)",
            borderTopColor: "rgba(255,255,255,0.28)",
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
  date: "Fecha",
  form: "Datos",
};

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
};

// ─── Estilos del stepper ──────────────────────────────────────────────────────
const stepperStyles = `
  .bw-stepper {
    display: flex;
    align-items: center;
    width: 100%;
    margin-bottom: 24px;
    gap: 0;
  }

  .bw-step-item {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
  }

  .bw-step-item:last-child { flex: 0 0 auto; }

  .bw-step {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-shrink: 0;
  }

  .bw-circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 600;
    transition: all 0.3s ease;
    font-family: var(--font-body);
  }

  .bw-circle.done {
    background: var(--brand);
  }

  .bw-circle.active {
    background: var(--brand);
    box-shadow: 0 0 14px var(--brand-glow, rgba(255,45,85,0.35));
  }

  .bw-circle.pending {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
  }

  .bw-label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.04em;
    white-space: nowrap;
    font-family: var(--font-body);
    transition: color 0.2s;
  }

  .bw-label.active  { color: rgba(245,242,238,0.88); }
  .bw-label.pending { color: rgba(245,242,238,0.22); }
  .bw-label.done    { display: none; }

  .bw-connector {
    flex: 1;
    height: 1px;
    min-width: 8px;
    border-radius: 2px;
    transition: background 0.4s ease;
    margin: 0 6px;
  }

  .bw-connector.done    { background: var(--brand); opacity: 0.7; }
  .bw-connector.pending { background: rgba(255,255,255,0.07); }

  .bw-divider {
    height: 1px;
    background: rgba(255,255,255,0.06);
    margin-bottom: 22px;
  }

  .bw-back-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
    color: rgba(245,242,238,0.32);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 0;
    border-radius: 7px;
    flex-shrink: 0;
    transition: color 0.15s;
    font-family: var(--font-body);
    margin-bottom: 14px;
    letter-spacing: 0.03em;
  }

  .bw-back-btn:hover { color: rgba(245,242,238,0.7); }
`;

// ─── Componente principal ─────────────────────────────────────────────────────
export default function BookingWidget({ salon, services }: BookingWidgetProps) {
  const primaryColor = salon.primary_color || "#FF2D55";

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

  // ── Navegación — intacta ─────────────────────────────────────────────────
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

  // ── Handlers — lógica intacta ────────────────────────────────────────────
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

  // ── Derivados ────────────────────────────────────────────────────────────
  const currentStepIndex = STEPS_ORDER.indexOf(step);
  const showBack = step !== "service" && step !== "confirmation";
  const showStepper = step !== "confirmation";
  const visibleSteps = STEPS_ORDER.filter(
    (s) => s !== "confirmation",
  ) as Exclude<BookingStep, "confirmation">[];

  return (
    <>
      <style>{stepperStyles}</style>

      {/* Botón volver */}
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
          >
            <ChevronLeft size={13} strokeWidth={1.75} />
            Volver
          </motion.button>
        )}
      </AnimatePresence>

      {/* Stepper */}
      {showStepper && (
        <div className="bw-stepper">
          {visibleSteps.map((s, idx) => {
            const isActive = s === step;
            const isDone = STEPS_ORDER.indexOf(s) < currentStepIndex;
            const state = isActive ? "active" : isDone ? "done" : "pending";
            const isLast = idx === visibleSteps.length - 1;

            return (
              <div key={s} className="bw-step-item">
                <div className="bw-step">
                  <motion.div
                    className={`bw-circle ${state}`}
                    animate={{ scale: isActive ? 1.1 : 1 }}
                    transition={{ duration: 0.25 }}
                  >
                    {isDone ? (
                      <Check size={11} color="#fff" strokeWidth={2.5} />
                    ) : (
                      <span
                        style={{
                          color: isActive ? "#fff" : "rgba(245,242,238,0.2)",
                        }}
                      >
                        {idx + 1}
                      </span>
                    )}
                  </motion.div>
                  <span className={`bw-label ${state}`}>{STEP_LABELS[s]}</span>
                </div>
                {!isLast && (
                  <div
                    className={`bw-connector ${isDone ? "done" : "pending"}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {showStepper && <div className="bw-divider" />}

      {/* Contenido del paso */}
      <div style={{ position: "relative", overflow: "hidden", minHeight: 420 }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
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
