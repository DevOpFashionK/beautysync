// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";
import type { NextRequest } from "next/server";

// ─── Para Server Components y Server Actions ──────────────────────────────────
// Usa el cookie store de Next.js (solo disponible en el contexto de React Server)
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

// ─── Para API Routes (Route Handlers) ────────────────────────────────────────
// En Route Handlers, cookies() no propaga la sesión del usuario correctamente.
// La solución correcta es leer las cookies directamente del objeto NextRequest.
export function createRouteSupabaseClient(request: NextRequest) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Lee las cookies directamente del request HTTP entrante
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // En Route Handlers no podemos mutar cookies del request,
          // pero Supabase necesita este método definido. Se omite sin error.
        },
      },
    }
  );
}