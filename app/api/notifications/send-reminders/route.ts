// app/api/notifications/send-reminders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendPendingReminders } from "@/lib/notifications";

// Protegido con CRON_SECRET en header Authorization
export async function GET(request: NextRequest) {
  // Verificar secret
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("[Cron] CRON_SECRET no está definido");
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendPendingReminders();
    console.log("[Cron] Reminders result:", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Cron] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Bloquear otros métodos
export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
