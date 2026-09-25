import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";
import { cachedJson } from "@/lib/api-cache";
import { rateLimit } from "@/lib/rate-limit";

async function requireAuth(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) throw { status: 401, message: "Not authenticated" };
  return jwt.verify(token, process.env.JWT_SECRET || "fallback_secret") as {
    userId: number;
    role: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60000, max: 120 });
    if (!rl.ok) return rl.response!;

    await requireAuth(request);

    // ✅ Run queries in parallel
    const [
      [usersRow],
      [rolesRow],
      [citiesRow],
      [thisMonth],
      [lastMonth],
      [recentUsers],
      [recentRoles],
      [recentCities],
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) as total, SUM(is_active) as active FROM users") as any,
      pool.query("SELECT COUNT(*) as total, SUM(is_active) as active FROM roles") as any,
      pool.query("SELECT COUNT(*) as total, SUM(is_active) as active FROM cities") as any,
      pool.query(
        "SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')"
      ) as any,
      pool.query(
        `SELECT COUNT(*) as count FROM users
         WHERE created_at >= DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-01')
           AND created_at < DATE_FORMAT(NOW(), '%Y-%m-01')`
      ) as any,
      pool.query(
        `SELECT 'user' as type, id, username as title,
                CONCAT(full_name, ' (@', username, ') registered') as description,
                created_at
         FROM users ORDER BY created_at DESC LIMIT 5`
      ) as any,
      pool.query(
        `SELECT 'role' as type, id, name as title,
                CONCAT('Role "', name, '" created') as description,
                created_at
         FROM roles ORDER BY created_at DESC LIMIT 5`
      ) as any,
      pool.query(
        `SELECT 'city' as type, id, name as title,
                CONCAT('City "', name, '" added') as description,
                created_at
         FROM cities ORDER BY created_at DESC LIMIT 5`
      ) as any,
    ]);

    const u = (usersRow as any[])[0];
    const r = (rolesRow as any[])[0];
    const c = (citiesRow as any[])[0];
    const tm = (thisMonth as any[])[0];
    const lm = (lastMonth as any[])[0];

    const userGrowth =
      lm.count === 0
        ? tm.count > 0
          ? 100
          : 0
        : Math.round(((tm.count - lm.count) / lm.count) * 100);

    const timeAgo = (date: any) => {
      const diff = Date.now() - new Date(date).getTime();
      const m = Math.floor(diff / 60000);
      if (m < 1) return "Just now";
      if (m < 60) return `${m}m ago`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}h ago`;
      return `${Math.floor(h / 24)}d ago`;
    };

    const recentActivity = [
      ...(recentUsers as any[]),
      ...(recentRoles as any[]),
      ...(recentCities as any[]),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6)
      .map((row) => ({ ...row, time_ago: timeAgo(row.created_at) }));

    return cachedJson(
      {
        stats: {
          totalUsers: Number(u.total) || 0,
          activeUsers: Number(u.active) || 0,
          totalRoles: Number(r.total) || 0,
          activeRoles: Number(r.active) || 0,
          totalCities: Number(c.total) || 0,
          activeCities: Number(c.active) || 0,
          userGrowth,
        },
        recentActivity,
      },
      { ttl: 30, swr: 120 }
    );
  } catch (err: any) {
    if (err.status) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error("Dashboard stats error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
