import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) throw { status: 401, message: 'Not authenticated' };

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || 'fallback_secret'
  ) as { userId: number; role: string; roles?: string[] };

  const isAdmin =
    decoded.role === 'admin' ||
    (Array.isArray(decoded.roles) && decoded.roles.includes('admin'));

  if (!isAdmin) throw { status: 403, message: 'Access denied. Admin only.' };
  return decoded;
}

function safeJsonParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);

    const entityType = searchParams.get('entity_type') || '';
    const action = searchParams.get('action') || '';
    const userId = searchParams.get('user_id') || '';
    const search = searchParams.get('search') || '';
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

    const where: string[] = ['1=1'];
    const params: any[] = [];

    if (entityType) {
      where.push('entity_type = ?');
      params.push(entityType);
    }
    if (action) {
      where.push('action = ?');
      params.push(action);
    }
    if (userId) {
      where.push('user_id = ?');
      params.push(Number(userId));
    }
    if (search) {
      where.push('(entity_name LIKE ? OR user_name LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term);
    }

    const whereClause = where.join(' AND ');

    const [rows] = (await pool.query(
      `SELECT id, user_id, user_name, action, entity_type, entity_id,
              entity_name, changes, ip_address, created_at
       FROM activity_log
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )) as any;

    const [countRows] = (await pool.query(
      `SELECT COUNT(*) as total FROM activity_log WHERE ${whereClause}`,
      params
    )) as any;

    const activities = (rows as any[]).map((r) => ({
      ...r,
      changes:
        typeof r.changes === 'string'
          ? safeJsonParse(r.changes)
          : r.changes || null,
    }));

    return NextResponse.json({
      activities,
      total: Number((countRows as any)[0]?.total) || 0,
      limit,
      offset,
    });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Get activity error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

