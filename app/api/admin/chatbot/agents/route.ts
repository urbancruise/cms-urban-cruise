import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { requirePermission } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";

interface AgentRow extends RowDataPacket {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: number;
  open_conversations: number;
}

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 120 });
    if (!rl.ok) return rl.response!;
    await requirePermission(request, ["chatbot.manage"]);

    const [rows] = await pool.query<AgentRow[]>(
      `SELECT u.id, u.username, u.email, u.full_name, u.is_active,
         COUNT(DISTINCT s.id) AS open_conversations
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id AND r.slug = 'agent' AND r.is_active = 1
       LEFT JOIN chatbot_sessions s
         ON s.assigned_cms_user_id = u.id
         AND s.status = 'active'
         AND s.agent_chat_status IN ('waiting', 'active')
       GROUP BY u.id, u.username, u.email, u.full_name, u.is_active
       ORDER BY u.is_active DESC, u.full_name, u.username`,
    );
    return NextResponse.json({
      agents: rows.map((row) => ({
        id: row.id,
        username: row.username,
        email: row.email,
        displayName: row.full_name || row.username,
        isActive: Boolean(row.is_active),
        openConversations: Number(row.open_conversations),
      })),
    });
  } catch (error) {
    return respondError(error, "admin/chatbot agents");
  }
}
