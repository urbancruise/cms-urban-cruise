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
// PUT - Update city
// ============================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const cityId = parseInt(id);

    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, state, country, code, description, is_active } = body;

    const fields: string[] = [];
    const values: any[] = [];

    if (name) {
      fields.push('name = ?');
      values.push(name);
    }
    if (state !== undefined) {
      fields.push('state = ?');
      values.push(state);
    }
    if (country) {
      fields.push('country = ?');
      values.push(country);
    }
    if (code !== undefined) {
      fields.push('code = ?');
      values.push(code);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      values.push(description);
    }
    if (is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(cityId);
    await pool.query(`UPDATE cities SET ${fields.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.query('SELECT * FROM cities WHERE id = ?', [
      cityId,
    ]);

    return NextResponse.json({
      success: true,
      message: 'City updated successfully',
      city: (updated as any[])[0],
    });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Update city error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================
// DELETE - Delete city
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const cityId = parseInt(id);

    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    const [rows] = await pool.query('SELECT id FROM cities WHERE id = ?', [cityId]);
    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    await pool.query('DELETE FROM cities WHERE id = ?', [cityId]);

    return NextResponse.json({
      success: true,
      message: 'City deleted successfully',
    });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Delete city error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

