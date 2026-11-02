import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { getQuoteCityFromPageUrl } from "@/lib/quotes";
import { QuickCallSubmissionSchema } from "@/lib/quick-calls";
import { requireApiKey, withCors } from "@/lib/public-auth";
import { rateLimit } from "@/lib/rate-limit";

const corsMethods = "POST, OPTIONS";

interface CityRow extends RowDataPacket {
  name: string;
}

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

    const parsed = QuickCallSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return withCors(
        NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Invalid quick call details" },
          { status: 400 }
        ),
        corsMethods
      );
    }

    const pageUrl = parsed.data.page_url || request.headers.get("referer") || "";
    let city = parsed.data.city || null;
    if (pageUrl) {
      const [cityRows] = await pool.query<CityRow[]>(
        "SELECT name FROM cities WHERE is_active = 1"
      );
      city =
        getQuoteCityFromPageUrl(
          pageUrl,
          cityRows.map((row) => row.name)
        ) || city;
    }

    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO quick_call_requests (name, phone_number, city) VALUES (?, ?, ?)",
      [parsed.data.name, parsed.data.phone_number, city]
    );

    return withCors(
      NextResponse.json(
        { success: true, quick_call_id: result.insertId },
        { status: 201 }
      ),
      corsMethods
    );
  } catch (error) {
    console.error("[public/quick-calls] create error:", error);
    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
      corsMethods
    );
  }
}
