import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) throw { status: 401, message: 'Not authenticated' };

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || 'fallback_secret'
  ) as { userId: number; role: string };

  if (decoded.role !== 'admin') {
    throw { status: 403, message: 'Access denied. Admin only.' };
  }
  return decoded;
}

// ============================================
// GET - List all roles
// ============================================
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const [rows] = await pool.query(
      `SELECT id, name, slug, description, permissions, is_system, is_active, created_at
       FROM roles
       ORDER BY is_system DESC, name ASC`
    );

    // Convert MySQL TINYINT (0/1) to real booleans so React doesn't render 0 as text
    const roles = (rows as any[]).map((r) => ({
      ...r,
      is_system: Boolean(r.is_system),
      is_active: Boolean(r.is_active),
    }));

    return NextResponse.json({ roles }, { status: 200 });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Get roles error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// POST - Create a new role
// ============================================
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { name, slug, description, permissions, is_active } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    const [existing] = await pool.query(
      'SELECT id FROM roles WHERE name = ? OR slug = ?',
      [name, slug]
    );
    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Role name or slug already exists' },
        { status: 409 }
      );
    }

    const [result] = await pool.query(
      `INSERT INTO roles (name, slug, description, permissions, is_active, is_system)
       VALUES (?, ?, ?, ?, ?, FALSE)`,
      [
        name,
        slug,
        description || null,
        JSON.stringify(permissions || []),
        is_active !== false ? 1 : 0,
      ]
    );

    const insertResult = result as any;
    const [newRole] = await pool.query(
      'SELECT * FROM roles WHERE id = ?',
      [insertResult.insertId]
    );

    const role = (newRole as any[])[0];

    return NextResponse.json(
      {
        success: true,
        message: 'Role created successfully',
        role: {
          ...role,
          is_system: Boolean(role.is_system),
          is_active: Boolean(role.is_active),
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Create role error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}