import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { requirePermission } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";
import {
  chatbotFaqInputSchema,
  getChatbotActorName,
  getChatbotId,
  normalizeChatbotKeyword,
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
    const faqId = getChatbotId((await params).id);
    if (!faqId) return NextResponse.json({ error: "Invalid FAQ ID." }, { status: 400 });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const parsed = chatbotFaqInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid FAQ." }, { status: 400 });
    }

    const [existingRows] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM chatbot_faqs WHERE id = ? LIMIT 1",
      [faqId],
    );
    if (!existingRows[0]) return NextResponse.json({ error: "FAQ not found." }, { status: 404 });

    const [categories] = await connection.query<RowDataPacket[]>(
      "SELECT id, status FROM faq_categories WHERE id = ? LIMIT 1",
      [parsed.data.categoryId],
    );
    if (!categories[0]) return NextResponse.json({ error: "FAQ category not found." }, { status: 404 });
    if (parsed.data.status === "published" && categories[0].status !== "published") {
      return NextResponse.json({ error: "Publish the category before publishing its FAQs." }, { status: 400 });
    }

    await connection.beginTransaction();
    try {
      const [result] = await connection.query<ResultSetHeader>(
        `UPDATE chatbot_faqs
         SET category_id = ?, language_code = ?, question = ?, answer = ?, status = ?,
             needs_approval = ?, published_at = IF(? = 'published', COALESCE(published_at, UTC_TIMESTAMP()), NULL)
         WHERE id = ?`,
        [
          parsed.data.categoryId,
          parsed.data.languageCode,
          parsed.data.question,
          parsed.data.answer || null,
          parsed.data.status,
          parsed.data.status !== "published",
          parsed.data.status,
          faqId,
        ],
      );
      await replaceKeywords(connection, faqId, parsed.data.keywords);
      await connection.commit();
      await logActivity({
        actor: { userId: actor.userId, userName: getChatbotActorName(actor) },
        action: "update",
        entityType: "chatbot_faq",
        entityId: faqId,
        entityName: parsed.data.question,
        changes: { status: parsed.data.status, languageCode: parsed.data.languageCode },
        request,
      });
      return NextResponse.json({ success: true, id: faqId, changed: result.affectedRows > 0 });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    return respondError(error, "admin/chatbot/faqs update");
  } finally {
    connection.release();
  }
}

async function replaceKeywords(
  connection: import("mysql2/promise").PoolConnection,
  faqId: number,
  keywords: string[],
) {
  const unique = new Map<string, string>();
  keywords.forEach((keyword) => {
    const normalized = normalizeChatbotKeyword(keyword);
    if (normalized) unique.set(normalized, keyword.trim());
  });
  await connection.query("DELETE FROM faq_keywords WHERE faq_id = ?", [faqId]);
  if (unique.size === 0) return;
  const values = Array.from(unique, ([normalized, keyword]) => [faqId, keyword, normalized]);
  await connection.query(
    "INSERT INTO faq_keywords (faq_id, keyword, normalized_keyword) VALUES ?",
    [values],
  );
}
