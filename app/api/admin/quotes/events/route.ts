import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { requirePermission } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";

interface QuoteEventRow extends RowDataPacket {
  id: number;
  event_type: "verified" | "submitted";
  full_name: string;
  phone_number: string;
}

interface LatestEventRow extends RowDataPacket {
  latest_id: number | null;
}

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 120 });
    if (!rl.ok) return rl.response!;
    await requirePermission(request, ["urbancruise.quotes.view"]);

    const afterParam = new URL(request.url).searchParams.get("after_id");
    const afterId = afterParam === null ? null : Number(afterParam);
    if (
      afterId !== null &&
      (!Number.isSafeInteger(afterId) || afterId < 0)
    ) {
      return NextResponse.json(
        { error: "after_id must be a non-negative integer" },
        { status: 400 }
      );
    }

    const [latestRows] = await pool.query<LatestEventRow[]>(
      "SELECT MAX(id) AS latest_id FROM quote_request_events"
    );
    const latestEventId = Number(latestRows[0]?.latest_id || 0);
    const [events] =
      afterId === null
        ? [[] as QuoteEventRow[]]
        : await pool.query<QuoteEventRow[]>(
            `SELECT id, event_type, full_name, phone_number
             FROM quote_request_events
             WHERE id > ?
             ORDER BY id ASC
             LIMIT 100`,
            [afterId]
          );

    const nextEventId =
      events.length > 0 ? events[events.length - 1].id : latestEventId;
    return NextResponse.json({ events, latestEventId: nextEventId });
  } catch (error) {
    return respondError(error, "admin/quotes events");
  }
}
