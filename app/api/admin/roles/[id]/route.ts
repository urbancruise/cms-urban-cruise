import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';
import { logActivity } from '@/lib/activity';

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

  if (!isAdmin) {
    throw { status: 403, message: 'Access denied. Admin only.' };
  }
  return decoded;
}

function parsePermissions(raw: any): string[] {
  try {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') return JSON.parse(raw);
    return [];
  } catch {
    return [];
  }
}

// PUT update role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await requireAdmin(request);
    const { id } = await params;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, permissions, is_active } = body;

    const [existingRows] = await pool.query(
      'SELECT is_system, slug, name, description, permissions, is_active FROM roles WHERE id = ?',
      [roleId]
    );
    const existing = (existingRows as any[])[0];
    if (!existing) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (existing.slug === 'admin' && name) {
      return NextResponse.json(
        { error: 'Cannot rename the Admin role' },
        { status: 400 }
      );
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (name) {
      fields.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      values.push(description);
    }
    if (permissions !== undefined) {
      fields.push('permissions = ?');
      values.push(JSON.stringify(Array.isArray(permissions) ? permissions : []));
    }
    if (is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(roleId);
    await pool.query(`UPDATE roles SET ${fields.join(', ')} WHERE id = ?`, values);

    const [updatedRows] = await pool.query('SELECT * FROM roles WHERE id = ?', [
      roleId,
    ]);
    const updatedRole = (updatedRows as any[])[0];

    // ✅ Log activity
    await logActivity({
      actor: {
        userId: decoded.userId,
        userName: decoded.username || `User #${decoded.userId}`,
      },
      action: 'update',
      entityType: 'role',
      entityId: roleId,
      entityName: name || existing.name,
      changes: {
        before: {
          name: existing.name,
          description: existing.description,
          permissions: parsePermissions(existing.permissions),
          is_active: Boolean(existing.is_active),
        },
        after: {
          name: name || existing.name,
          description: description ?? existing.description,
          permissions:
            permissions !== undefined
              ? permissions
              : parsePermissions(existing.permissions),
          is_active:
            is_active !== undefined ? is_active : Boolean(existing.is_active),
        },
      },
      request,
    });

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
      role: {
        ...updatedRole,
        permissions: parsePermissions(updatedRole.permissions),
        is_system: Boolean(updatedRole.is_system),
        is_active: Boolean(updatedRole.is_active),
      },
    });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Update role error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await requireAdmin(request);
    const { id } = await params;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    const [rows] = await pool.query(
      'SELECT is_system, slug, name FROM roles WHERE id = ?',
      [roleId]
    );
    const role = (rows as any[])[0];
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (role.slug === 'admin') {
      return NextResponse.json(
        { error: 'Cannot delete the Admin role' },
        { status: 400 }
      );
    }

    const [users] = await pool.query(
      'SELECT COUNT(*) as count FROM user_roles WHERE role_id = ?',
      [roleId]
    );
    const count = (users as any[])[0].count;
    if (count > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete role. ${count} user(s) are assigned to it. Please reassign them first.`,
        },
        { status: 400 }
      );
    }

    await pool.query('DELETE FROM roles WHERE id = ?', [roleId]);

    // ✅ Log activity
    await logActivity({
      actor: {
        userId: decoded.userId,
        userName: decoded.username || `User #${decoded.userId}`,
      },
      action: 'delete',
      entityType: 'role',
      entityId: roleId,
      entityName: role.name,
      changes: { deleted: true },
      request,
    });

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Delete role error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}