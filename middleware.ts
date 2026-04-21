// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
          // Paso 1: setear en el request (para que el Server Component lo lea)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Paso 2: recrear response con cookies actualizadas
          supabaseResponse = NextResponse.next({ request });
          // Paso 3: setear en la response (para que el browser las reciba)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: No escribir lógica entre createServerClient y getUser()
  // Supabase necesita refrescar el token si está expirado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Rutas protegidas ────────────────────────────────────────────
  const isProtectedRoute = pathname.startsWith("/dashboard");
  
  // ── Rutas de auth (redirigir si ya hay sesión) ──────────────────
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  if (isProtectedRoute && !user) {
    // Sin sesión → al login, preservando la URL de destino
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthRoute && user) {
    // Ya autenticado → al dashboard
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.searchParams.delete("redirectTo");
    return NextResponse.redirect(redirectUrl);
  }

  // Devolver siempre supabaseResponse (NO NextResponse.next())
  // para que las cookies de sesión se propaguen correctamente
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Ejecutar en todas las rutas EXCEPTO:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     * - /book/* (widget público — sin autenticación)
     * - archivos con extensión (png, jpg, svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|book/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};