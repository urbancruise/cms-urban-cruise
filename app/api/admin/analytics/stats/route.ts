import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

async function requireAuth(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) throw { status: 401, message: 'Not authenticated' };
  return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as {
    userId: number;
    role: string;
  };
}

function buildMonthScaffold(
  months: number,
  rows: { month: string; count: number }[]
) {
  const map = new Map(rows.map((r) => [r.month, Number(r.count)]));
  const out: { month: string; label: string; count: number }[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0'
    )}`;
    const label = d.toLocaleString('en-US', { month: 'short' });
    out.push({ month: key, label, count: map.get(key) ?? 0 });
  }
  return out;
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);

    // 1) Monthly user signups (last 12 months)
    const [monthlyUsersRows] = (await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month,
              COUNT(*) as count
       FROM users
       WHERE created_at >= DATE_SUB(DATE_FORMAT(NOW(), '%Y-%m-01'), INTERVAL 11 MONTH)
       GROUP BY month
       ORDER BY month ASC`
    )) as any;

    const monthlyUsers = buildMonthScaffold(12, monthlyUsersRows as any);

    // 2) Monthly role creations (last 12 months)
    const [monthlyRolesRows] = (await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month,
              COUNT(*) as count
       FROM roles
       WHERE created_at >= DATE_SUB(DATE_FORMAT(NOW(), '%Y-%m-01'), INTERVAL 11 MONTH)
       GROUP BY month
       ORDER BY month ASC`
    )) as any;

    const monthlyRoles = buildMonthScaffold(12, monthlyRolesRows as any);

    // 3) Monthly city additions (last 12 months)
    const [monthlyCitiesRows] = (await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month,
              COUNT(*) as count
       FROM cities
       WHERE created_at >= DATE_SUB(DATE_FORMAT(NOW(), '%Y-%m-01'), INTERVAL 11 MONTH)
       GROUP BY month
       ORDER BY month ASC`
    )) as any;

    const monthlyCities = buildMonthScaffold(12, monthlyCitiesRows as any);

    // 4) Users per role distribution
    const [roleDist] = (await pool.query(
      `SELECT r.slug, r.name,
              COUNT(ur.user_id) as count
       FROM roles r
       LEFT JOIN user_roles ur ON ur.role_id = r.id
       WHERE r.is_active = 1
       GROUP BY r.id
       ORDER BY count DESC`
    )) as any;

    // 5) Users per city distribution (top 6)
    const [cityDist] = (await pool.query(
      `SELECT c.name as city, c.state, c.code,
              COUNT(uc.user_id) as count
       FROM cities c
       LEFT JOIN user_cities uc ON uc.city_id = c.id
       WHERE c.is_active = 1
       GROUP BY c.id
       ORDER BY count DESC
       LIMIT 6`
    )) as any;

    // 6) KPIs
    const [[usersKpi]] = (await pool.query(
      'SELECT COUNT(*) as total, SUM(is_active) as active FROM users'
    )) as any;

    const [[rolesKpi]] = (await pool.query(
      'SELECT COUNT(*) as total, SUM(is_active) as active FROM roles'
    )) as any;

    const [[citiesKpi]] = (await pool.query(
      'SELECT COUNT(*) as total, SUM(is_active) as active FROM cities'
    )) as any;

    // Growth rate
    const [[thisMonthUsers]] = (await pool.query(
      `SELECT COUNT(*) as count FROM users
       WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`
    )) as any;

    const [[lastMonthUsers]] = (await pool.query(
      `SELECT COUNT(*) as count FROM users
       WHERE created_at >= DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-01')
         AND created_at < DATE_FORMAT(NOW(), '%Y-%m-01')`
    )) as any;

    const growth =
      lastMonthUsers.count === 0
        ? thisMonthUsers.count > 0
          ? 100
          : 0
        : Math.round(
            ((thisMonthUsers.count - lastMonthUsers.count) /
              lastMonthUsers.count) *
              100
          );

    return NextResponse.json({
      kpis: {
        totalUsers: Number(usersKpi.total) || 0,
        activeUsers: Number(usersKpi.active) || 0,
        totalRoles: Number(rolesKpi.total) || 0,
        activeRoles: Number(rolesKpi.active) || 0,
        totalCities: Number(citiesKpi.total) || 0,
        activeCities: Number(citiesKpi.active) || 0,
        growthRate: growth,
      },
      monthlyUsers,
      monthlyRoles,
      monthlyCities,
      roleDist,
      cityDist,
    });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Analytics error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

