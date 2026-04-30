"use client";

/**
 * components/dashboard/billing/PaymentMethod.tsx
 * Método de pago guardado — BeautySync Fase 4
 */

import { CreditCard, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { Database } from "@/types/database.types";
import type { PlanId } from "@/lib/wompi";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

interface PaymentMethodProps {
  subscription: Subscription | null;
  primaryColor?: string;
}

export function PaymentMethod({
  subscription,
  primaryColor = "#FF2D55",
}: PaymentMethodProps) {
  const [loading, setLoading] = useState(false);

  const last4 = subscription?.payment_method_last4;
  const currentPlan = subscription?.plan as PlanId | null;

  async function handleUpdatePayment() {
    if (!currentPlan) return;
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: currentPlan }),
      });
      const data = await res.json();
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: "#0E0C0B",
        border: "1px solid rgba(255,255,255,0.055)",
        borderRadius: "10px",
        padding: "18px 20px",
      }}
    >
      {/* Título */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <CreditCard
          size={14}
          strokeWidth={1.75}
          style={{ color: `${primaryColor}99` }}
        />
        <p
          style={{
            fontSize: "12px",
            fontWeight: 400,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(245,242,238,0.3)",
            margin: 0,
          }}
        >
          Método de pago
        </p>
      </div>

      {last4 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          {/* Card info */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "28px",
                borderRadius: "5px",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: "9px",
                  color: "rgba(245,242,238,0.3)",
                  letterSpacing: "0.04em",
                }}
              >
                ••••
              </span>
            </div>
            <div>
              <p
                style={{
                  fontSize: "13px",
                  color: "rgba(245,242,238,0.7)",
                  margin: 0,
                  letterSpacing: "0.04em",
                }}
              >
                •••• •••• •••• {last4}
              </p>
              <p
                style={{
                  fontSize: "10px",
                  color: "rgba(245,242,238,0.2)",
                  margin: "2px 0 0",
                  letterSpacing: "0.04em",
                }}
              >
                Tarjeta guardada
              </p>
            </div>
          </div>

          {/* Actualizar */}
          <button
            onClick={handleUpdatePayment}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "11px",
              letterSpacing: "0.06em",
              padding: "6px 12px",
              borderRadius: "7px",
              border: "1px solid rgba(255,255,255,0.07)",
              background: "transparent",
              color: "rgba(245,242,238,0.28)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
              transition: "all 0.2s",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(255,255,255,0.12)";
                (e.currentTarget as HTMLElement).style.color =
                  "rgba(245,242,238,0.55)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "rgba(255,255,255,0.07)";
              (e.currentTarget as HTMLElement).style.color =
                "rgba(245,242,238,0.28)";
            }}
          >
            <RefreshCw
              size={11}
              strokeWidth={1.75}
              className={loading ? "animate-spin" : ""}
            />
            Actualizar
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "44px",
              height: "28px",
              borderRadius: "5px",
              background: `${primaryColor}10`,
              border: `1px solid ${primaryColor}18`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CreditCard
              size={12}
              strokeWidth={1.75}
              style={{ color: `${primaryColor}88` }}
            />
          </div>
          <div>
            <p
              style={{
                fontSize: "13px",
                color: "rgba(245,242,238,0.35)",
                margin: 0,
              }}
            >
              No hay método de pago guardado
            </p>
            <p
              style={{
                fontSize: "10px",
                color: "rgba(245,242,238,0.18)",
                margin: "2px 0 0",
                letterSpacing: "0.03em",
              }}
            >
              Se guardará automáticamente al completar tu primer pago
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
