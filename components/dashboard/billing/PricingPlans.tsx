"use client";

/**
 * components/dashboard/billing/PricingPlans.tsx
 * Tarjetas de planes — Dark Atelier — BeautySync Fase 4
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";
import { PLANS, type PlanId } from "@/lib/wompi";

interface PricingPlansProps {
  currentPlan?: string | null;
  currentStatus?: string | null;
  primaryColor?: string;
}

export function PricingPlans({
  currentPlan,
  currentStatus,
  primaryColor = "#FF2D55",
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
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "18px",
              height: "1px",
              background: "rgba(255,45,85,0.4)",
            }}
          />
          <p
            style={{
              fontSize: "10px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,45,85,0.5)",
              margin: 0,
            }}
          >
            Planes y Precios
          </p>
          <span
            style={{
              display: "inline-block",
              width: "18px",
              height: "1px",
              background: "rgba(255,45,85,0.4)",
            }}
          />
        </div>
        <h2
          style={{
            fontFamily:
              "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
            fontSize: "2rem",
            fontWeight: 300,
            color: "rgba(245,242,238,0.88)",
            letterSpacing: "-0.025em",
            lineHeight: 1.1,
            margin: "0 0 8px",
          }}
        >
          El salón que trabaja solo
        </h2>
        <p
          style={{
            fontSize: "13px",
            color: "rgba(245,242,238,0.25)",
            margin: 0,
            letterSpacing: "0.02em",
          }}
        >
          Sin contratos. Cancela cuando quieras. Precios en dólares.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto w-full">
        {(Object.values(PLANS) as (typeof PLANS)[PlanId][]).map((plan, i) => {
          const isCurrentPlan = currentPlan === plan.id && isActive;
          const isPro = plan.id === "pro";

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
              style={{ position: "relative" }}
            >
              {/* Badge "Más popular" */}
              {plan.popular && (
                <div
                  style={{
                    position: "absolute",
                    top: "-12px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 10,
                    padding: "3px 12px",
                    borderRadius: "20px",
                    fontSize: "10px",
                    fontWeight: 400,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    background: "rgba(255,45,85,0.12)",
                    border: "1px solid rgba(255,45,85,0.3)",
                    color: "rgba(255,45,85,0.8)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Más popular
                </div>
              )}

              {/* Card */}
              <div
                style={{
                  background: "#0E0C0B",
                  border: `1px solid ${
                    isCurrentPlan
                      ? `${primaryColor}35`
                      : plan.popular
                        ? "rgba(255,45,85,0.22)"
                        : "rgba(255,255,255,0.055)"
                  }`,
                  borderRadius: "12px",
                  padding: "24px 20px",
                  position: "relative",
                  overflow: "hidden",
                  transition: "border-color 0.2s",
                }}
              >
                {/* Radial interior en plan popular */}
                {plan.popular && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: "100px",
                      height: "100px",
                      background:
                        "radial-gradient(circle at top right, rgba(255,45,85,0.06) 0%, transparent 70%)",
                      pointerEvents: "none",
                    }}
                  />
                )}

                {/* Acento esquina — solo en popular */}
                {plan.popular && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: "14px",
                      height: "14px",
                      borderTop: "1px solid rgba(255,45,85,0.35)",
                      borderRight: "1px solid rgba(255,45,85,0.35)",
                      borderTopRightRadius: "12px",
                      pointerEvents: "none",
                    }}
                  />
                )}

                {/* Plan header */}
                <div style={{ marginBottom: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      marginBottom: "10px",
                    }}
                  >
                    {isPro ? (
                      <Zap
                        size={13}
                        strokeWidth={1.75}
                        style={{ color: "rgba(255,45,85,0.6)" }}
                      />
                    ) : (
                      <Check
                        size={13}
                        strokeWidth={1.75}
                        style={{ color: "rgba(245,242,238,0.25)" }}
                      />
                    )}
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 400,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: isPro
                          ? "rgba(255,45,85,0.6)"
                          : "rgba(245,242,238,0.3)",
                      }}
                    >
                      {plan.name}
                    </span>
                  </div>

                  {/* Precio */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "3px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily:
                          "var(--font-cormorant, 'Cormorant Garamond', Georgia, serif)",
                        fontSize: "3rem",
                        fontWeight: 300,
                        color: "rgba(245,242,238,0.88)",
                        lineHeight: 1,
                        letterSpacing: "-0.04em",
                      }}
                    >
                      ${plan.priceUSD}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "rgba(245,242,238,0.22)",
                        paddingBottom: "4px",
                      }}
                    >
                      /mes USD
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div
                  style={{
                    height: "1px",
                    background: "rgba(255,255,255,0.05)",
                    marginBottom: "16px",
                  }}
                />

                {/* Features */}
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "0 0 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "9px",
                  }}
                >
                  {plan.features.map((feature: string) => (
                    <li
                      key={feature}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                      }}
                    >
                      <Check
                        size={12}
                        strokeWidth={2}
                        style={{
                          color: isPro
                            ? "rgba(255,45,85,0.6)"
                            : "rgba(245,242,238,0.22)",
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "12px",
                          color: "rgba(245,242,238,0.5)",
                          lineHeight: 1.4,
                        }}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrentPlan ? (
                  <div
                    style={{
                      width: "100%",
                      padding: "11px",
                      borderRadius: "8px",
                      textAlign: "center",
                      fontSize: "11px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      background: `${primaryColor}10`,
                      border: `1px solid ${primaryColor}25`,
                      color: `${primaryColor}99`,
                    }}
                  >
                    ✓ Plan actual
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan.id as PlanId)}
                    disabled={loading !== null}
                    style={{
                      width: "100%",
                      padding: "11px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontWeight: 400,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      cursor: loading !== null ? "not-allowed" : "pointer",
                      opacity: loading !== null ? 0.5 : 1,
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      fontFamily: "inherit",
                      ...(plan.popular
                        ? {
                            background: "rgba(255,45,85,0.1)",
                            border: "1px solid rgba(255,45,85,0.28)",
                            color: "rgba(255,45,85,0.8)",
                          }
                        : {
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,0.07)",
                            color: "rgba(245,242,238,0.35)",
                          }),
                    }}
                    onMouseEnter={(e) => {
                      if (loading === null) {
                        if (plan.popular) {
                          (e.currentTarget as HTMLElement).style.background =
                            "rgba(255,45,85,0.18)";
                          (e.currentTarget as HTMLElement).style.borderColor =
                            "rgba(255,45,85,0.45)";
                          (e.currentTarget as HTMLElement).style.color =
                            "rgba(255,45,85,0.95)";
                        } else {
                          (e.currentTarget as HTMLElement).style.borderColor =
                            "rgba(255,255,255,0.12)";
                          (e.currentTarget as HTMLElement).style.color =
                            "rgba(245,242,238,0.55)";
                        }
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (plan.popular) {
                        (e.currentTarget as HTMLElement).style.background =
                          "rgba(255,45,85,0.1)";
                        (e.currentTarget as HTMLElement).style.borderColor =
                          "rgba(255,45,85,0.28)";
                        (e.currentTarget as HTMLElement).style.color =
                          "rgba(255,45,85,0.8)";
                      } else {
                        (e.currentTarget as HTMLElement).style.borderColor =
                          "rgba(255,255,255,0.07)";
                        (e.currentTarget as HTMLElement).style.color =
                          "rgba(245,242,238,0.35)";
                      }
                    }}
                  >
                    {loading === plan.id ? (
                      <>
                        <span
                          style={{
                            width: "12px",
                            height: "12px",
                            border: "1.5px solid currentColor",
                            borderTopColor: "transparent",
                            borderRadius: "50%",
                            display: "inline-block",
                            animation: "spin 0.7s linear infinite",
                          }}
                        />
                        Procesando…
                      </>
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
        <div
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "rgba(252,165,165,0.85)",
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.18)",
            borderRadius: "8px",
            padding: "10px 16px",
            maxWidth: "380px",
            margin: "0 auto",
          }}
        >
          {error}
        </div>
      )}

      {/* Footer */}
      <p
        style={{
          textAlign: "center",
          fontSize: "11px",
          color: "rgba(245,242,238,0.15)",
          letterSpacing: "0.03em",
        }}
      >
        Pagos procesados de forma segura por{" "}
        <span style={{ color: "rgba(245,242,238,0.3)" }}>Wompi</span> · Cancela
        en cualquier momento
      </p>
    </div>
  );
}
