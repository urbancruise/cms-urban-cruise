// ============================================================
// Centralized auth + permission guards
// Replaces ~15 duplicate copies of requireAdmin / requireAuth
// ============================================================
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";
import { HttpError } from "@/lib/http-error";
import { env } from "@/lib/env";
import { JWT_COOKIE_NAME } from "@/lib/constants";

export interface AuthPayload {
  userId: number;
  email?: string;
  username?: string;
  role: string;
  roles?: string[];
}

function getSecret(): string {
  if (!env.JWT_SECRET) throw new HttpError(500, "Server misconfiguration");
  return env.JWT_SECRET;
}

export async function requireAuth(request: NextRequest): Promise<AuthPayload> {
  const token = request.cookies.get(JWT_COOKIE_NAME)?.value;
  if (!token) throw HttpError.unauthorized("Not authenticated");

  try {
    return jwt.verify(token, getSecret()) as AuthPayload;
  } catch {
    throw HttpError.unauthorized("Invalid or expired token");
  }
}

export function isAdmin(decoded: AuthPayload): boolean {
  return (
    decoded.role === "admin" ||
    (Array.isArray(decoded.roles) && decoded.roles.includes("admin"))
  );
}

export async function requireAdmin(request: NextRequest): Promise<AuthPayload> {
  const decoded = await requireAuth(request);
  if (!isAdmin(decoded)) throw HttpError.forbidden("Access denied. Admin only.");
  return decoded;
}

async function loadUserPermissions(userId: number): Promise<Set<string>> {
  const [rows] = (await pool.query(
    `SELECT r.permissions
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = ? AND r.is_active = 1`,
    [userId]
  )) as any;

  const set = new Set<string>();
  (rows as any[]).forEach((r) => {
    let perms: string[] = [];
    try {
      perms = Array.isArray(r.permissions)
        ? r.permissions
        : typeof r.permissions === "string"
          ? JSON.parse(r.permissions)
          : [];
    } catch {
      perms = [];
    }
    perms.forEach((p) => set.add(p));
  });
  return set;
}

export async function requirePermission(
  request: NextRequest,
  anyOf: string[]
): Promise<AuthPayload> {
  const decoded = await requireAuth(request);
  if (isAdmin(decoded)) return decoded;

  const perms = await loadUserPermissions(decoded.userId);
  if (!anyOf.some((p) => perms.has(p))) {
    throw HttpError.forbidden("Access denied.");
  }
  return decoded;
}

export async function requirePermissionPrefix(
  request: NextRequest,
  prefix: string
): Promise<AuthPayload> {
  const decoded = await requireAuth(request);
  if (isAdmin(decoded)) return decoded;

  const perms = await loadUserPermissions(decoded.userId);
  if (![...perms].some((p) => p.startsWith(prefix))) {
    throw HttpError.forbidden("Access denied.");
  }
  return decoded;
}

// ─── Convenience guards matching current call sites ───

export const requireSeoAccess = (req: NextRequest) =>
  requirePermissionPrefix(req, "seo.");

export const requireSiteContentAccess = (req: NextRequest) =>
  requirePermission(req, [
    "urbancruisewebsite.view",
    "urbancruise.home.view",
    "urbancruise.vehicles.view",
  ]);

export const requireCityReadAccess = (req: NextRequest) =>
  requirePermission(req, [
    "cities.view",
    "urbancruisewebsite.view",
    "urbancruise.home.view",
    "urbancruise.vehicles.view",
  ]);
