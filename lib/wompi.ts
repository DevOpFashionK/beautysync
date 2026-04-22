/**
 * lib/wompi.ts
 * Cliente Wompi — BeautySync Fase 4
 * Documentación: https://docs.wompi.co
 *
 * Variables de entorno necesarias (.env.local):
 *   NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_...
 *   WOMPI_PRIVATE_KEY=prv_...
 *   WOMPI_EVENTS_SECRET=...   ← secreto para verificar webhooks
 *   NEXT_PUBLIC_APP_URL=https://tu-dominio.com
 */

import crypto from "crypto";

// ─── Configuración ───────────────────────────────────────────────────────────

const WOMPI_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://production.wompi.co/v1"
    : "https://sandbox.wompi.co/v1";

export const WOMPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ?? "";

const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY ?? "";
const WOMPI_EVENTS_SECRET = process.env.WOMPI_EVENTS_SECRET ?? "";

// ─── Planes disponibles ───────────────────────────────────────────────────────

export const PLANS = {
  starter: {
    id: "starter",
    name: "Esencial", // ← cambiado
    priceUSD: 19, // ← renombrado de priceCOP, valor nuevo
    amountInCents: 1900, // ← USD: $19.00 = 1900 cents
    currency: "USD", // ← cambiado de COP
    features: [
      "Hasta 60 citas por mes",
      "Widget público de reservas",
      "Emails de confirmación a clientas",
      "Recordatorios automáticos 24h",
      "Dashboard de agenda",
    ],
    cta: "Comenzar con Esencial", // ← cambiado
    popular: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceUSD: 39, // ← renombrado, valor nuevo
    amountInCents: 3900, // ← USD: $39.00 = 3900 cents
    currency: "USD", // ← cambiado de COP
    features: [
      "Citas ilimitadas",
      "Widget público de reservas",
      "Emails de confirmación a clientas",
      "Recordatorios automáticos 24h",
      "Color y logo personalizado",
      "Hasta 5 empleadas",
      "Reportes de ingresos mensuales",
      "Soporte prioritario por email",
    ],
    cta: "Comenzar con Pro",
    popular: true,
  },
} as const;

export type PlanId = keyof typeof PLANS;

// ─── Tipos Wompi ─────────────────────────────────────────────────────────────

export interface WompiTransaction {
  id: string;
  created_at: string;
  finalized_at: string | null;
  amount_in_cents: number;
  reference: string;
  currency: string;
  payment_method_type: string;
  payment_method: {
    type: string;
    extra?: {
      last_four?: string;
      brand?: string;
    };
  };
  redirect_url: string;
  status: "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR";
  status_message: string | null;
  merchant: { name: string };
  customer_email: string;
  customer_data?: {
    full_name?: string;
    phone_number?: string;
  };
}

