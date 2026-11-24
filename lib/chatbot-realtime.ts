import jwt from "jsonwebtoken";

const ticketIssuer = "cms-urban-cruise";
const ticketAudience = "urban-cruise-chatbot-realtime";

export function createChatbotRealtimeTicket(userId: number) {
  const secret = process.env.CHATBOT_REALTIME_SECRET;
  if (!secret) throw new Error("Missing CHATBOT_REALTIME_SECRET.");
  return jwt.sign(
    { scope: "chatbot.manage" },
    secret,
    {
      subject: String(userId),
      issuer: ticketIssuer,
      audience: ticketAudience,
      expiresIn: "90s",
    },
  );
}

let missingPublisherConfigReported = false;

export async function publishChatbotRealtimeEvent(
  sessionId: number,
  kind: "message" | "status",
  messageId?: number,
) {
  const secret = process.env.CHATBOT_REALTIME_SECRET;
  if (!secret) {
    if (!missingPublisherConfigReported) {
      console.error("[chat-realtime] Set CHATBOT_REALTIME_SECRET to publish live events.");
      missingPublisherConfigReported = true;
    }
    return false;
  }

  const baseUrl = process.env.CHATBOT_REALTIME_URL || "http://127.0.0.1:5002";
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/internal/publish`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId, kind, messageId }),
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) {
      console.error(`[chat-realtime] Event publish failed with HTTP ${response.status}.`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[chat-realtime] Realtime service is unavailable.", error);
    return false;
  }
}
