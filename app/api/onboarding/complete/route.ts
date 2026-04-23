// app/api/onboarding/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteSupabaseClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/resend";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

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
      .select("id, owner_id, name, primary_color")
      .eq("id", salonId)
      .eq("owner_id", user.id)
      .single();

    if (salonError || !salon) {
      return NextResponse.json(
        { error: "Salón no encontrado o sin permisos" },
        { status: 403 },
      );
    }

    // ── 4. Leer la suscripción que el trigger ya creó ────────────────────
    // El trigger on_salon_created crea la suscripción automáticamente
    // al insertar el salón. Solo la leemos para obtener trial_ends_at.
    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("id, status, trial_ends_at")
      .eq("salon_id", salonId)
      .single();

    if (!subscription) {
      // El trigger falló — situación anómala, loggear pero no bloquear
      console.error(
        `[Onboarding] Trigger no creó suscripción para salón ${salonId}`,
      );
      return NextResponse.json({ ok: true, triggerMissed: true });
    }

    console.log(
      `[Onboarding] Suscripción confirmada — salón: ${salonId}, status: ${subscription.status}`,
    );

    // ── 5. Enviar email de bienvenida ────────────────────────────────────
    try {
      await sendWelcomeEmail({
        ownerEmail: user.email!,
        ownerName: user.user_metadata?.full_name ?? "Dueña",
        salonName: salon.name,
        trialEndsAt: subscription.trial_ends_at,
        primaryColor: salon.primary_color ?? "#D4375F",
      });
      console.log(`[Onboarding] Email de bienvenida enviado a ${user.email}`);
    } catch (err) {
      console.error("[Onboarding] Error enviando email de bienvenida:", err);
    }

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
