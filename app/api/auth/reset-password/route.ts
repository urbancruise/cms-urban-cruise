// import { NextRequest, NextResponse } from 'next/server';
// import bcrypt from 'bcryptjs';
// import pool from '@/lib/db';

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const { token, password } = body;

//     if (!token || !password) {
//       return NextResponse.json(
//         { error: 'Token and password are required' },
//         { status: 400 }
//       );
//     }

//     // Validate password strength
//     if (password.length < 6) {
//       return NextResponse.json(
//         { error: 'Password must be at least 6 characters' },
//         { status: 400 }
//       );
//     }

//     // Check password strength
//     const hasUpperCase = /[A-Z]/.test(password);
//     const hasLowerCase = /[a-z]/.test(password);
//     const hasNumber = /[0-9]/.test(password);
//     const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

//     if (!hasUpperCase || !hasLowerCase) {
//       return NextResponse.json(
//         { error: 'Password must contain both uppercase and lowercase letters' },
//         { status: 400 }
//       );
//     }
//     if (!hasNumber) {
//       return NextResponse.json(
//         { error: 'Password must contain at least one number' },
//         { status: 400 }
//       );
//     }
//     if (!hasSpecialChar) {
//       return NextResponse.json(
//         { error: 'Password must contain at least one special character' },
//         { status: 400 }
//       );
//     }

//     // Find user with valid token
//     const [rows] = await pool.query(
//       `SELECT id, email, username, role, reset_token, reset_token_expiry 
//        FROM users 
//        WHERE reset_token = ? AND reset_token_expiry > NOW() AND role = 'admin'`,
//       [token]
//     );

//     const users = rows as any[];
//     if (users.length === 0) {
//       return NextResponse.json(
//         { error: 'Invalid or expired reset token' },
//         { status: 400 }
//       );
//     }

//     const user = users[0];

//     // Hash new password
//     const saltRounds = 10;
//     const passwordHash = await bcrypt.hash(password, saltRounds);

//     // Update password and clear reset token
//     await pool.query(
//       `UPDATE users 
//        SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL 
//        WHERE id = ?`,
//       [passwordHash, user.id]
//     );

//     return NextResponse.json(
//       { 
//         success: true, 
//         message: 'Password reset successful' 
//       },
//       { status: 200 }
//     );

//   } catch (error) {
//     console.error('Reset password error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasUpperCase || !hasLowerCase) {
      return NextResponse.json(
        { error: 'Password must contain both uppercase and lowercase letters' },
        { status: 400 }
      );
    }
    if (!hasNumber) {
      return NextResponse.json(
        { error: 'Password must contain at least one number' },
        { status: 400 }
      );
    }
    if (!hasSpecialChar) {
      return NextResponse.json(
        { error: 'Password must contain at least one special character' },
        { status: 400 }
      );
    }

    // Find user with valid token
    const [rows] = await pool.query(
      `SELECT id, email, username, role, reset_token, reset_token_expiry 
       FROM users 
       WHERE reset_token = ? AND reset_token_expiry > NOW() AND role = 'admin'`,
      [token]
    );

    const users = rows as any[];
    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const user = users[0];

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    await pool.query(
      `UPDATE users 
       SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL 
       WHERE id = ?`,
      [passwordHash, user.id]
    );

    return NextResponse.json(
      { 
        success: true, 
        message: 'Password reset successful' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
