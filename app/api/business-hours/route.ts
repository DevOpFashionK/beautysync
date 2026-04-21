// app/api/business-hours/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET /api/business-hours?salon_id=xxx
// Pública — no requiere autenticación (RLS "Public can read business hours" lo permite)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const salon_id = searchParams.get("salon_id");

    if (!salon_id) {
      return NextResponse.json({ error: "salon_id es requerido" }, { status: 400 });
    }

    // Validar que es un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(salon_id)) {
      return NextResponse.json({ error: "salon_id inválido" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    const { data: hours, error } = await supabase
      .from("business_hours")
      .select("day_of_week, is_open, open_time, close_time")
      .eq("salon_id", salon_id)
      .order("day_of_week", { ascending: true });

    if (error) {
      console.error("[GET /api/business-hours]", error);
      return NextResponse.json({ error: "Error al obtener horarios" }, { status: 500 });
    }

    return NextResponse.json({ hours: hours || [] }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/business-hours]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}