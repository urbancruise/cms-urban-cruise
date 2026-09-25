import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import pool from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { JWT_COOKIE_NAME, RATE_LIMIT_AUTH_MAX } from "@/lib/constants";

const validateIdentifier = (identifier: string) => {
  if (!identifier || identifier.trim().length === 0) {
    return { valid: false, error: "Email or username is required" };
  }
  if (identifier.length < 2) {
    return {
      valid: false,
      error: "Email or username must be at least 2 characters",
    };
  }
  return { valid: true };
};

const validatePassword = (password: string) => {
  if (!password || password.length === 0) {
    return { valid: false, error: "Password is required" };
  }
  if (password.length < 6) {
    return { valid: false, error: "Password must be at least 6 characters" };
  }
  return { valid: true };
};

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, {
      windowMs: 60_000,
      max: RATE_LIMIT_AUTH_MAX,
    });
    if (!rl.ok) return rl.response;

    const body = await request.json();
    const { identifier, password } = body;

    const identifierValidation = validateIdentifier(identifier);
    if (!identifierValidation.valid) {
      return NextResponse.json({ error: identifierValidation.error }, { status: 400 });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
    }

    const isEmail = identifier.includes("@");
    const queryField = isEmail ? "email" : "username";

    const [rows] = await pool.query(
      `SELECT id, username, email, password_hash, full_name, role, role_id, is_active
       FROM users WHERE ${queryField} = ?`,
      [identifier]
    );

    const users = rows as any[];
    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = users[0];

    if (!user.is_active) {
      return NextResponse.json(
        { error: "Account is deactivated. Please contact support." },
        { status: 403 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const [roleRows] = await pool.query(
      `SELECT r.id, r.name, r.slug
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = ? AND r.is_active = 1`,
      [user.id]
    );
    const userRoles = roleRows as any[];

    let roleSlugs: string[] = userRoles.map((r) => r.slug);
    if (roleSlugs.length === 0 && user.role) roleSlugs = [user.role];

    const primaryRole = roleSlugs.includes("admin") ? "admin" : roleSlugs[0] || "user";

    await pool.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        role: primaryRole,
        roles: roleSlugs,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
    );

    const cookie = serialize(JWT_COOKIE_NAME, token, {
      httpOnly: true,
      secure: env.IS_PROD || env.COOKIE_SECURE,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: {
          ...userWithoutPassword,
          role: primaryRole,
          roles: roleSlugs,
        },
      },
      {
        status: 200,
        headers: { "Set-Cookie": cookie },
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
