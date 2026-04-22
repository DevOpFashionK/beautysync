// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSubscriptionStatus } from "@/lib/subscription"; // ← NUEVO

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: No escribir lógica entre createServerClient y getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Rutas protegidas ────────────────────────────────────────────
  const isProtectedRoute = pathname.startsWith("/dashboard");

  // ── Rutas de auth (redirigir si ya hay sesión) ──────────────────
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  // ── NUEVO: Rutas de billing (excluir del check de suscripción) ──
  const isBillingRoute = pathname.startsWith("/dashboard/billing");

  if (isProtectedRoute && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthRoute && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.searchParams.delete("redirectTo");
    return NextResponse.redirect(redirectUrl);
  }

  // ── NUEVO: Verificar suscripción en rutas del dashboard ─────────
  // Solo corre si: hay sesión + es ruta del dashboard + NO es billing
  // (billing se excluye para evitar loop infinito de redirecciones)
  if (isProtectedRoute && user && !isBillingRoute) {
    try {
      // Obtener salon_id desde el perfil del usuario
      const { data: salon } = await supabase
        .from("salons")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      // Si no tiene salón aún (onboarding incompleto), dejar pasar
      // El onboarding mismo maneja este caso
      if (salon?.id) {
        const result = await getSubscriptionStatus(salon.id);

        if (!result.active) {
          // Suscripción inactiva → redirigir a billing con motivo
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = "/dashboard/billing";
          redirectUrl.searchParams.set("reason", result.reason);
          return NextResponse.redirect(redirectUrl);
        }
      }
    } catch (error) {
      // Si falla la verificación, dejamos pasar — no bloqueamos
      // el negocio por un error interno de nuestra parte
      console.error("[middleware] Error verificando suscripción:", error);
    }
  }
  // ── FIN NUEVO ────────────────────────────────────────────────────

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|book/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
