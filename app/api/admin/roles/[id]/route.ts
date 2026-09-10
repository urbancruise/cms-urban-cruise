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

  if (!isAdmin) {
    throw { status: 403, message: 'Access denied. Admin only.' };
  }
  return decoded;
}

// ============================================
// PUT - update role
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, permissions, is_active } = body;

    const [existingRows] = await pool.query(
      'SELECT is_system FROM roles WHERE id = ?',
      [roleId]
    );
    const existing = (existingRows as any[])[0];
    if (!existing) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    if (existing.is_system && name) {
      return NextResponse.json(
        { error: 'Cannot rename a system role' },
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
      values.push(JSON.stringify(permissions));
    }
    if (is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(roleId);
    await pool.query(
      `UPDATE roles SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    const [updatedRows] = await pool.query(
      'SELECT * FROM roles WHERE id = ?',
      [roleId]
    );
    const updatedRole = (updatedRows as any[])[0];

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
      role: {
        ...updatedRole,
        is_system: Boolean(updatedRole.is_system),
        is_active: Boolean(updatedRole.is_active),
      },
    });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Update role error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// DELETE - delete role (checks user_roles)
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
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
    if (role.is_system) {
      return NextResponse.json(
        { error: 'Cannot delete a system role' },
        { status: 400 }
      );
    }

    // Check user_roles assignment
    const [users] = await pool.query(
      'SELECT COUNT(*) as count FROM user_roles WHERE role_id = ?',
      [roleId]
    );
    const count = (users as any[])[0].count;
    if (count > 0) {
      return NextResponse.json(
        { error: `Cannot delete role. ${count} user(s) are assigned to it.` },
        { status: 400 }
      );
    }

    await pool.query('DELETE FROM roles WHERE id = ?', [roleId]);

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Delete role error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}