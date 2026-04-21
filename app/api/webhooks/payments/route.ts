/**
 * app/api/webhooks/payments/route.ts
 * Webhook de Wompi — BeautySync Fase 4
 *
 * Wompi enviará POST a: https://tu-dominio.com/api/webhooks/payments
 * Configurar en: https://dashboard.wompi.co → Desarrolladores → Eventos
 *
 * Eventos manejados:
 *   - transaction.updated (APPROVED → activa suscripción)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  verifyWompiWebhookSignature,
  parsePaymentReference,
  getWompiTransaction,
  type WompiWebhookEvent,
  type PlanId,
} from "@/lib/wompi";
import type { Database } from "@/types/database.types";

// Usar service role para escribir desde webhook (sin sesión de usuario)
function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: NextRequest) {
  let body: WompiWebhookEvent;

  // 1. Parsear body
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  // 2. Solo procesar transaction.updated
  if (body.event !== "transaction.updated") {
    return NextResponse.json({ received: true, skipped: true });
  }

  // 3. Verificar firma del webhook
  const isValid = verifyWompiWebhookSignature(body);
  if (!isValid) {
    console.error("[Webhook] Firma Wompi inválida");
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const transaction = body.data.transaction;
  console.log(
    `[Webhook] Transaction ${transaction.id} — status: ${transaction.status}`,
  );

  // 4. Solo procesar transacciones APPROVED
  if (transaction.status !== "APPROVED") {
    return NextResponse.json({
      received: true,
      status: transaction.status,
      action: "ignored",
    });
  }

  // 5. Parsear referencia para obtener planId
  const { planId } = parsePaymentReference(transaction.reference);

  // 6. Buscar la suscripción por referencia externa
  const supabase = getServiceClient();

  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("id, salon_id, plan, status")
    .eq("external_subscription_id", transaction.reference)
    .maybeSingle();

  if (subError) {
    console.error("[Webhook] Error buscando suscripción:", subError);
    return NextResponse.json({ error: "Error DB" }, { status: 500 });
  }

  // 7. Si no existe por referencia exacta, buscar por salon_id en referencia
  //    (la referencia tiene salonId truncado, así que buscamos de otra forma)
  let salonId: string | null = subscription?.salon_id ?? null;
  let subscriptionId: string | null = subscription?.id ?? null;

  if (!subscription) {
    // Intentar verificar la transacción completa con la API de Wompi
    const fullTransaction = await getWompiTransaction(transaction.id);
    if (!fullTransaction) {
      console.error(
        "[Webhook] No se pudo verificar la transacción con Wompi API",
      );
      return NextResponse.json(
        { error: "Transacción no verificable" },
        { status: 422 },
      );
    }

    // Buscar por referencia en subscriptions (guardada al iniciar checkout)
    const { data: subByRef } = await supabase
      .from("subscriptions")
      .select("id, salon_id")
      .eq("external_subscription_id", transaction.reference)
      .maybeSingle();

    if (!subByRef) {
      console.error(
        "[Webhook] Suscripción no encontrada para referencia:",
        transaction.reference,
      );
      // Retornar 200 para que Wompi no reintente — logueamos para investigar
      return NextResponse.json({
        received: true,
        warning: "Suscripción no encontrada",
      });
    }

    salonId = subByRef.salon_id;
    subscriptionId = subByRef.id;
  }

  if (!salonId || !subscriptionId) {
    return NextResponse.json(
      { error: "No se pudo identificar el salón" },
      { status: 422 },
    );
  }

  // 8. Calcular período de suscripción (1 mes desde ahora)
  const now = new Date();
  const periodStart = now.toISOString();
  const periodEnd = new Date(now.setMonth(now.getMonth() + 1)).toISOString();

  // 9. Extraer info de método de pago
  const last4 = transaction.payment_method?.extra?.last_four ?? null;

  // 10. Actualizar suscripción en DB
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
      plan: planId ?? subscription?.plan ?? "starter",
      current_period_start: periodStart,
      current_period_end: periodEnd,
      payment_method_last4: last4,
      external_subscription_id: transaction.reference,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId);

  if (updateError) {
    console.error("[Webhook] Error actualizando suscripción:", updateError);
    return NextResponse.json(
      { error: "Error actualizando DB" },
      { status: 500 },
    );
  }

  console.log(
    `[Webhook] ✅ Suscripción ${subscriptionId} activada — plan: ${planId}`,
  );

  return NextResponse.json({
    received: true,
    subscriptionId,
    salonId,
    plan: planId,
    status: "active",
  });
}

// Wompi puede enviar GET para verificar que el endpoint existe
export async function GET() {
  return NextResponse.json({ status: "Webhook endpoint activo — BeautySync" });
}
