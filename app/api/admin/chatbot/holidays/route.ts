import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { z } from "zod";
import pool from "@/lib/db";
import { requirePermission } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";
import {
  chatbotHolidayInputSchema,
  getChatbotActorName,
} from "@/lib/chatbot-admin";

interface HolidayRow extends RowDataPacket {
  holiday_date: string;
  label: string;
  mode_override: "day" | "night" | "closed";
  day_start: string | null;
  day_end: string | null;
  is_active: number;
}

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 120 });
    if (!rl.ok) return rl.response!;
    await requirePermission(request, ["chatbot.manage"]);
    const [rows] = await pool.query<HolidayRow[]>(
      `SELECT holiday_date, label, mode_override, day_start, day_end, is_active
       FROM chatbot_holidays ORDER BY holiday_date DESC LIMIT 200`,
    );
    return NextResponse.json({
      holidays: rows.map((row) => ({
        holidayDate: String(row.holiday_date).slice(0, 10),
        label: row.label,
        modeOverride: row.mode_override,
        dayStart: row.day_start?.slice(0, 5) ?? null,
        dayEnd: row.day_end?.slice(0, 5) ?? null,
        isActive: Boolean(row.is_active),
      })),
    });
  } catch (error) {
    return respondError(error, "admin/chatbot holidays list");
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 30 });
    if (!rl.ok) return rl.response!;
    const actor = await requirePermission(request, ["chatbot.manage"]);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const parsed = chatbotHolidayInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid holiday." }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO chatbot_holidays
         (holiday_date, label, mode_override, day_start, day_end, is_active)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE label = VALUES(label), mode_override = VALUES(mode_override),
         day_start = VALUES(day_start), day_end = VALUES(day_end), is_active = VALUES(is_active)`,
      [
        parsed.data.holidayDate,
        parsed.data.label,
        parsed.data.modeOverride,
        parsed.data.dayStart,
        parsed.data.dayEnd,
        parsed.data.isActive,
      ],
    );
    await logActivity({
      actor: { userId: actor.userId, userName: getChatbotActorName(actor) },
      action: "update",
      entityType: "chatbot_holiday",
      entityId: null,
      entityName: parsed.data.label,
      changes: parsed.data,
      request,
    });
    return NextResponse.json({ success: true, changed: result.affectedRows > 0 });
  } catch (error) {
    return respondError(error, "admin/chatbot holiday update");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 30 });
    if (!rl.ok) return rl.response!;
    const actor = await requirePermission(request, ["chatbot.manage"]);
    const holidayDate = z.string().date().safeParse(new URL(request.url).searchParams.get("date"));
    if (!holidayDate.success) {
      return NextResponse.json({ error: "A valid holiday date is required." }, { status: 400 });
    }
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM chatbot_holidays WHERE holiday_date = ?",
      [holidayDate.data],
    );
    if (!result.affectedRows) return NextResponse.json({ error: "Holiday not found." }, { status: 404 });
    await logActivity({
      actor: { userId: actor.userId, userName: getChatbotActorName(actor) },
      action: "delete",
      entityType: "chatbot_holiday",
      entityId: null,
      entityName: holidayDate.data,
      request,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return respondError(error, "admin/chatbot holiday delete");
  }
}
