import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { QuoteSubmissionSchema } from "@/lib/quotes";
import { requireApiKey, withCors } from "@/lib/public-auth";
import { rateLimit } from "@/lib/rate-limit";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

const corsMethods = "PUT, OPTIONS";
const quoteSelect = `SELECT id, full_name, phone_number, email, message,
  pickup_address, DATE_FORMAT(pickup_date, '%Y-%m-%d') AS pickup_date,
  drop_address, DATE_FORMAT(drop_date, '%Y-%m-%d') AS drop_date,
  travel_itinerary, passenger_count, luggage_count, vehicle_category,
  vehicle_name, status, created_at, updated_at
  FROM quote_requests WHERE id = ?`;

interface QuoteRow extends RowDataPacket {
  id: number;
}

export async function OPTIONS() {
  return withCors(
    new NextResponse(null, { status: 204 }),
    corsMethods,
    "x-api-key, authorization, content-type, x-quote-token"
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const quoteId = Number(id);
    if (!Number.isSafeInteger(quoteId) || quoteId <= 0) {
      return withCors(
        NextResponse.json({ error: "Invalid quote ID" }, { status: 400 }),
        corsMethods
      );
    }

    const quoteToken = request.headers.get("x-quote-token");
    if (!quoteToken || quoteToken.length > 128) {
      return withCors(
        NextResponse.json({ error: "Invalid quote token" }, { status: 401 }),
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

    const parsed = QuoteSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return withCors(
        NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Invalid quote details" },
          { status: 400 }
        ),
        corsMethods
      );
    }

    const tokenHash = createHash("sha256").update(quoteToken).digest("hex");
    const quote = parsed.data;
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE quote_requests SET
         full_name = ?, phone_number = ?, email = ?, message = ?,
         pickup_address = ?, pickup_date = ?, drop_address = ?, drop_date = ?,
         travel_itinerary = ?, passenger_count = ?, luggage_count = ?,
         vehicle_category = ?, vehicle_name = ?, status = 'submitted'
       WHERE id = ? AND quote_token_hash = ? AND status = 'draft'`,
      [
        quote.full_name,
        quote.phone_number,
        quote.email,
        quote.message || null,
        quote.pickup_address,
        quote.pickup_date,
        quote.drop_address,
        quote.drop_date,
        quote.travel_itinerary,
        quote.passenger_count,
        quote.luggage_count,
        quote.vehicle_category,
        quote.vehicle_name,
        quoteId,
        tokenHash,
      ]
    );

    if (result.affectedRows === 0) {
      return withCors(
        NextResponse.json(
          { error: "Quote not found, already submitted, or token is invalid" },
          { status: 404 }
        ),
        corsMethods
      );
    }

    const [rows] = await pool.query<QuoteRow[]>(quoteSelect, [quoteId]);
    return withCors(
      NextResponse.json({ success: true, quote: rows[0] }),
      corsMethods
    );
  } catch (error) {
    console.error("[public/quotes] submit error:", error);
    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
      corsMethods
    );
  }
}
