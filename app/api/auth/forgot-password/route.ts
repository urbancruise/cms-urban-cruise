import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier } = body; // Can be email or username

    if (!identifier) {
      return NextResponse.json(
        { error: 'Email or username is required' },
        { status: 400 }
      );
    }

    // Check if identifier is email or username
    const isEmail = identifier.includes('@');
    const queryField = isEmail ? 'email' : 'username';

    // Find user by email or username (only admin users)
    const [rows] = await pool.query(
      `SELECT id, email, username, full_name, role 
       FROM users 
       WHERE ${queryField} = ? AND role = 'admin'`,
      [identifier]
    );

    const users = rows as any[];

    if (users.length === 0) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { 
          success: true, 
          message: 'If an admin account exists with this email or username, a reset link has been sent' 
        },
        { status: 200 }
      );
    }

    const user = users[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await pool.query(
      `UPDATE users 
       SET reset_token = ?, reset_token_expiry = ? 
       WHERE id = ?`,
      [resetToken, resetTokenExpiry, user.id]
    );

    // In production, send email here
    // For development, log the token
    console.log(`🔐 Reset token for ${user.email}: ${resetToken}`);
    console.log(`🔗 Reset link: http://localhost:5000/reset-password?token=${resetToken}`);

    return NextResponse.json(
      { 
        success: true, 
        message: 'If an admin account exists, a reset link has been sent',
        // For development only - remove in production
        devToken: resetToken,
        devLink: `http://localhost:5000/reset-password?token=${resetToken}`
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

