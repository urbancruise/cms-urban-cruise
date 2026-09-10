import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
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

  if (!isAdmin) {
    throw { status: 403, message: 'Access denied. Admin only.' };
  }
  return decoded;
}

// ============================================
// GET - all users with roles + cities
// ============================================
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.email, u.full_name,
              u.role, u.role_id,
              u.is_active, u.created_at, u.last_login
       FROM users u
       ORDER BY u.created_at DESC`
    );

    const users = rows as any[];

    if (users.length > 0) {
      const userIds = users.map((u) => u.id);

      const [roleRows] = await pool.query(
        `SELECT ur.user_id, r.id, r.name, r.slug
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
         WHERE ur.user_id IN (?)`,
        [userIds]
      );

      const [cityRows] = await pool.query(
        `SELECT uc.user_id, c.id, c.name, c.state, c.code
         FROM user_cities uc
         JOIN cities c ON c.id = uc.city_id
         WHERE uc.user_id IN (?)`,
        [userIds]
      );

      const roleMap: Record<number, any[]> = {};
      (roleRows as any[]).forEach((row) => {
        if (!roleMap[row.user_id]) roleMap[row.user_id] = [];
        roleMap[row.user_id].push({ id: row.id, name: row.name, slug: row.slug });
      });

      const cityMap: Record<number, any[]> = {};
      (cityRows as any[]).forEach((row) => {
        if (!cityMap[row.user_id]) cityMap[row.user_id] = [];
        cityMap[row.user_id].push({
          id: row.id,
          name: row.name,
          state: row.state,
          code: row.code,
        });
      });

      users.forEach((u) => {
        const roles = roleMap[u.id] || [];
        u.roles = roles;
        u.role_ids = roles.map((r) => r.id);
        const primary = roles.find((r) => r.slug === 'admin') || roles[0];
        u.role_name = primary?.name || u.role;
        u.role_slug = primary?.slug || u.role;

        u.cities = cityMap[u.id] || [];
        u.city_ids = (cityMap[u.id] || []).map((c) => c.id);
      });
    }

    return NextResponse.json({ users }, { status: 200 });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Get users error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST - create user (multi-role + multi-city)
// ============================================
export async function POST(request: NextRequest) {
  const connection = await pool.getConnection();
  try {
    await requireAdmin(request);

    const body = await request.json();
    const {
      username,
      email,
      password,
      full_name,
      role_ids,
      is_active,
      city_ids,
    } = body;

    if (!username || !email || !password) {
      connection.release();
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }
    if (username.length < 3) {
      connection.release();
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      connection.release();
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      connection.release();
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }
    if (!Array.isArray(role_ids) || role_ids.length === 0) {
      connection.release();
      return NextResponse.json(
        { error: 'At least one role is required' },
        { status: 400 }
      );
    }

    const [roleRows] = await connection.query(
      `SELECT id, slug FROM roles WHERE id IN (?) AND is_active = 1`,
      [role_ids]
    );
    const validRoles = roleRows as any[];
    if (validRoles.length !== role_ids.length) {
      connection.release();
      return NextResponse.json(
        { error: 'One or more selected roles are invalid or inactive' },
        { status: 400 }
      );
    }

    const [existingUsers] = await connection.query(
      'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    const existing = existingUsers as any[];
    if (existing.length > 0) {
      connection.release();
      const found = existing[0];
      if (found.username === username) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
      }
      if (found.email === email) {
        return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
      }
    }

    const roleSlugs = validRoles.map((r) => r.slug);
    const primarySlug = roleSlugs.includes('admin') ? 'admin' : roleSlugs[0];
    const primaryRoleId =
      validRoles.find((r) => r.slug === primarySlug)?.id ?? validRoles[0].id;

    await connection.beginTransaction();

    try {
      const passwordHash = await bcrypt.hash(password, 10);

      const [result] = await connection.query(
        `INSERT INTO users (username, email, password_hash, full_name, role, role_id, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          username,
          email,
          passwordHash,
          full_name || username,
          primarySlug,
          primaryRoleId,
          is_active !== undefined ? (is_active ? 1 : 0) : 1,
        ]
      );

      const newUserId = (result as any).insertId;

      const roleValues = role_ids.map((rid: number) => [newUserId, rid]);
      await connection.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ?',
        [roleValues]
      );

      if (Array.isArray(city_ids) && city_ids.length > 0) {
        const cityValues = city_ids.map((cid: number) => [newUserId, cid]);
        await connection.query(
          'INSERT INTO user_cities (user_id, city_id) VALUES ?',
          [cityValues]
        );
      }

      await connection.commit();

      const [newUserRows] = await connection.query(
        `SELECT id, username, email, full_name, role, role_id, is_active, created_at
         FROM users WHERE id = ?`,
        [newUserId]
      );
      const created = (newUserRows as any[])[0];

      const [createdRoles] = await connection.query(
        `SELECT r.id, r.name, r.slug FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ?`,
        [newUserId]
      );
      const [createdCities] = await connection.query(
        `SELECT c.id, c.name, c.state, c.code FROM user_cities uc
         JOIN cities c ON c.id = uc.city_id WHERE uc.user_id = ?`,
        [newUserId]
      );

      created.roles = createdRoles;
      created.role_ids = (createdRoles as any[]).map((r) => r.id);
      created.cities = createdCities;
      created.city_ids = (createdCities as any[]).map((c) => c.id);

      return NextResponse.json(
        { success: true, message: 'User created successfully', user: created },
        { status: 201 }
      );
    } catch (txErr) {
      await connection.rollback();
      throw txErr;
    }
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Create user error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    connection.release();
  }
}