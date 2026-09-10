import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    ) as { userId: number };

    const [rows] = await pool.query(
      `SELECT id, username, email, full_name, role, role_id, is_active, created_at, last_login
       FROM users WHERE id = ?`,
      [decoded.userId]
    );

    const users = rows as any[];
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];
    if (!user.is_active) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    // Roles
    const [roleRows] = await pool.query(
      `SELECT r.id, r.name, r.slug
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = ? AND r.is_active = 1`,
      [user.id]
    );
    const roles = roleRows as any[];

    let roleSlugs: string[] = roles.map((r) => r.slug);
    if (roleSlugs.length === 0 && user.role) roleSlugs = [user.role];

    const primaryRole = roleSlugs.includes('admin') ? 'admin' : roleSlugs[0] || 'user';

    // Cities
    const [cityRows] = await pool.query(
      `SELECT c.id, c.name, c.state, c.code
       FROM user_cities uc
       JOIN cities c ON c.id = uc.city_id
       WHERE uc.user_id = ?`,
      [user.id]
    );

    return NextResponse.json(
      {
        user: {
          ...user,
          role: primaryRole,
          roles: roleSlugs,
          role_ids: roles.map((r) => r.id),
          cities: cityRows,
          city_ids: (cityRows as any[]).map((c) => c.id),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}