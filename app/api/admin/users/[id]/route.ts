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
// GET single user
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const [rows] = await pool.query(
      `SELECT id, username, email, full_name, role, role_id, is_active, created_at, last_login
       FROM users WHERE id = ?`,
      [userId]
    );
    const users = rows as any[];
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [roleRows] = await pool.query(
      `SELECT r.id, r.name, r.slug FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ?`,
      [userId]
    );

    const [cityRows] = await pool.query(
      `SELECT c.id, c.name, c.state, c.code FROM user_cities uc
       JOIN cities c ON c.id = uc.city_id WHERE uc.user_id = ?`,
      [userId]
    );

    const user = users[0];
    user.roles = roleRows;
    user.role_ids = (roleRows as any[]).map((r) => r.id);
    user.cities = cityRows;
    user.city_ids = (cityRows as any[]).map((c) => c.id);

    return NextResponse.json({ user }, { status: 200 });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Get user error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// PUT - update user
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await pool.getConnection();
  try {
    await requireAdmin(request);
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      connection.release();
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      username,
      email,
      full_name,
      role_ids,
      is_active,
      password,
      city_ids,
    } = body;

    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );
    if ((existingUsers as any[]).length === 0) {
      connection.release();
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (username || email) {
      const [checkUsers] = await connection.query(
        `SELECT id, username, email FROM users
         WHERE (username = ? OR email = ?) AND id != ?`,
        [username || '', email || '', userId]
      );
      const check = checkUsers as any[];
      if (check.length > 0) {
        connection.release();
        const c = check[0];
        if (c.username === username)
          return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
        if (c.email === email)
          return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
      }
    }

    let validRoles: any[] = [];
    if (Array.isArray(role_ids)) {
      if (role_ids.length === 0) {
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
      validRoles = roleRows as any[];
      if (validRoles.length !== role_ids.length) {
        connection.release();
        return NextResponse.json(
          { error: 'One or more selected roles are invalid or inactive' },
          { status: 400 }
        );
      }
    }

    await connection.beginTransaction();

    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (username) {
        fields.push('username = ?');
        values.push(username);
      }
      if (email) {
        fields.push('email = ?');
        values.push(email);
      }
      if (full_name !== undefined) {
        fields.push('full_name = ?');
        values.push(full_name);
      }
      if (is_active !== undefined) {
        fields.push('is_active = ?');
        values.push(is_active ? 1 : 0);
      }
      if (password) {
        const hash = await bcrypt.hash(password, 10);
        fields.push('password_hash = ?');
        values.push(hash);
      }

      if (validRoles.length > 0) {
        const slugs = validRoles.map((r) => r.slug);
        const primarySlug = slugs.includes('admin') ? 'admin' : slugs[0];
        const primaryId =
          validRoles.find((r) => r.slug === primarySlug)?.id ?? validRoles[0].id;

        fields.push('role = ?');
        values.push(primarySlug);
        fields.push('role_id = ?');
        values.push(primaryId);
      }

      if (fields.length > 0) {
        values.push(userId);
        await connection.query(
          `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
          values
        );
      }

      if (Array.isArray(role_ids)) {
        await connection.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
        const valuesArr = role_ids.map((rid: number) => [userId, rid]);
        await connection.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ?',
          [valuesArr]
        );
      }

      if (Array.isArray(city_ids)) {
        await connection.query('DELETE FROM user_cities WHERE user_id = ?', [userId]);
        if (city_ids.length > 0) {
          const cityValues = city_ids.map((cid: number) => [userId, cid]);
          await connection.query(
            'INSERT INTO user_cities (user_id, city_id) VALUES ?',
            [cityValues]
          );
        }
      }

      await connection.commit();

      const [rows] = await connection.query(
        `SELECT id, username, email, full_name, role, role_id, is_active, created_at, last_login
         FROM users WHERE id = ?`,
        [userId]
      );
      const [roleRows] = await connection.query(
        `SELECT r.id, r.name, r.slug FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ?`,
        [userId]
      );
      const [cityRows] = await connection.query(
        `SELECT c.id, c.name, c.state, c.code FROM user_cities uc
         JOIN cities c ON c.id = uc.city_id WHERE uc.user_id = ?`,
        [userId]
      );

      const updated = (rows as any[])[0];
      updated.roles = roleRows;
      updated.role_ids = (roleRows as any[]).map((r) => r.id);
      updated.cities = cityRows;
      updated.city_ids = (cityRows as any[]).map((c) => c.id);

      return NextResponse.json({
        success: true,
        message: 'User updated successfully',
        user: updated,
      });
    } catch (txErr) {
      await connection.rollback();
      throw txErr;
    }
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Update user error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    connection.release();
  }
}

// ============================================
// DELETE user
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await requireAdmin(request);
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const [existingUsers] = await pool.query(
      'SELECT id, role FROM users WHERE id = ?',
      [userId]
    );
    const existing = existingUsers as any[];
    if (existing.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (userId === decoded.userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }
    if (existing[0].role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 400 }
      );
    }

    await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Delete user error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

