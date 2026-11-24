import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { requirePermission } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 120 });
    if (!rl.ok) return rl.response!;
    await requirePermission(request, ["chatbot.manage"]);

    const [[faqRows], [sessionRows], [agentRows], [settingRows]] = await Promise.all([
      pool.query<RowDataPacket[]>(
        `SELECT
           SUM(status = 'published' AND answer IS NOT NULL AND answer <> '') AS published,
           SUM(status = 'draft') AS drafts
         FROM chatbot_faqs`,
      ),
      pool.query<RowDataPacket[]>(
        `SELECT
           SUM(agent_chat_status = 'waiting') AS waiting,
           SUM(agent_chat_status = 'active') AS active
         FROM chatbot_sessions
         WHERE status = 'active'
           AND agent_chat_status IN ('waiting', 'active')
           AND last_activity_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 90 DAY)`,
      ),
      pool.query<RowDataPacket[]>(
        `SELECT COUNT(DISTINCT u.id) AS active_agents
         FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN roles r ON r.id = ur.role_id
         WHERE r.slug = 'agent' AND r.is_active = 1 AND u.is_active = 1`,
      ),
      pool.query<RowDataPacket[]>(
        "SELECT setting_value FROM chatbot_settings WHERE setting_key = 'service_mode_override' LIMIT 1",
      ),
    ]);

    let serviceModeOverride: string | null = null;
    const rawOverride = settingRows[0]?.setting_value;
    if (typeof rawOverride === "string") {
      try {
        const parsed: unknown = JSON.parse(rawOverride);
        serviceModeOverride = typeof parsed === "string" ? parsed : rawOverride;
      } catch {
        serviceModeOverride = rawOverride;
      }
    }

    return NextResponse.json({
      publishedFaqs: Number(faqRows[0]?.published || 0),
      draftFaqs: Number(faqRows[0]?.drafts || 0),
      waitingConversations: Number(sessionRows[0]?.waiting || 0),
      activeConversations: Number(sessionRows[0]?.active || 0),
      activeAgents: Number(agentRows[0]?.active_agents || 0),
      serviceModeOverride,
    });
  } catch (error) {
    return respondError(error, "admin/chatbot overview");
  }
}
