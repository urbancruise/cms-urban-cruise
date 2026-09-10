import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    ) as { userId: number };

    const body = await request.json();
    const { full_name, email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, decoded.userId]
    );

    const existing = existingUsers as any[];
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Email already in use by another account' },
        { status: 409 }
      );
    }

    await pool.query(
      'UPDATE users SET full_name = ?, email = ? WHERE id = ?',
      [full_name, email, decoded.userId]
    );

    // Get updated user
    const [rows] = await pool.query(
      `SELECT id, username, email, full_name, role, is_active, created_at, last_login 
       FROM users 
       WHERE id = ?`,
      [decoded.userId]
    );

    const users = rows as any[];
    const user = users[0];

    return NextResponse.json(
      { success: true, message: 'Profile updated successfully', user },
      { status: 200 }
    );

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

