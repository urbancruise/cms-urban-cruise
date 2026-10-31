import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { requireAdmin, requirePermission } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";
import { QuoteEditableFields, QuoteUpdateSchema } from "@/lib/quotes";

const quoteSelect = `SELECT id, full_name, phone_number, email, message,
  pickup_address, DATE_FORMAT(pickup_date, '%Y-%m-%d') AS pickup_date,
  drop_address, DATE_FORMAT(drop_date, '%Y-%m-%d') AS drop_date,
  travel_itinerary, passenger_count, luggage_count, vehicle_category,
  vehicle_name, status, created_at, updated_at
  FROM quote_requests WHERE id = ?`;

interface QuoteRow extends RowDataPacket {
  id: number;
}

function getQuoteId(id: string): number | null {
  const quoteId = Number(id);
  return Number.isSafeInteger(quoteId) && quoteId > 0 ? quoteId : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 120 });
    if (!rl.ok) return rl.response!;
    await requirePermission(request, ["urbancruise.quotes.view"]);

    const quoteId = getQuoteId((await params).id);
    if (!quoteId) {
      return NextResponse.json({ error: "Invalid quote ID" }, { status: 400 });
    }

    const [rows] = await pool.query<QuoteRow[]>(quoteSelect, [quoteId]);
    if (!rows[0]) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }
    return NextResponse.json({ quote: rows[0] });
  } catch (error) {
    return respondError(error, "admin/quotes read");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 30 });
    if (!rl.ok) return rl.response!;
    await requireAdmin(request);

    const quoteId = getQuoteId((await params).id);
    if (!quoteId) {
      return NextResponse.json({ error: "Invalid quote ID" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = QuoteUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid quote details" },
        { status: 400 }
      );
    }

    const fields: string[] = [];
    const values: Array<string | number | null> = [];
    for (const field of QuoteEditableFields) {
      const value = parsed.data[field];
      if (value !== undefined) {
        fields.push(`${field} = ?`);
        values.push(value === "" ? null : value);
      }
    }
    if (parsed.data.status !== undefined) {
      fields.push("status = ?");
      values.push(parsed.data.status);
    }
    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE quote_requests SET ${fields.join(", ")} WHERE id = ?`,
      [...values, quoteId]
    );
    if (result.affectedRows === 0) {
      const [existing] = await pool.query<QuoteRow[]>(
        "SELECT id FROM quote_requests WHERE id = ?",
        [quoteId]
      );
      if (!existing[0]) {
        return NextResponse.json({ error: "Quote not found" }, { status: 404 });
      }
    }

    const [rows] = await pool.query<QuoteRow[]>(quoteSelect, [quoteId]);
    return NextResponse.json({ success: true, quote: rows[0] });
  } catch (error) {
    return respondError(error, "admin/quotes update");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 30 });
    if (!rl.ok) return rl.response!;
    await requireAdmin(request);

    const quoteId = getQuoteId((await params).id);
    if (!quoteId) {
      return NextResponse.json({ error: "Invalid quote ID" }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM quote_requests WHERE id = ?",
      [quoteId]
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, id: quoteId });
  } catch (error) {
    return respondError(error, "admin/quotes delete");
  }
}
