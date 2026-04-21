/**
 * app/api/billing/checkout/route.ts
 * Inicia sesión de pago con Wompi — BeautySync Fase 4
 *
 * POST /api/billing/checkout
 * Body: { planId: "starter" | "pro" }
 * Returns: { checkoutUrl: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabaseClient } from "@/lib/supabase/server";
import {
  PLANS,
  generatePaymentReference,
  generateIntegritySignature,
  buildWompiCheckoutUrl,
  WOMPI_PUBLIC_KEY,
  type PlanId,
} from "@/lib/wompi";

const schema = z.object({
  planId: z.enum(["starter", "pro"]),
});

export async function POST(request: NextRequest) {
  const supabase = createRouteSupabaseClient(request);

  // 1. Verificar sesión
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // 2. Validar body
  let planId: PlanId;
  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    planId = parsed.planId;
  } catch {
    return NextResponse.json({ error: "planId inválido" }, { status: 400 });
  }

  // 3. Obtener salón del usuario
  const { data: salon, error: salonError } = await supabase
    .from("salons")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

  if (salonError || !salon) {
    return NextResponse.json({ error: "Salón no encontrado" }, { status: 404 });
  }

  // 4. Obtener perfil para datos del cliente
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("user_id", user.id)
    .maybeSingle();

  // 5. Obtener suscripción actual
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("salon_id", salon.id)
    .maybeSingle();

  // No permitir checkout si ya está activa
  if (subscription?.status === "active") {
    return NextResponse.json(
      { error: "Ya tienes una suscripción activa" },
      { status: 409 },
    );
  }

  // 6. Generar referencia única
  const reference = generatePaymentReference(salon.id, planId);
  const plan = PLANS[planId];

  // 7. Guardar referencia en DB para poder relacionarla en el webhook
  if (subscription?.id) {
    await supabase
      .from("subscriptions")
      .update({
        external_subscription_id: reference,
        plan: planId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);
  }

  // 8. Generar firma de integridad (si WOMPI_INTEGRITY_SECRET está configurado)
  const integrityHash = generateIntegritySignature(
    reference,
    plan.amountInCents,
    plan.currency,
  );

  // 9. Construir URL de redirect post-pago
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectUrl = `${appUrl}/dashboard/billing?payment_ref=${reference}`;

  // 10. Si no hay WOMPI_PUBLIC_KEY configurado → modo demo
  if (!WOMPI_PUBLIC_KEY) {
    // En dev sin keys, simulamos un pago aprobado retornando URL de demo
    return NextResponse.json({
      checkoutUrl: `${appUrl}/dashboard/billing?demo=1&plan=${planId}&ref=${reference}`,
      demo: true,
      reference,
    });
  }

  // 11. Construir URL de Wompi Checkout
  const checkoutUrl = buildWompiCheckoutUrl({
    reference,
    amountInCents: plan.amountInCents,
    currency: plan.currency,
    redirectUrl,
    customerEmail: user.email,
    customerFullName: profile?.full_name ?? undefined,
    customerPhone: profile?.phone ?? undefined,
  });

  // Agregar integrity hash a la URL
  const finalUrl = `${checkoutUrl}&signature:integrity=${integrityHash}`;

  return NextResponse.json({ checkoutUrl: finalUrl, reference });
}
