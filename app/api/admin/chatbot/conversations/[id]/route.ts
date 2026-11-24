import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { requirePermission } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";
import {
  chatbotReplyInputSchema,
  getChatbotId,
  getCurrentChatbotServiceMode,
} from "@/lib/chatbot-admin";

interface SessionRow extends RowDataPacket {
  id: number;
  agent_chat_status: "none" | "waiting" | "active" | "closed";
  assigned_agent_id: number | null;
  assigned_cms_user_id: number | null;
}

interface MessageRow extends RowDataPacket {
  id: number;
  message_type: "user" | "assistant" | "agent";
  body: string;
  created_at: string;
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 120 });
    if (!rl.ok) return rl.response!;
    const actor = await requirePermission(request, ["chatbot.manage"]);
    const sessionId = getChatbotId((await params).id);
    if (!sessionId) return NextResponse.json({ error: "Invalid conversation ID." }, { status: 400 });
    const session = await findAccessibleSession(sessionId, actor.userId);
    if (!session) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

    const [messages] = await pool.query<MessageRow[]>(
      `SELECT id, message_type, body, created_at FROM chatbot_messages
       WHERE session_id = ? AND message_type IN ('user', 'assistant', 'agent')
         AND created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 90 DAY)
       ORDER BY id`,
      [sessionId],
    );
    return NextResponse.json(
      {
        messages: messages.map((message) => ({
          id: String(message.id),
          author: message.message_type,
          text: message.body,
          createdAt: message.created_at,
        })),
        status: session.agent_chat_status,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return respondError(error, "admin/chatbot conversation read");
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const connection = await pool.getConnection();
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 60 });
    if (!rl.ok) return rl.response!;
    const actor = await requirePermission(request, ["chatbot.manage"]);
    if ((await getCurrentChatbotServiceMode()) !== "day") {
      return NextResponse.json({ error: "Agent support is closed outside 09:00–21:00 IST." }, { status: 409 });
    }
    const sessionId = getChatbotId((await params).id);
    if (!sessionId) return NextResponse.json({ error: "Invalid conversation ID." }, { status: 400 });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const parsed = chatbotReplyInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid reply." }, { status: 400 });
    }

    await connection.beginTransaction();
    try {
      const [updated] = await connection.query<ResultSetHeader>(
        `UPDATE chatbot_sessions
         SET assigned_cms_user_id = COALESCE(assigned_cms_user_id, ?),
             agent_chat_status = 'active',
             last_activity_at = UTC_TIMESTAMP()
         WHERE id = ? AND status = 'active'
           AND agent_chat_status IN ('waiting', 'active')
           AND assigned_agent_id IS NULL
           AND (assigned_cms_user_id IS NULL OR assigned_cms_user_id = ?)`,
        [actor.userId, sessionId, actor.userId],
      );
      if (updated.affectedRows !== 1) {
        await connection.rollback();
        return NextResponse.json({ error: "Another agent has taken this conversation." }, { status: 409 });
      }

      const [messageResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO chatbot_messages (session_id, message_type, body)
         VALUES (?, 'agent', ?)`,
        [sessionId, parsed.data.text],
      );
      await connection.query(
        `INSERT INTO chatbot_audit_logs (session_id, event_type, event_data)
         VALUES (?, 'agent_message_sent', ?)`,
        [sessionId, JSON.stringify({ cmsUserId: actor.userId, messageId: messageResult.insertId })],
      );
      await connection.commit();
      return NextResponse.json({
        message: {
          id: String(messageResult.insertId),
          author: "agent",
          text: parsed.data.text,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    return respondError(error, "admin/chatbot conversation reply");
  } finally {
    connection.release();
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const connection = await pool.getConnection();
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 30 });
    if (!rl.ok) return rl.response!;
    const actor = await requirePermission(request, ["chatbot.manage"]);
    const sessionId = getChatbotId((await params).id);
    if (!sessionId) return NextResponse.json({ error: "Invalid conversation ID." }, { status: 400 });
    const session = await findAccessibleSession(sessionId, actor.userId);
    if (!session || !["waiting", "active"].includes(session.agent_chat_status)) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    await connection.beginTransaction();
    try {
      const [result] = await connection.query<ResultSetHeader>(
        `UPDATE chatbot_sessions
         SET agent_chat_status = 'closed'
         WHERE id = ? AND status = 'active'
           AND agent_chat_status IN ('waiting', 'active')
           AND assigned_agent_id IS NULL
           AND (assigned_cms_user_id IS NULL OR assigned_cms_user_id = ?)`,
        [sessionId, actor.userId],
      );
      if (!result.affectedRows) {
        await connection.rollback();
        return NextResponse.json({ error: "Conversation could not be closed." }, { status: 409 });
      }
      await connection.query(
        `INSERT INTO chatbot_audit_logs (session_id, event_type, event_data)
         VALUES (?, 'agent_conversation_closed', ?)`,
        [sessionId, JSON.stringify({ cmsUserId: actor.userId })],
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return respondError(error, "admin/chatbot conversation close");
  } finally {
    connection.release();
  }
}

async function findAccessibleSession(sessionId: number, userId: number) {
  const [rows] = await pool.query<SessionRow[]>(
    `SELECT id, agent_chat_status, assigned_agent_id, assigned_cms_user_id
     FROM chatbot_sessions
     WHERE id = ? AND status = 'active'
       AND agent_chat_status IN ('waiting', 'active', 'closed')
       AND (assigned_cms_user_id IS NULL OR assigned_cms_user_id = ?)
       AND assigned_agent_id IS NULL
     LIMIT 1`,
    [sessionId, userId],
  );
  return rows[0] ?? null;
}
