import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";
import { createChatbotRealtimeTicket } from "@/lib/chatbot-realtime";

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 60 });
    if (!rl.ok) return rl.response!;
    const actor = await requirePermission(request, ["chatbot.manage"]);
    return NextResponse.json(
      { ticket: createChatbotRealtimeTicket(actor.userId) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return respondError(error, "admin/chatbot realtime ticket");
  }
}
