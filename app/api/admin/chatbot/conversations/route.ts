import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { requirePermission } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";

const locationFilter = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const allowedStatuses = ["all", "waiting", "active", "closed"] as const;

interface ConversationRow extends RowDataPacket {
  id: number;
  location_slug: string;
  agent_chat_status: "waiting" | "active" | "closed";
  assigned_agent_name: string | null;
  last_message: string | null;
  last_message_type: "user" | "assistant" | "agent" | null;
  last_activity_at: string;
}

interface CountRow extends RowDataPacket {
  location_slug: string;
  agent_chat_status: string;
  conversation_count: number | string;
}

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 120 });
    if (!rl.ok) return rl.response!;
    const actor = await requirePermission(request, ["chatbot.manage"]);
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location") || "all";
    const status = searchParams.get("status") || "all";
    if (location !== "all" && !locationFilter.test(location)) {
      return NextResponse.json({ error: "Invalid location filter." }, { status: 400 });
    }
    if (!allowedStatuses.includes(status as (typeof allowedStatuses)[number])) {
      return NextResponse.json({ error: "Invalid conversation status." }, { status: 400 });
    }

    const conditions = [
      "s.status = 'active'",
      "s.agent_chat_status IN ('waiting', 'active', 'closed')",
      "s.last_activity_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 90 DAY)",
      "s.assigned_agent_id IS NULL",
      "(s.assigned_cms_user_id IS NULL OR s.assigned_cms_user_id = ?)",
    ];
    const params: Array<string | number> = [actor.userId];
    if (location !== "all") {
      conditions.push("s.location_slug = ?");
      params.push(location);
    }
    if (status !== "all") {
      conditions.push("s.agent_chat_status = ?");
      params.push(status);
    }
    const where = conditions.join(" AND ");
    const [conversations] = await pool.query<ConversationRow[]>(
      `SELECT s.id, s.location_slug, s.agent_chat_status,
         COALESCE(cms_user.full_name, cms_user.username, legacy_agent.display_name) AS assigned_agent_name,
         (SELECT m.body FROM chatbot_messages m WHERE m.session_id = s.id ORDER BY m.id DESC LIMIT 1) AS last_message,
         (SELECT m.message_type FROM chatbot_messages m WHERE m.session_id = s.id ORDER BY m.id DESC LIMIT 1) AS last_message_type,
         s.last_activity_at
       FROM chatbot_sessions s
       LEFT JOIN users cms_user ON cms_user.id = s.assigned_cms_user_id
       LEFT JOIN chatbot_agents legacy_agent ON legacy_agent.id = s.assigned_agent_id
       WHERE ${where}
       ORDER BY FIELD(s.agent_chat_status, 'waiting', 'active', 'closed'), s.last_activity_at ASC
       LIMIT 500`,
      params,
    );
    const countConditions = [
      "s.status = 'active'",
      "s.agent_chat_status IN ('waiting', 'active', 'closed')",
      "s.last_activity_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 90 DAY)",
      "s.assigned_agent_id IS NULL",
      "(s.assigned_cms_user_id IS NULL OR s.assigned_cms_user_id = ?)",
    ];
    const countParams: Array<string | number> = [actor.userId];
    if (status !== "all") {
      countConditions.push("s.agent_chat_status = ?");
      countParams.push(status);
    }
    const [counts] = await pool.query<CountRow[]>(
      `SELECT s.location_slug, s.agent_chat_status, COUNT(*) AS conversation_count
       FROM chatbot_sessions s
       WHERE ${countConditions.join(" AND ")}
       GROUP BY s.location_slug, s.agent_chat_status`,
      countParams,
    );
    const locationCounts = new Map<string, number>();
    const statusCounts: Record<string, number> = { waiting: 0, active: 0, closed: 0 };
    counts.forEach((row) => {
      const count = Number(row.conversation_count);
      locationCounts.set(row.location_slug, (locationCounts.get(row.location_slug) ?? 0) + count);
      statusCounts[row.agent_chat_status] = (statusCounts[row.agent_chat_status] ?? 0) + count;
    });

    return NextResponse.json(
      {
        conversations: conversations.map((row) => ({
          id: row.id,
          locationSlug: row.location_slug,
          status: row.agent_chat_status,
          assignedAgentName: row.assigned_agent_name,
          lastMessage: row.last_message,
          lastMessageType: row.last_message_type,
          lastActivityAt: row.last_activity_at,
        })),
        locationCounts: Array.from(locationCounts, ([locationSlug, count]) => ({ locationSlug, count })),
        statusCounts,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return respondError(error, "admin/chatbot conversations list");
  }
}
