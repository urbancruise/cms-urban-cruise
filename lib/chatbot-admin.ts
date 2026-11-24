import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";

const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);

export const chatbotFaqInputSchema = z.object({
  categoryId: z.number().int().positive(),
  languageCode: z.enum(["en", "hi"]),
  question: z.string().trim().min(1).max(500),
  answer: z.string().trim().max(8000),
  status: z.enum(["draft", "published", "archived"]),
  keywords: z.array(z.string().trim().min(1).max(160)).max(20),
}).refine((faq) => faq.status !== "published" || faq.answer.length > 0, {
  path: ["answer"],
  message: "Add an answer before publishing an FAQ.",
});

export const chatbotCategoryInputSchema = z.object({
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  displayNameEn: z.string().trim().min(1).max(160),
  displayNameHi: z.string().trim().min(1).max(160),
  sortOrder: z.number().int().min(0).max(10000),
  status: z.enum(["draft", "published", "archived"]),
});

const businessDaySchema = z.object({
  weekday: z.number().int().min(0).max(6),
  dayStart: timeSchema.nullable(),
  dayEnd: timeSchema.nullable(),
  isOpen: z.boolean(),
}).refine((day) => {
  if (!day.isOpen) return day.dayStart === null && day.dayEnd === null;
  return day.dayStart !== null && day.dayEnd !== null && day.dayStart < day.dayEnd;
}, {
  message: "Open days need a start time before the end time; closed days need no times.",
});

export const chatbotSettingsInputSchema = z.object({
  weeklyHours: z.array(businessDaySchema).length(7).refine(
    (days) => new Set(days.map((day) => day.weekday)).size === 7,
    "Include each weekday exactly once.",
  ),
  serviceModeOverride: z.enum(["auto", "day", "night"]),
});

export const chatbotHolidayInputSchema = z.object({
  holidayDate: z.string().date(),
  label: z.string().trim().min(1).max(160),
  modeOverride: z.enum(["day", "night", "closed"]),
  dayStart: timeSchema.nullable(),
  dayEnd: timeSchema.nullable(),
  isActive: z.boolean(),
}).refine((holiday) => {
  if ((holiday.dayStart === null) !== (holiday.dayEnd === null)) return false;
  return holiday.dayStart === null || holiday.dayStart < holiday.dayEnd!;
}, {
  message: "Holiday hours must include both times, with the start before the end.",
});

export const chatbotReplyInputSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

export function normalizeChatbotKeyword(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getChatbotId(value: string) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function getChatbotActorName(actor: { username?: string; email?: string; userId: number }) {
  return actor.username || actor.email || `User #${actor.userId}`;
}

export async function getCurrentChatbotServiceMode(now = new Date()): Promise<"day" | "night"> {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const weekdayByName: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const weekday = weekdayByName[values.weekday];
  if (weekday === undefined) throw new Error("Could not resolve current India weekday.");
  const localDate = `${values.year}-${values.month}-${values.day}`;
  const minuteOfDay = Number(values.hour) * 60 + Number(values.minute);

  const [[hours], [holidays], [settings]] = await Promise.all([
    pool.query<RowDataPacket[]>(
      "SELECT day_start, day_end, is_open FROM chatbot_business_hours WHERE weekday = ? LIMIT 1",
      [weekday],
    ),
    pool.query<RowDataPacket[]>(
      `SELECT mode_override, day_start, day_end FROM chatbot_holidays
       WHERE holiday_date = ? AND is_active = TRUE LIMIT 1`,
      [localDate],
    ),
    pool.query<RowDataPacket[]>(
      "SELECT setting_value FROM chatbot_settings WHERE setting_key = 'service_mode_override' LIMIT 1",
    ),
  ]);
  if (!hours[0]) throw new Error(`Missing chatbot hours for weekday ${weekday}.`);

  const override = parseSettingString(settings[0]?.setting_value);
  if (override === null) throw new Error("Missing service mode override setting.");
  if (!["auto", "day", "night"].includes(override)) {
    throw new Error("Invalid service mode override setting.");
  }
  if (override === "day") return "day";
  if (override === "night") return "night";

  const holiday = holidays[0];
  if (holiday) {
    if (holiday.mode_override === "night" || holiday.mode_override === "closed") return "night";
    if (holiday.day_start && holiday.day_end) {
      return insideChatbotHours(minuteOfDay, holiday.day_start, holiday.day_end) ? "day" : "night";
    }
    if (holiday.mode_override === "day") return "day";
  }

  if (!hours[0].is_open || !hours[0].day_start || !hours[0].day_end) return "night";
  return insideChatbotHours(minuteOfDay, hours[0].day_start, hours[0].day_end) ? "day" : "night";
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

function insideChatbotHours(minuteOfDay: number, start: string, end: string) {
  const toMinutes = (time: string) => {
    const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(time);
    if (!match) {
      throw new Error("Invalid chatbot business-hours time.");
    }
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour > 23 || minute > 59) throw new Error("Invalid chatbot business-hours time.");
    return hour * 60 + minute;
  };
  return minuteOfDay >= toMinutes(start) && minuteOfDay < toMinutes(end);
}
