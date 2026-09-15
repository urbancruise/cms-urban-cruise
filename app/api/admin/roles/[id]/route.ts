import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';
import { logActivity } from '@/lib/activity';

// Auth
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

// Helpers
function parsePermissions(raw: any): string[] {
  try {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') return JSON.parse(raw);
    return [];
  } catch {
    return [];
  }
}

// PUT — update role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await requireAdmin(request);
    const { id } = await params;
    const roleId = parseInt(id, 10);

    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { name, slug, description, permissions, is_active } = body;

    const [existingRows] = (await pool.query(
      `SELECT id, name, slug, description, permissions, is_system, is_active
       FROM roles WHERE id = ?`,
      [roleId]
    )) as any;

    const existing = (existingRows as any[])[0];
    if (!existing) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Guard: don't rename the Admin role
    if (existing.slug === 'admin' && name && name !== existing.name) {
      return NextResponse.json(
        { error: 'Cannot rename the Admin role' },
        { status: 400 }
      );
    }

    // Guard: slug is immutable
    if (slug && slug !== existing.slug) {
      return NextResponse.json(
        { error: 'Slug cannot be changed after creation' },
        { status: 400 }
      );
    }

    // Guard: name uniqueness
    if (name && name !== existing.name) {
      const [nameCheck] = (await pool.query(
        `SELECT id FROM roles WHERE name = ? AND id != ?`,
        [name, roleId]
      )) as any;
      if ((nameCheck as any[]).length > 0) {
        return NextResponse.json(
          { error: 'A role with this name already exists' },
          { status: 409 }
        );
      }
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (name !== undefined && name !== null && name !== '') {
      fields.push('name = ?');
      values.push(name);
    }

    if (description !== undefined) {
      fields.push('description = ?');
      values.push(description || null);
    }

    if (permissions !== undefined) {
      const permsArray = Array.isArray(permissions) ? permissions : [];
      fields.push('permissions = ?');
      values.push(JSON.stringify(permsArray));
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
    await pool.query(
      `UPDATE roles SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    const [updatedRows] = (await pool.query(
      `SELECT * FROM roles WHERE id = ?`,
      [roleId]
    )) as any;
    const updatedRole = (updatedRows as any[])[0];

    try {
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
    } catch (logErr) {
      console.error('Log activity failed (non-fatal):', logErr);
    }

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
      { error: 'Internal server error: ' + (err?.message || 'unknown') },
      { status: 500 }
    );
  }
}

// DELETE — delete role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await requireAdmin(request);
    const { id } = await params;
    const roleId = parseInt(id, 10);

    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    const [rows] = (await pool.query(
      'SELECT is_system, slug, name FROM roles WHERE id = ?',
      [roleId]
    )) as any;
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

    const [users] = (await pool.query(
      'SELECT COUNT(*) as count FROM user_roles WHERE role_id = ?',
      [roleId]
    )) as any;
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

    try {
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
    } catch (logErr) {
      console.error('Log activity failed (non-fatal):', logErr);
    }

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
      { error: 'Internal server error: ' + (err?.message || 'unknown') },
      { status: 500 }
    );
  }
}