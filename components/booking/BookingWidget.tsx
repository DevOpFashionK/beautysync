"use client";

// components/booking/BookingWidget.tsx
// Fase 8.1 — Stepper numerado, layout mejorado, footer removido (vive en page.tsx)

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import dynamic from "next/dynamic";

import ServiceSelector from "@/components/booking/ServiceSelector";
import BookingForm from "@/components/booking/BookingForm";
import BookingConfirmation from "@/components/booking/BookingConfirmation";

// TimeSlotPicker usa new Date() en el render — cargarlo solo en cliente
// elimina el hydration mismatch de raíz.
const TimeSlotPicker = dynamic(
  () => import("@/components/booking/TimeSlotPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 rounded-full border-2 border-[#EDE8E3] border-t-[#C4B8B0] animate-spin" />
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

// Pasos del flujo — "confirmation" se excluye del stepper visual
const STEPS_ORDER: BookingStep[] = ["service", "date", "form", "confirmation"];

const STEP_LABELS: Record<Exclude<BookingStep, "confirmation">, string> = {
  service: "Servicio",
  date: "Fecha y hora",
  form: "Tus datos",
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
};

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

  // ── Handlers de cada paso ───────────────────────────────────────────────────
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

  // Pasos visibles en el stepper (excluye confirmation)
  const visibleSteps = STEPS_ORDER.filter(
    (s) => s !== "confirmation",
  ) as Exclude<BookingStep, "confirmation">[];

  return (
    <div>
      {/* ── Stepper numerado ── */}
      {showStepper && (
        <div className="mb-7">
          {/* Fila: stepper + botón volver */}
          <div className="flex items-center justify-between gap-3">
            {/* Steps */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {visibleSteps.map((s, idx) => {
                const stepNumber = idx + 1;
                const isActive = s === step;
                const isDone = STEPS_ORDER.indexOf(s) < currentStepIndex;

                return (
                  <div key={s} className="flex items-center gap-2 min-w-0">
                    {/* Número + label */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Círculo numerado */}
                      <motion.div
                        animate={{
                          backgroundColor:
                            isDone || isActive ? primaryColor : "#EDE8E3",
                          scale: isActive ? 1.1 : 1,
                        }}
                        transition={{ duration: 0.25 }}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {isDone ? (
                          // Checkmark cuando el paso está completo
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 11 11"
                            fill="none"
                          >
                            <path
                              d="M2 5.5L4.5 8L9 3"
                              stroke="#fff"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              color: isActive ? "#fff" : "#C4B8B0",
                              lineHeight: 1,
                            }}
                          >
                            {stepNumber}
                          </span>
                        )}
                      </motion.div>

                      {/* Label — solo visible en el paso activo en mobile */}
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: isActive ? 600 : 400,
                          color: isActive
                            ? "#2D2420"
                            : isDone
                              ? "#9C8E85"
                              : "#C4B8B0",
                          transition: "color 0.2s",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {STEP_LABELS[s]}
                      </span>
                    </div>

                    {/* Línea conectora — no después del último */}
                    {idx < visibleSteps.length - 1 && (
                      <motion.div
                        animate={{
                          backgroundColor: isDone ? primaryColor : "#EDE8E3",
                        }}
                        transition={{ duration: 0.3 }}
                        style={{
                          flex: 1,
                          height: 2,
                          borderRadius: 2,
                          minWidth: 12,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Botón volver — alineado a la derecha */}
            <AnimatePresence>
              {showBack && (
                <motion.button
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  onClick={goBack}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#9C8E85",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "6px 10px",
                    borderRadius: 8,
                    flexShrink: 0,
                    transition: "background 0.15s, color 0.15s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#FAF8F5";
                    e.currentTarget.style.color = "#2D2420";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "none";
                    e.currentTarget.style.color = "#9C8E85";
                  }}
                >
                  <ChevronLeft size={14} />
                  Volver
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Divider bajo el stepper */}
          <div
            style={{
              height: 1,
              backgroundColor: "#EDE8E3",
              marginTop: 16,
            }}
          />
        </div>
      )}

      {/* ── Contenido del paso activo ── */}
      <div style={{ position: "relative", overflow: "hidden", minHeight: 380 }}>
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
    </div>
  );
}
