import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { logActivity } from '@/lib/activity';

// ============================================
// Auth
// ============================================
async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) throw { status: 401, message: 'Not authenticated' };

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || 'fallback_secret'
  ) as { userId: number; role: string; roles?: string[]; username?: string };

  const isAdmin =
    decoded.role === 'admin' ||
    (Array.isArray(decoded.roles) && decoded.roles.includes('admin'));

  if (!isAdmin) throw { status: 403, message: 'Access denied. Admin only.' };
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
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const [rows] = (await pool.query(
      `SELECT id, username, email, full_name, role, role_id, is_active, created_at, last_login
       FROM users WHERE id = ?`,
      [userId]
    )) as any;
    const users = rows as any[];
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [roleRows] = (await pool.query(
      `SELECT r.id, r.name, r.slug FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ?`,
      [userId]
    )) as any;
    const [cityRows] = (await pool.query(
      `SELECT c.id, c.name, c.state, c.code FROM user_cities uc
       JOIN cities c ON c.id = uc.city_id WHERE uc.user_id = ?`,
      [userId]
    )) as any;
    const [permRows] = (await pool.query(
      `SELECT city_id, permission_key FROM user_city_permissions WHERE user_id = ?`,
      [userId]
    )) as any;

    const user = users[0];
    user.roles = roleRows;
    user.role_ids = (roleRows as any[]).map((r) => r.id);
    user.cities = cityRows;
    user.city_ids = (cityRows as any[]).map((c) => c.id);

    const grouped: Record<number, string[]> = {};
    (permRows as any[]).forEach((row) => {
      if (!grouped[row.city_id]) grouped[row.city_id] = [];
      grouped[row.city_id].push(row.permission_key);
    });
    user.city_permissions = Object.entries(grouped).map(([cid, perms]) => ({
      city_id: Number(cid),
      permissions: perms,
    }));

    return NextResponse.json({ user }, { status: 200 });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Get user error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
    const decoded = await requireAdmin(request);
    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
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
      city_permissions,
    } = body;

    const [existingUsers] = await connection.query(
      `SELECT id, username, email, full_name, role_id, is_active FROM users WHERE id = ?`,
      [userId]
    );
    const existingArr = existingUsers as any[];
    if (existingArr.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const before = existingArr[0];

    if (username || email) {
      const [checkUsers] = await connection.query(
        `SELECT id, username, email FROM users
         WHERE (username = ? OR email = ?) AND id != ?`,
        [username || '', email || '', userId]
      );
      const check = checkUsers as any[];
      if (check.length > 0) {
        const c = check[0];
        if (c.username === username) {
          return NextResponse.json(
            { error: 'Username is already taken' },
            { status: 409 }
          );
        }
        if (c.email === email) {
          return NextResponse.json(
            { error: 'Email is already registered' },
            { status: 409 }
          );
        }
      }
    }

    let validRoles: any[] = [];
    if (Array.isArray(role_ids)) {
      if (role_ids.length === 0) {
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
        await connection.query('DELETE FROM user_roles WHERE user_id = ?', [
          userId,
        ]);
        const valuesArr = role_ids.map((rid: number) => [userId, rid]);
        await connection.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ?',
          [valuesArr]
        );
      }

      // ── Cities + permissions ──
      if (Array.isArray(city_ids) || Array.isArray(city_permissions)) {
        await connection.query(
          'DELETE FROM user_city_permissions WHERE user_id = ?',
          [userId]
        );
        await connection.query('DELETE FROM user_cities WHERE user_id = ?', [
          userId,
        ]);

        const cityList: number[] = Array.isArray(city_ids) ? [...city_ids] : [];
        const permList: { city_id: number; permissions: string[] }[] =
          Array.isArray(city_permissions) ? city_permissions : [];

        const citySet = new Set<number>(cityList);
        permList.forEach((cp) => {
          if (cp.permissions && cp.permissions.length > 0) {
            citySet.add(cp.city_id);
          }
        });

        if (citySet.size > 0) {
          const cityValues = Array.from(citySet).map((cid) => [userId, cid]);
          await connection.query(
            'INSERT INTO user_cities (user_id, city_id) VALUES ?',
            [cityValues]
          );
        }

        const permValues: any[] = [];
        permList.forEach((cp) => {
          (cp.permissions || []).forEach((p) => {
            permValues.push([userId, cp.city_id, p]);
          });
        });
        if (permValues.length > 0) {
          await connection.query(
            'INSERT INTO user_city_permissions (user_id, city_id, permission_key) VALUES ?',
            [permValues]
          );
        }
      }

      await connection.commit();

      // Fetch updated
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
      const [permRows] = await connection.query(
        `SELECT city_id, permission_key FROM user_city_permissions WHERE user_id = ?`,
        [userId]
      );

      const updated = (rows as any[])[0];
      updated.roles = roleRows;
      updated.role_ids = (roleRows as any[]).map((r) => r.id);
      updated.cities = cityRows;
      updated.city_ids = (cityRows as any[]).map((c) => c.id);

      const grouped: Record<number, string[]> = {};
      (permRows as any[]).forEach((row) => {
        if (!grouped[row.city_id]) grouped[row.city_id] = [];
        grouped[row.city_id].push(row.permission_key);
      });
      updated.city_permissions = Object.entries(grouped).map(([cid, perms]) => ({
        city_id: Number(cid),
        permissions: perms,
      }));

      await logActivity({
        actor: {
          userId: decoded.userId,
          userName: decoded.username || `User #${decoded.userId}`,
        },
        action: 'update',
        entityType: 'user',
        entityId: userId,
        entityName: username || before.username,
        changes: {
          before: {
            username: before.username,
            email: before.email,
            full_name: before.full_name,
            is_active: Boolean(before.is_active),
          },
          after: {
            username: username || before.username,
            email: email || before.email,
            full_name: full_name ?? before.full_name,
            is_active:
              is_active !== undefined ? is_active : Boolean(before.is_active),
          },
        },
        request,
      });

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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// ============================================
// DELETE - delete user
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await requireAdmin(request);
    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const [existingUsers] = await pool.query(
      'SELECT id, username, role FROM users WHERE id = ?',
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

    await logActivity({
      actor: {
        userId: decoded.userId,
        userName: decoded.username || `User #${decoded.userId}`,
      },
      action: 'delete',
      entityType: 'user',
      entityId: userId,
      entityName: existing[0].username,
      changes: { deleted: true },
      request,
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Delete user error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}