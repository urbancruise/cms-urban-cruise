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
  getChatbotId,
} from "@/lib/chatbot-admin";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const connection = await pool.getConnection();
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 30 });
    if (!rl.ok) return rl.response!;
    const actor = await requirePermission(request, ["chatbot.manage"]);
    const categoryId = getChatbotId((await params).id);
    if (!categoryId) return NextResponse.json({ error: "Invalid category ID." }, { status: 400 });

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

    const [existing] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM faq_categories WHERE id = ? LIMIT 1",
      [categoryId],
    );
    if (!existing[0]) return NextResponse.json({ error: "Category not found." }, { status: 404 });

    await connection.beginTransaction();
    try {
      const [result] = await connection.query<ResultSetHeader>(
        `UPDATE faq_categories
         SET slug = ?, display_name_en = ?, display_name_hi = ?, sort_order = ?, status = ?
         WHERE id = ?`,
        [
          parsed.data.slug,
          parsed.data.displayNameEn,
          parsed.data.displayNameHi,
          parsed.data.sortOrder,
          parsed.data.status,
          categoryId,
        ],
      );
      if (parsed.data.status !== "published") {
        await connection.query(
          `UPDATE chatbot_faqs
           SET status = ?, needs_approval = TRUE, published_at = NULL
           WHERE category_id = ? AND status = 'published'`,
          [parsed.data.status === "archived" ? "archived" : "draft", categoryId],
        );
      }
      await connection.commit();
      await logActivity({
        actor: { userId: actor.userId, userName: getChatbotActorName(actor) },
        action: "update",
        entityType: "chatbot_faq_category",
        entityId: categoryId,
        entityName: parsed.data.displayNameEn,
        changes: { slug: parsed.data.slug, status: parsed.data.status },
        request,
      });
      return NextResponse.json({ success: true, id: categoryId, changed: result.affectedRows > 0 });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    return respondError(error, "admin/chatbot/categories update");
  } finally {
    connection.release();
  }
}
