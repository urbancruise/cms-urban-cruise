import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { rateLimit } from "@/lib/rate-limit";
import { QuickCallUpdateSchema } from "@/lib/quick-calls";

interface QuickCallRow extends RowDataPacket {
  id: number;
}

function getQuickCallId(id: string): number | null {
  const quickCallId = Number(id);
  return Number.isSafeInteger(quickCallId) && quickCallId > 0 ? quickCallId : null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 30 });
    if (!rl.ok) return rl.response!;
    await requireAdmin(request);

    const quickCallId = getQuickCallId((await params).id);
    if (!quickCallId) {
      return NextResponse.json({ error: "Invalid quick call request ID" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = QuickCallUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid quick call request details" },
        { status: 400 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE quick_call_requests
       SET name = ?, phone_number = ?, city = ?
       WHERE id = ?`,
      [parsed.data.name, parsed.data.phone_number, parsed.data.city || null, quickCallId]
    );
    if (result.affectedRows === 0) {
      const [existing] = await pool.query<QuickCallRow[]>(
        "SELECT id FROM quick_call_requests WHERE id = ?",
        [quickCallId]
      );
      if (!existing[0]) {
        return NextResponse.json({ error: "Quick call request not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true, id: quickCallId });
  } catch (error) {
    return respondError(error, "admin/quick-calls update");
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

    const quickCallId = getQuickCallId((await params).id);
    if (!quickCallId) {
      return NextResponse.json({ error: "Invalid quick call request ID" }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM quick_call_requests WHERE id = ?",
      [quickCallId]
    );
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Quick call request not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, id: quickCallId });
  } catch (error) {
    return respondError(error, "admin/quick-calls delete");
  }
}
