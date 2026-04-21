"use client";

/**
 * components/dashboard/billing/PricingPlans.tsx
 * Tarjetas de planes — estética Editorial Luxury — BeautySync Fase 4
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap } from "lucide-react";
import { PLANS, type PlanId } from "@/lib/wompi";

interface PricingPlansProps {
  currentPlan?: string | null;
  currentStatus?: string | null;
  /** Color primario del salón para highlight dinámico */
  primaryColor?: string;
}

export function PricingPlans({
  currentPlan,
  currentStatus,
  primaryColor = "#D4375F",
}: PricingPlansProps) {
  const [loading, setLoading] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isActive = currentStatus === "active";

  async function handleSelectPlan(planId: PlanId) {
    setLoading(planId);
    setError(null);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error iniciando pago");
        return;
      }

      // Redirigir a Wompi Checkout (o URL demo)
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <p
          className="text-sm font-medium tracking-widest uppercase"
          style={{ color: primaryColor }}
        >
          Planes & Precios
        </p>
        <h2 className="font-display text-3xl text-[#2D2420]">
          El salón que trabaja solo
        </h2>
        <p className="text-[#9C8E85] text-sm max-w-md mx-auto">
          Sin contratos. Cancela cuando quieras. Precios en pesos colombianos.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {(Object.values(PLANS) as (typeof PLANS)[PlanId][]).map((plan, i) => {
          const isCurrentPlan = currentPlan === plan.id && isActive;
          const isPro = plan.id === "pro";

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="relative"
            >
              {plan.popular && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-10
                    px-3 py-0.5 rounded-full text-white text-xs font-semibold
                    flex items-center gap-1"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Sparkles className="w-3 h-3" />
                  Más popular
                </div>
              )}

              <div
                className={`relative bg-white rounded-2xl p-6 border transition-all duration-200
                  ${
                    plan.popular
                      ? "border-2 shadow-lg"
                      : "border border-[#EDE8E3] shadow-sm hover:shadow-md"
                  }
                  ${isCurrentPlan ? "ring-2" : ""}
                `}
                style={{
                  borderColor: plan.popular ? primaryColor : undefined,
                  ringColor: isCurrentPlan ? primaryColor : undefined,
                }}
              >
                {/* Plan header */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    {isPro ? (
                      <Zap
                        className="w-4 h-4"
                        style={{ color: primaryColor }}
                      />
                    ) : (
                      <Check className="w-4 h-4 text-[#9C8E85]" />
                    )}
                    <span className="text-sm font-semibold text-[#2D2420] uppercase tracking-wide">
                      {plan.name}
                    </span>
                  </div>

                  <div className="flex items-end gap-1">
                    <span className="font-display text-4xl text-[#2D2420]">
                      ${plan.priceCOP.toLocaleString("es-CO")}
                    </span>
                    <span className="text-[#9C8E85] text-sm mb-1">
                      /mes COP
                    </span>
                  </div>
                  <p className="text-xs text-[#C4B8B0] mt-0.5">
                    ≈ USD ${plan.price}/mes
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check
                        className="w-4 h-4 mt-0.5 shrink-0"
                        style={{ color: primaryColor }}
                      />
                      <span className="text-sm text-[#2D2420]">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrentPlan ? (
                  <div
                    className="w-full py-2.5 rounded-xl text-sm font-medium text-center"
                    style={{
                      backgroundColor: `${primaryColor}15`,
                      color: primaryColor,
                    }}
                  >
                    ✓ Plan actual
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan.id as PlanId)}
                    disabled={loading !== null}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold
                      transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={
                      plan.popular
                        ? {
                            backgroundColor: primaryColor,
                            color: "#FFFFFF",
                          }
                        : {
                            backgroundColor: "transparent",
                            color: primaryColor,
                            border: `1.5px solid ${primaryColor}`,
                          }
                    }
                  >
                    {loading === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Procesando…
                      </span>
                    ) : (
                      plan.cta
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <p className="text-center text-sm text-red-500 bg-red-50 rounded-xl py-2 px-4 max-w-sm mx-auto">
          {error}
        </p>
      )}

      {/* Footer note */}
      <p className="text-center text-xs text-[#C4B8B0]">
        Pagos procesados de forma segura por{" "}
        <span className="font-semibold">Wompi</span> · Cancela en cualquier
        momento
      </p>
    </div>
  );
}
