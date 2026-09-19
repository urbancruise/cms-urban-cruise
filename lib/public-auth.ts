import { NextRequest } from "next/server";
import pool from "@/lib/db";

const PUBLIC_HEADER = "x-api-key";

export type ApiKeyResult =
  | { ok: true; name: string }
  | { ok: false; error: string };

export async function requireApiKey(
  request: NextRequest
): Promise<ApiKeyResult> {
  const headerKey = request.headers.get(PUBLIC_HEADER);
  const bearer = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  const key = headerKey || bearer;

  if (!key) {
    return { ok: false, error: "Missing API key" };
  }

  try {
    const [rows] = (await pool.query(
      `SELECT id, name FROM api_keys
       WHERE api_key = ? AND is_active = 1
       LIMIT 1`,
      [key]
    )) as any;

    const record = (rows as any[])[0];
    if (!record) {
      return { ok: false, error: "Invalid API key" };
    }

    // Best-effort last-used timestamp
    pool
      .query(`UPDATE api_keys SET last_used_at = NOW() WHERE id = ?`, [
        record.id,
      ])
      .catch(() => {});

    return { ok: true, name: record.name };
  } catch (err) {
    console.error("[public-auth] DB error:", err);
    return { ok: false, error: "Auth unavailable" };
  }
}

// ============================================================
// CORS wrapper for public API responses
// ============================================================
export function withCors(res: Response): Response {
  res.headers.set(
    "Access-Control-Allow-Origin",
    process.env.WEBSITE_ORIGIN || "*"
  );
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "x-api-key, authorization, content-type"
  );
  return res;
}