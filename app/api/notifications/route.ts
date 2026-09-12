import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

async function requireAuth(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) throw { status: 401, message: 'Not authenticated' };
  return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as {
    userId: number;
    role: string;
  };
}

// GET
export async function GET(request: NextRequest) {
  try {
    const decoded = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);
    const unreadOnly = searchParams.get('unread') === 'true';

    let query = `SELECT id, type, title, message, entity_type, entity_id,
                        actor_id, actor_name, link, is_read, created_at
                 FROM notifications
                 WHERE user_id = ?`;
    const params: any[] = [decoded.userId];

    if (unreadOnly) query += ' AND is_read = FALSE';
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = (await pool.query(query, params)) as any;

    const [countRows] = (await pool.query(
      'SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [decoded.userId]
    )) as any;

    return NextResponse.json({
      notifications: rows,
      unread: Number((countRows as any)[0]?.unread) || 0,
    });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Get notifications error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH — mark read
export async function PATCH(request: NextRequest) {
  try {
    const decoded = await requireAuth(request);
    const body = await request.json();
    const { id, markAll } = body;

    if (markAll) {
      await pool.query(
        'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
        [decoded.userId]
      );
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json(
        { error: 'id or markAll required' },
        { status: 400 }
      );
    }

    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, decoded.userId]
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE(request: NextRequest) {
  try {
    const decoded = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all') === 'true';

    if (all) {
      await pool.query('DELETE FROM notifications WHERE user_id = ?', [
        decoded.userId,
      ]);
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json(
        { error: 'id or all required' },
        { status: 400 }
      );
    }

    await pool.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [Number(id), decoded.userId]
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

