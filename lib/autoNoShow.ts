/**
 * lib/autoNoShow.ts
 * BeautySync — Fase 4
 *
 * Marca como no_show las citas que ya terminaron y siguen en pending/confirmed.
 * Se llama SOLO desde Server Components (dashboard/page.tsx, appointments/page.tsx).
 *
 * NO crear hooks ni API routes para esto — esa fue la causa de los errores 405.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function markPastAppointmentsAsNoShow(salonId: string): Promise<number> {
  // Service role para escribir en DB desde el servidor sin restricciones de RLS
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("appointments")
    .update({
      status: "no_show",
      updated_at: now,
    })
    .eq("salon_id", salonId)
    .in("status", ["pending", "confirmed"])
    .lt("ends_at", now)
    .select("id");

  if (error) {
    // Log silencioso — no romper la página por esto
    console.error("[autoNoShow]", error.message);
    return 0;
  }

  const count = data?.length ?? 0;
  if (count > 0) {
    console.log(`[autoNoShow] ${count} cita(s) marcada(s) como no_show para salón ${salonId}`);
  }

  return count;
}