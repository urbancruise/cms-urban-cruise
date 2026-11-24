import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { requirePermission } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";
import {
  chatbotCategoryInputSchema,
  getChatbotActorName,
} from "@/lib/chatbot-admin";

interface CategoryRow extends RowDataPacket {
  id: number;
  slug: string;
  display_name_en: string;
  display_name_hi: string;
  sort_order: number;
  status: "draft" | "published" | "archived";
  faq_count: number;
}

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 120 });
    if (!rl.ok) return rl.response!;
    await requirePermission(request, ["chatbot.manage"]);
    const [categories] = await pool.query<CategoryRow[]>(
      `SELECT c.id, c.slug, c.display_name_en, c.display_name_hi, c.sort_order, c.status,
         (SELECT COUNT(*) FROM chatbot_faqs f WHERE f.category_id = c.id) AS faq_count
       FROM faq_categories c ORDER BY c.sort_order, c.id`,
    );
    return NextResponse.json({
      categories: categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        displayNameEn: category.display_name_en,
        displayNameHi: category.display_name_hi,
        sortOrder: category.sort_order,
        status: category.status,
        faqCount: Number(category.faq_count),
      })),
    });
  } catch (error) {
    return respondError(error, "admin/chatbot/categories list");
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
    const parsed = chatbotCategoryInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid category." }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO faq_categories (slug, display_name_en, display_name_hi, sort_order, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        parsed.data.slug,
        parsed.data.displayNameEn,
        parsed.data.displayNameHi,
        parsed.data.sortOrder,
        parsed.data.status,
      ],
    );
    await logActivity({
      actor: { userId: actor.userId, userName: getChatbotActorName(actor) },
      action: "create",
      entityType: "chatbot_faq_category",
      entityId: result.insertId,
      entityName: parsed.data.displayNameEn,
      changes: { slug: parsed.data.slug, status: parsed.data.status },
      request,
    });
    return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
  } catch (error) {
    return respondError(error, "admin/chatbot/categories create");
  }
}
