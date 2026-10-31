import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { requireAdmin, requirePermission } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";
import { QuoteSubmissionSchema } from "@/lib/quotes";

const quoteSelect = `SELECT id, full_name, phone_number, email, message,
  pickup_address, DATE_FORMAT(pickup_date, '%Y-%m-%d') AS pickup_date,
  drop_address, DATE_FORMAT(drop_date, '%Y-%m-%d') AS drop_date,
  travel_itinerary, passenger_count, luggage_count, vehicle_category,
  vehicle_name, status, created_at, updated_at
  FROM quote_requests WHERE id = ?`;

interface QuoteRow extends RowDataPacket {
  id: number;
}

interface CityRow extends RowDataPacket {
  name: string;
}

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 120 });
    if (!rl.ok) return rl.response!;
    await requirePermission(request, ["urbancruise.quotes.view"]);

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");
    const limit = limitParam === null ? 50 : Number(limitParam);
    const offset = offsetParam === null ? 0 : Number(offsetParam);
    const status = searchParams.get("status");
    const search = (searchParams.get("search") || "").trim();
    const city = (searchParams.get("city") || "").trim();

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      !Number.isSafeInteger(offset) ||
      offset < 0
    ) {
      return NextResponse.json(
        { error: "limit must be 1-100 and offset must be a non-negative integer" },
        { status: 400 }
      );
    }
    if (status && status !== "draft" && status !== "submitted") {
      return NextResponse.json(
        { error: "status must be draft or submitted" },
        { status: 400 }
      );
    }
    if (search.length > 100) {
      return NextResponse.json(
        { error: "search must be at most 100 characters" },
        { status: 400 }
      );
    }
    if (city.length > 100) {
      return NextResponse.json(
        { error: "city must be at most 100 characters" },
        { status: 400 }
      );
    }

    const conditions: string[] = [];
    const values: Array<string | number> = [];
    if (status) {
      conditions.push("status = ?");
      values.push(status);
    }
    if (search) {
      conditions.push("(full_name LIKE ? OR phone_number LIKE ? OR email LIKE ?)");
      const term = `%${search}%`;
      values.push(term, term, term);
    }
    if (city) {
      const escapedCity = city.replace(/[!%_]/g, "!$&");
      const term = `%${escapedCity}%`;
      conditions.push(
        "(pickup_address LIKE ? ESCAPE '!' OR drop_address LIKE ? ESCAPE '!')"
      );
      values.push(term, term);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await pool.query<QuoteRow[]>(
      `SELECT id, full_name, phone_number, email, message,
         pickup_address, DATE_FORMAT(pickup_date, '%Y-%m-%d') AS pickup_date,
         drop_address, DATE_FORMAT(drop_date, '%Y-%m-%d') AS drop_date,
         travel_itinerary, passenger_count, luggage_count, vehicle_category,
         vehicle_name, status, created_at, updated_at
       FROM quote_requests ${where}
       ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM quote_requests ${where}`,
      values
    );
    const [cityRows] = await pool.query<CityRow[]>(
      "SELECT DISTINCT name FROM cities WHERE is_active = 1 ORDER BY name ASC"
    );

    return NextResponse.json({
      quotes: rows,
      total: Number(countRows[0]?.total || 0),
      cities: cityRows.map((row) => row.name),
      limit,
      offset,
    });
  } catch (error) {
    return respondError(error, "admin/quotes list");
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 30 });
    if (!rl.ok) return rl.response!;
    await requireAdmin(request);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = QuoteSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid quote details" },
        { status: 400 }
      );
    }

    const quote = parsed.data;
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO quote_requests (
         full_name, phone_number, email, message, pickup_address, pickup_date,
         drop_address, drop_date, travel_itinerary, passenger_count,
         luggage_count, vehicle_category, vehicle_name, status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
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
      ]
    );

    const [rows] = await pool.query<QuoteRow[]>(quoteSelect, [result.insertId]);
    return NextResponse.json(
      { success: true, quote: rows[0] },
      { status: 201 }
    );
  } catch (error) {
    return respondError(error, "admin/quotes create");
  }
}
