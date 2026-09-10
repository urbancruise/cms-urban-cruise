import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

async function requireAuth(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) throw { status: 401, message: 'Not authenticated' };

  return jwt.verify(
    token,
    process.env.JWT_SECRET || 'fallback_secret'
  ) as { userId: number; role: string };
}

function getTimeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    // 1) User counts
    const [[usersRow]] = (await pool.query(
      'SELECT COUNT(*) as total, SUM(is_active) as active FROM users'
    )) as any;

    // 2) Role count
    const [[rolesRow]] = (await pool.query(
      'SELECT COUNT(*) as total, SUM(is_active) as active FROM roles'
    )) as any;

    // 3) City count
    const [[citiesRow]] = (await pool.query(
      'SELECT COUNT(*) as total, SUM(is_active) as active FROM cities'
    )) as any;

    // 4) User growth (this month vs last month)
    const [[thisMonth]] = (await pool.query(
      `SELECT COUNT(*) as count FROM users
       WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`
    )) as any;

    const [[lastMonth]] = (await pool.query(
      `SELECT COUNT(*) as count FROM users
       WHERE created_at >= DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-01')
         AND created_at < DATE_FORMAT(NOW(), '%Y-%m-01')`
    )) as any;

    const userGrowth =
      lastMonth.count === 0
        ? thisMonth.count > 0
          ? 100
          : 0
        : Math.round(
            ((thisMonth.count - lastMonth.count) / lastMonth.count) * 100
          );

    // 5) Recent users (last 5 signups)
    const [recentUsers] = (await pool.query(
      `SELECT 'user' as type, id, username as title,
              CONCAT(full_name, ' (@', username, ') registered') as description,
              created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 5`
    )) as any;

    // 6) Recent roles (last 5 created roles)
    const [recentRoles] = (await pool.query(
      `SELECT 'role' as type, id, name as title,
              CONCAT('Role "', name, '" created') as description,
              created_at
       FROM roles
       ORDER BY created_at DESC
       LIMIT 5`
    )) as any;

    // 7) Recent cities (last 5 created cities)
    const [recentCities] = (await pool.query(
      `SELECT 'city' as type, id, name as title,
              CONCAT('City "', name, '" added') as description,
              created_at
       FROM cities
       ORDER BY created_at DESC
       LIMIT 5`
    )) as any;

    const recentActivity = [
      ...recentUsers,
      ...recentRoles,
      ...recentCities,
    ]
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 6)
      .map((row: any) => ({
        ...row,
        time_ago: getTimeAgo(row.created_at),
      }));

    return NextResponse.json({
      stats: {
        totalUsers: Number(usersRow.total) || 0,
        activeUsers: Number(usersRow.active) || 0,
        totalRoles: Number(rolesRow.total) || 0,
        activeRoles: Number(rolesRow.active) || 0,
        totalCities: Number(citiesRow.total) || 0,
        activeCities: Number(citiesRow.active) || 0,
        userGrowth,
      },
      recentActivity,
    });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Dashboard stats error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