export interface WompiWebhookEvent {
  event: string;
  data: {
    transaction: WompiTransaction;
  };
  sent_at: string;
  timestamp: number;
  signature: {
    checksum: string;
    properties: string[];
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Genera una referencia única para la transacción
 * Formato: BS-{salonId_8chars}-{timestamp}-{plan}
 */
export function generatePaymentReference(
  salonId: string,
  planId: PlanId,
): string {
  const shortId = salonId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const ts = Date.now().toString(36).toUpperCase();
  return `BS-${shortId}-${ts}-${planId.toUpperCase()}`;
}

/**
 * Parsea la referencia para extraer planId
 */
export function parsePaymentReference(reference: string): {
  planId: PlanId | null;
  raw: string;
} {
  const parts = reference.split("-");
  const planRaw = parts[parts.length - 1]?.toLowerCase();
  const planId = planRaw === "starter" || planRaw === "pro" ? planRaw : null;
  return { planId, raw: reference };
}

/**
 * Verifica la firma del webhook de Wompi
 */
export function verifyWompiWebhookSignature(event: WompiWebhookEvent): boolean {
  if (!WOMPI_EVENTS_SECRET) {
    console.warn(
      "[Wompi] WOMPI_EVENTS_SECRET no configurado — saltando verificación",
    );
    return true;
  }

  try {
    const { properties, checksum } = event.signature;

    const transaction = event.data.transaction;
    const concatValues = properties
      .map((prop) => {
        const parts = prop.split(".");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let val: any = { transaction };
        for (const part of parts) {
          val = val?.[part];
        }
        return String(val ?? "");
      })
      .join("");

    const stringToHash = `${concatValues}${event.timestamp}${WOMPI_EVENTS_SECRET}`;
    const computed = crypto
      .createHash("sha256")
      .update(stringToHash)
      .digest("hex");

    return computed === checksum;
  } catch (err) {
    console.error("[Wompi] Error verificando firma:", err);
    return false;
  }
}

/**
 * Obtiene detalles de una transacción desde la API de Wompi
 */
export async function getWompiTransaction(
  transactionId: string,
): Promise<WompiTransaction | null> {
  if (!WOMPI_PRIVATE_KEY) {
    console.warn("[Wompi] WOMPI_PRIVATE_KEY no configurado");
    return null;
  }

  try {
    const res = await fetch(`${WOMPI_BASE_URL}/transactions/${transactionId}`, {
      headers: {
        Authorization: `Bearer ${WOMPI_PRIVATE_KEY}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.data as WompiTransaction;
  } catch (err) {
    console.error("[Wompi] Error obteniendo transacción:", err);
    return null;
  }
}

/**
 * Genera la URL de Wompi Checkout
 */
export function buildWompiCheckoutUrl(params: {
  reference: string;
  amountInCents: number;
  currency: string;
  redirectUrl: string;
  customerEmail?: string;
  customerFullName?: string;
  customerPhone?: string;
  description?: string;
}): string {
  const checkoutBase = "https://checkout.wompi.co/p/";

  const url = new URL(checkoutBase);
  url.searchParams.set("public-key", WOMPI_PUBLIC_KEY);
  url.searchParams.set("currency", params.currency);
  url.searchParams.set("amount-in-cents", String(params.amountInCents));
  url.searchParams.set("reference", params.reference);
  url.searchParams.set("redirect-url", params.redirectUrl);

  if (params.customerEmail) {
    url.searchParams.set("customer-data:email", params.customerEmail);
  }
  if (params.customerFullName) {
    url.searchParams.set("customer-data:full-name", params.customerFullName);
  }
  if (params.customerPhone) {
    url.searchParams.set("customer-data:phone-number", params.customerPhone);
  }

  return url.toString();
}

/**
 * Genera el hash de integridad para Wompi Checkout
 * reference + amount_in_cents + currency + WOMPI_INTEGRITY_SECRET
 */
export function generateIntegritySignature(
  reference: string,
  amountInCents: number,
  currency: string,
): string {
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET ?? "";
  const str = `${reference}${amountInCents}${currency}${integritySecret}`;
  return crypto.createHash("sha256").update(str).digest("hex");
}

// ─── Status helpers ───────────────────────────────────────────────────────────

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

export function isSubscriptionActive(
  status: SubscriptionStatus | null,
): boolean {
  return status === "active" || status === "trialing";
}

export function getSubscriptionLabel(
  status: SubscriptionStatus | null,
  trialEndsAt: string | null,
): string {
  if (!status) return "Sin suscripción";

  const labels: Record<SubscriptionStatus, string> = {
    trialing: trialEndsAt
      ? `Trial activo hasta ${new Date(trialEndsAt).toLocaleDateString(
          "es-SV", // ← cambiado de es-CO a es-SV
          { day: "numeric", month: "long" },
        )}`
      : "Trial activo",
    active: "Activa",
    past_due: "Pago pendiente",
    canceled: "Cancelada",
    expired: "Expirada",
  };

  return labels[status] ?? "Desconocido";
}
