import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { requirePermission } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";
import {
  chatbotSettingsInputSchema,
  getChatbotActorName,
} from "@/lib/chatbot-admin";

interface BusinessHoursRow extends RowDataPacket {
  weekday: number;
  day_start: string | null;
  day_end: string | null;
  is_open: number;
}

function parseSettingString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === "string" ? parsed : value;
  } catch {
    return value;
  }
}

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 120 });
    if (!rl.ok) return rl.response!;
    await requirePermission(request, ["chatbot.manage"]);

    const [[hours], [settings]] = await Promise.all([
      pool.query<BusinessHoursRow[]>(
        "SELECT weekday, day_start, day_end, is_open FROM chatbot_business_hours ORDER BY weekday",
      ),
      pool.query<RowDataPacket[]>(
        "SELECT setting_value FROM chatbot_settings WHERE setting_key = 'service_mode_override' LIMIT 1",
      ),
    ]);
    return NextResponse.json({
      weeklyHours: hours.map((row) => ({
        weekday: Number(row.weekday),
        dayStart: row.day_start?.slice(0, 5) ?? null,
        dayEnd: row.day_end?.slice(0, 5) ?? null,
        isOpen: Boolean(row.is_open),
      })),
      serviceModeOverride: parseSettingString(settings[0]?.setting_value) ?? "auto",
      timezone: "Asia/Kolkata",
    });
  } catch (error) {
    return respondError(error, "admin/chatbot settings read");
  }
}

export async function PUT(request: NextRequest) {
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
    const parsed = chatbotSettingsInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid schedule." }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [existing] = await connection.query<RowDataPacket[]>(
        "SELECT weekday FROM chatbot_business_hours",
      );
      if (existing.length !== 7) throw new Error("Chatbot business-hours rows are incomplete.");
      for (const day of parsed.data.weeklyHours) {
        await connection.query(
          `UPDATE chatbot_business_hours
           SET day_start = ?, day_end = ?, is_open = ?
           WHERE weekday = ?`,
          [day.dayStart, day.dayEnd, day.isOpen, day.weekday],
        );
      }
      await connection.query(
        `INSERT INTO chatbot_settings (setting_key, setting_value)
         VALUES ('service_mode_override', JSON_QUOTE(?))
         ON DUPLICATE KEY UPDATE setting_value = JSON_QUOTE(?)`,
        [parsed.data.serviceModeOverride, parsed.data.serviceModeOverride],
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    await logActivity({
      actor: { userId: actor.userId, userName: getChatbotActorName(actor) },
      action: "update",
      entityType: "chatbot_settings",
      entityId: null,
      entityName: "Business hours",
      changes: {
        weeklyHours: parsed.data.weeklyHours,
        serviceModeOverride: parsed.data.serviceModeOverride,
      },
      request,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return respondError(error, "admin/chatbot settings update");
  }
}
