"use client";

/**
 * components/dashboard/billing/PaymentMethod.tsx
 * Muestra el método de pago guardado — BeautySync Fase 4
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
  primaryColor = "#D4375F",
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
    <div className="bg-white rounded-2xl border border-[#EDE8E3] p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-[#2D2420] mb-4 flex items-center gap-2">
        <CreditCard className="w-4 h-4" style={{ color: primaryColor }} />
        Método de pago
      </h3>

      {last4 ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Card icon genérico */}
            <div className="w-10 h-7 bg-gradient-to-br from-[#2D2420] to-[#9C8E85] rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">••••</span>
            </div>
            <div>
              <p className="text-sm font-medium text-[#2D2420]">
                •••• •••• •••• {last4}
              </p>
              <p className="text-xs text-[#9C8E85]">Tarjeta guardada</p>
            </div>
          </div>

          <button
            onClick={handleUpdatePayment}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg
              border border-[#EDE8E3] text-[#9C8E85] hover:border-[#C4B8B0] 
              hover:text-[#2D2420] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-7 rounded-md flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <CreditCard className="w-4 h-4" style={{ color: primaryColor }} />
          </div>
          <div>
            <p className="text-sm text-[#9C8E85]">
              No hay método de pago guardado
            </p>
            <p className="text-xs text-[#C4B8B0]">
              Se guardará automáticamente al completar tu primer pago
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
