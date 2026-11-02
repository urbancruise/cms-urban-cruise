import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { requirePermission } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";

interface QuickCallRow extends RowDataPacket {
  id: number;
  name: string;
  phone_number: string;
  city: string | null;
  created_at: string;
}

interface CityRow extends RowDataPacket {
  name: string;
}

const unassignedCityFilter = "__unassigned__";

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 120 });
    if (!rl.ok) return rl.response!;
    await requirePermission(request, ["urbancruise.quickcalls.view"]);

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");
    const limit = limitParam === null ? 50 : Number(limitParam);
    const offset = offsetParam === null ? 0 : Number(offsetParam);
    const search = (searchParams.get("search") || "").trim();
    const city = (searchParams.get("city") || "").trim();
    const dateFrom = (searchParams.get("date_from") || "").trim();
    const dateTo = (searchParams.get("date_to") || "").trim();

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
    if (search.length > 120) {
      return NextResponse.json(
        { error: "search must be at most 120 characters" },
        { status: 400 }
      );
    }
    if (city.length > 100) {
      return NextResponse.json(
        { error: "city must be at most 100 characters" },
        { status: 400 }
      );
    }
    if ((dateFrom && !isValidDate(dateFrom)) || (dateTo && !isValidDate(dateTo))) {
      return NextResponse.json(
        { error: "date_from and date_to must be valid dates in YYYY-MM-DD format" },
        { status: 400 }
      );
    }
    if (dateFrom && dateTo && dateFrom > dateTo) {
      return NextResponse.json(
        { error: "date_from must be on or before date_to" },
        { status: 400 }
      );
    }

    const conditions: string[] = [];
    const values: Array<string | number> = [];
    if (search) {
      conditions.push("(name LIKE ? OR phone_number LIKE ?)");
      const term = `%${search}%`;
      values.push(term, term);
    }
    if (city === unassignedCityFilter) {
      conditions.push("(city IS NULL OR TRIM(city) = '')");
    } else if (city) {
      conditions.push("city = ?");
      values.push(city);
    }
    if (dateFrom) {
      conditions.push("created_at >= ?");
      values.push(dateFrom);
    }
    if (dateTo) {
      conditions.push("created_at < DATE_ADD(?, INTERVAL 1 DAY)");
      values.push(dateTo);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [requests] = await pool.query<QuickCallRow[]>(
      `SELECT id, name, phone_number, city, created_at
       FROM quick_call_requests ${where}
       ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM quick_call_requests ${where}`,
      values
    );
    const [cityRows] = await pool.query<CityRow[]>(
      "SELECT DISTINCT name FROM cities WHERE is_active = 1 ORDER BY name ASC"
    );

    return NextResponse.json({
      requests,
      total: Number(countRows[0]?.total || 0),
      cities: cityRows.map((row) => row.name),
      limit,
      offset,
    });
  } catch (error) {
    return respondError(error, "admin/quick-calls list");
  }
}
