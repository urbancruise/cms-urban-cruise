import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { RATE_LIMIT_AUTH_MAX } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, {
      windowMs: 60_000,
      max: RATE_LIMIT_AUTH_MAX,
    });
    if (!rl.ok) return rl.response;

    const body = await request.json();
    const { identifier } = body;

    if (!identifier) {
      return NextResponse.json(
        { error: "Email or username is required" },
        { status: 400 }
      );
    }

    const isEmail = identifier.includes("@");
    const queryField = isEmail ? "email" : "username";

    const [rows] = await pool.query(
      `SELECT id, email, username, full_name, role
       FROM users
       WHERE ${queryField} = ? AND role = 'admin'`,
      [identifier]
    );

    const users = rows as any[];

    if (users.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message:
            "If an admin account exists with this email or username, a reset link has been sent",
        },
        { status: 200 }
      );
    }

    const user = users[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600_000);

    await pool.query(
      `UPDATE users
       SET reset_token = ?, reset_token_expiry = ?
       WHERE id = ?`,
      [resetToken, resetTokenExpiry, user.id]
    );

    console.log(`🔐 Reset token for ${user.email}: ${resetToken}`);

    const payload: Record<string, unknown> = {
      success: true,
      message: "If an admin account exists, a reset link has been sent",
    };

    // Only expose dev link outside production
    if (!env.IS_PROD) {
      payload.devToken = resetToken;
      payload.devLink = `http://localhost:5000/reset-password?token=${resetToken}`;
    }

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
