"use client";

// components/booking/BookingWidget.tsx
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import dynamic from "next/dynamic";

import ServiceSelector from "@/components/booking/ServiceSelector";
import BookingForm from "@/components/booking/BookingForm";
import BookingConfirmation from "@/components/booking/BookingConfirmation";

// TimeSlotPicker usa new Date() en el render — cargarlo solo en cliente
// elimina el hydration mismatch de raíz. El Loader es el mismo spinner
// que usa TimeSlotPicker internamente para consistencia visual.
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

const STEPS_ORDER: BookingStep[] = ["service", "date", "form", "confirmation"];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -40 : 40, opacity: 0 }),
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

  const currentStepIndex = STEPS_ORDER.indexOf(step);
  const showBack = step !== "service" && step !== "confirmation";
  const showProgress = step !== "confirmation";

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* ── Header ── */}
      <div className="mb-6">
        {/* Top row: logo + name + back button */}
        <div className="flex items-center justify-between mb-4">
          {/* Salon identity */}
          <div className="flex items-center gap-2.5">
            {salon.logo_url ? (
              <img
                src={salon.logo_url}
                alt={salon.name}
                className="h-7 w-7 rounded-lg object-contain border border-[#EDE8E3] bg-white p-0.5 shrink-0"
              />
            ) : null}
            <h1
              className="font-['Cormorant_Garamond'] text-xl font-semibold"
              style={{ color: primaryColor }}
            >
              {salon.name}
            </h1>
          </div>

          {/* Back button */}
          {showBack && (
            <motion.button
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={goBack}
              className="flex items-center gap-1 text-xs text-[#9C8E85] hover:text-[#2D2420]
                         transition-colors py-1.5 px-2.5 rounded-lg hover:bg-[#FAF8F5]"
            >
              <ChevronLeft size={14} />
              Volver
            </motion.button>
          )}
        </div>

        {/* Progress steps */}
        {showProgress && (
          <div className="flex items-center gap-1.5">
            {STEPS_ORDER.slice(0, -1).map((s) => {
              const isActive = s === step;
              const isDone = STEPS_ORDER.indexOf(s) < currentStepIndex;
              return (
                <div key={s}>
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: isActive ? "32px" : "20px",
                      backgroundColor:
                        isDone || isActive ? primaryColor : "#EDE8E3",
                      opacity: isActive ? 1 : isDone ? 0.6 : 1,
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Step Content ── */}
      <div className="relative overflow-hidden min-h-[400px]">
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

      {/* ── Footer ── */}
      <div className="mt-8 pt-4 border-t border-[#EDE8E3] text-center">
        <p className="text-xs text-[#C4B8B0]">
          Reservas gestionadas con{" "}
          <span className="font-semibold" style={{ color: primaryColor }}>
            BeautySync
          </span>
        </p>
      </div>
    </div>
  );
}
