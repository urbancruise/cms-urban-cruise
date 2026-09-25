// ============================================================
// Unified error responder for API route handlers
// ============================================================
import { NextResponse } from "next/server";
import { HttpError } from "./http-error";

export function respondError(err: unknown, context: string) {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }

  // Legacy shape: `throw { status, message }` from older code
  if (err && typeof err === "object" && "status" in err && "message" in err) {
    const e = err as { status: number; message: string };
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  console.error(`[${context}]`, err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
