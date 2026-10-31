import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { QuoteContactSchema } from "@/lib/quotes";
import { requireApiKey, withCors } from "@/lib/public-auth";
import { rateLimit } from "@/lib/rate-limit";
import type { ResultSetHeader } from "mysql2/promise";

const corsMethods = "POST, OPTIONS";

export async function OPTIONS() {
  return withCors(
    new NextResponse(null, { status: 204 }),
    corsMethods,
    "x-api-key, authorization, content-type"
  );
}

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 20 });
    if (!rl.ok) {
      return withCors(rl.response!, corsMethods);
    }

    const auth = await requireApiKey(request);
    if (!auth.ok) {
      return withCors(
        NextResponse.json({ error: auth.error }, { status: 401 }),
        corsMethods
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return withCors(
        NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
        corsMethods
      );
    }

    const parsed = QuoteContactSchema.safeParse(body);
    if (!parsed.success) {
      return withCors(
        NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Invalid quote contact" },
          { status: 400 }
        ),
        corsMethods
      );
    }

    const quoteToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(quoteToken).digest("hex");
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO quote_requests (full_name, phone_number, quote_token_hash)
       VALUES (?, ?, ?)`,
      [parsed.data.full_name, parsed.data.phone_number, tokenHash]
    );

    return withCors(
      NextResponse.json(
        {
          success: true,
          quote_id: result.insertId,
          quote_token: quoteToken,
          status: "draft",
          message: "Contact details saved. Submit the trip details to complete the quote.",
        },
        { status: 201 }
      ),
      corsMethods
    );
  } catch (error) {
    console.error("[public/quotes] create error:", error);
    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
      corsMethods
    );
  }
}
