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
  normalizeChatbotKeyword,
} from "@/lib/chatbot-admin";

interface FaqRow extends RowDataPacket {
  id: number;
  category_id: number;
  category_slug: string;
  category_name_en: string;
  category_name_hi: string;
  category_status: "draft" | "published" | "archived";
  language_code: "en" | "hi";
  question: string;
  answer: string | null;
  status: "draft" | "published" | "archived";
  needs_approval: number;
  published_at: string | null;
  updated_at: string;
}

interface KeywordRow extends RowDataPacket {
  faq_id: number;
  keyword: string;
}

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 120 });
    if (!rl.ok) return rl.response!;
    await requirePermission(request, ["chatbot.manage"]);

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const status = searchParams.get("status") || "";
    if (search.length > 120) {
      return NextResponse.json({ error: "Search must be at most 120 characters." }, { status: 400 });
    }
    if (status && !["draft", "published", "archived"].includes(status)) {
      return NextResponse.json({ error: "Invalid FAQ status." }, { status: 400 });
    }

    const filters: string[] = [];
    const values: string[] = [];
    if (search) {
      filters.push("(f.question LIKE ? OR f.answer LIKE ?)");
      values.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      filters.push("f.status = ?");
      values.push(status);
    }
    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const [rows] = await pool.query<FaqRow[]>(
      `SELECT f.id, f.category_id, c.slug AS category_slug,
         c.display_name_en AS category_name_en, c.display_name_hi AS category_name_hi,
         c.status AS category_status, f.language_code, f.question, f.answer,
         f.status, f.needs_approval, f.published_at, f.updated_at
       FROM chatbot_faqs f
       JOIN faq_categories c ON c.id = f.category_id
       ${where}
       ORDER BY FIELD(f.status, 'draft', 'published', 'archived'), f.updated_at DESC, f.id DESC
       LIMIT 500`,
      values,
    );

    const ids = rows.map((row) => row.id);
    const keywordMap = new Map<number, string[]>();
    if (ids.length > 0) {
      const [keywords] = await pool.query<KeywordRow[]>(
        "SELECT faq_id, keyword FROM faq_keywords WHERE faq_id IN (?) ORDER BY keyword",
        [ids],
      );
      keywords.forEach((row) => {
        const current = keywordMap.get(row.faq_id) ?? [];
        current.push(row.keyword);
        keywordMap.set(row.faq_id, current);
      });
    }

    return NextResponse.json({
      faqs: rows.map((row) => ({
        id: row.id,
        categoryId: row.category_id,
        categorySlug: row.category_slug,
        categoryNameEn: row.category_name_en,
        categoryNameHi: row.category_name_hi,
        categoryStatus: row.category_status,
        languageCode: row.language_code,
        question: row.question,
        answer: row.answer || "",
        status: row.status,
        needsApproval: Boolean(row.needs_approval),
        publishedAt: row.published_at,
        updatedAt: row.updated_at,
        keywords: keywordMap.get(row.id) ?? [],
      })),
    });
  } catch (error) {
    return respondError(error, "admin/chatbot/faqs list");
  }
}

export async function POST(request: NextRequest) {
  const connection = await pool.getConnection();
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
    const parsed = chatbotFaqInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid FAQ." }, { status: 400 });
    }

    const [categories] = await connection.query<RowDataPacket[]>(
      "SELECT id, status FROM faq_categories WHERE id = ? LIMIT 1",
      [parsed.data.categoryId],
    );
    if (!categories[0]) {
      return NextResponse.json({ error: "FAQ category not found." }, { status: 404 });
    }
    if (parsed.data.status === "published" && categories[0].status !== "published") {
      return NextResponse.json({ error: "Publish the category before publishing its FAQs." }, { status: 400 });
    }

    await connection.beginTransaction();
    try {
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO chatbot_faqs
          (category_id, language_code, question, answer, status, needs_approval, published_at)
         VALUES (?, ?, ?, ?, ?, ?, IF(? = 'published', UTC_TIMESTAMP(), NULL))`,
        [
          parsed.data.categoryId,
          parsed.data.languageCode,
          parsed.data.question,
          parsed.data.answer || null,
          parsed.data.status,
          parsed.data.status !== "published",
          parsed.data.status,
        ],
      );
      await replaceKeywords(connection, result.insertId, parsed.data.keywords);
      await connection.commit();
      await logActivity({
        actor: { userId: actor.userId, userName: getChatbotActorName(actor) },
        action: "create",
        entityType: "chatbot_faq",
        entityId: result.insertId,
        entityName: parsed.data.question,
        changes: { status: parsed.data.status, languageCode: parsed.data.languageCode },
        request,
      });
      return NextResponse.json({ success: true, id: result.insertId }, { status: 201 });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    return respondError(error, "admin/chatbot/faqs create");
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
