// app/api/onboarding/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabaseClient } from "@/lib/supabase/server";
import { createTrialSubscription } from "@/lib/subscription";

export async function POST(request: NextRequest) {
  try {
    // ── 1. Verificar autenticación ───────────────────────────────────
    const supabase = await createRouteSupabaseClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // ── 2. Leer y validar body ───────────────────────────────────────
    const body = await request.json();
    const { salonId } = body;

    if (!salonId || typeof salonId !== "string") {
      return NextResponse.json(
        { error: "salonId es requerido" },
        { status: 400 },
      );
    }

    // ── 3. Verificar que el salón pertenece al usuario autenticado ───
    // Seguridad crítica: evita que un usuario cree trial para el salón de otro
    const { data: salon, error: salonError } = await supabase
      .from("salons")
      .select("id, owner_id")
      .eq("id", salonId)
      .eq("owner_id", user.id)
      .single();

    if (salonError || !salon) {
      return NextResponse.json(
        { error: "Salón no encontrado o sin permisos" },
        { status: 403 },
      );
    }

    // ── 4. Verificar que no tenga ya una suscripción ─────────────────
    // Idempotencia: si ya existe, no creamos duplicado, simplemente OK
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id, status")
      .eq("salon_id", salonId)
      .single();

    if (existing) {
      console.log(
        `[Onboarding] Suscripción ya existe para salón ${salonId} — status: ${existing.status}`,
      );
      return NextResponse.json({ ok: true, alreadyExists: true });
    }

    // ── 5. Crear trial ───────────────────────────────────────────────
    // createTrialSubscription usa SERVICE_ROLE_KEY internamente (bypass RLS)
    const subscription = await createTrialSubscription(salonId);

    if (!subscription) {
      console.error(`[Onboarding] Error creando trial para salón ${salonId}`);
      return NextResponse.json(
        { error: "No se pudo crear la suscripción de prueba" },
        { status: 500 },
      );
    }

    console.log(
      `[Onboarding] Trial creado — salón: ${salonId}, vence: ${subscription.trial_ends_at}`,
    );

    return NextResponse.json({
      ok: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        trial_ends_at: subscription.trial_ends_at,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[Onboarding] Error inesperado:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Bloquear otros métodos
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
