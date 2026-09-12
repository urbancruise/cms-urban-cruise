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
  ) as { userId: number; role: string; username?: string };

  if (decoded.role !== 'admin') {
    throw { status: 403, message: 'Access denied. Admin only.' };
  }
  return decoded;
}

// PUT
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await requireAdmin(request);
    const { id } = await params;
    const cityId = parseInt(id);

    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, state, country, code, description, is_active } = body;

    const [existingRows] = await pool.query(
      'SELECT name, state, country, code, description, is_active FROM cities WHERE id = ?',
      [cityId]
    );
    const existing = (existingRows as any[])[0];
    if (!existing) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

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
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(cityId);
    await pool.query(`UPDATE cities SET ${fields.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.query('SELECT * FROM cities WHERE id = ?', [
      cityId,
    ]);
    const updatedCity = (updated as any[])[0];

    // ✅ Log activity
    await logActivity({
      actor: {
        userId: decoded.userId,
        userName: decoded.username || `User #${decoded.userId}`,
      },
      action: 'update',
      entityType: 'city',
      entityId: cityId,
      entityName: name || existing.name,
      changes: {
        before: {
          name: existing.name,
          state: existing.state,
          country: existing.country,
          code: existing.code,
          is_active: Boolean(existing.is_active),
        },
        after: {
          name: name || existing.name,
          state: state ?? existing.state,
          country: country || existing.country,
          code: code ?? existing.code,
          is_active:
            is_active !== undefined ? is_active : Boolean(existing.is_active),
        },
      },
      request,
    });

    return NextResponse.json({
      success: true,
      message: 'City updated successfully',
      city: updatedCity,
    });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Update city error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await requireAdmin(request);
    const { id } = await params;
    const cityId = parseInt(id);

    if (isNaN(cityId)) {
      return NextResponse.json({ error: 'Invalid city ID' }, { status: 400 });
    }

    const [rows] = await pool.query(
      'SELECT id, name FROM cities WHERE id = ?',
      [cityId]
    );
    const city = (rows as any[])[0];
    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    await pool.query('DELETE FROM cities WHERE id = ?', [cityId]);

    // ✅ Log activity
    await logActivity({
      actor: {
        userId: decoded.userId,
        userName: decoded.username || `User #${decoded.userId}`,
      },
      action: 'delete',
      entityType: 'city',
      entityId: cityId,
      entityName: city.name,
      changes: { deleted: true },
      request,
    });

    return NextResponse.json({
      success: true,
      message: 'City deleted successfully',
    });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Delete city error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

