// import { NextRequest, NextResponse } from 'next/server';
// import jwt from 'jsonwebtoken';
// import pool from '@/lib/db';

// export async function GET(request: NextRequest) {
//   try {
//     const token = request.cookies.get('token')?.value;

//     if (!token) {
//       return NextResponse.json(
//         { error: 'Not authenticated' },
//         { status: 401 }
//       );
//     }

//     const decoded = jwt.verify(
//       token,
//       process.env.JWT_SECRET || 'fallback_secret'
//     ) as { userId: number };

//     const [rows] = await pool.query(
//       `SELECT id, username, email, full_name, role, is_active, created_at, last_login 
//        FROM users 
//        WHERE id = ?`,
//       [decoded.userId]
//     );

//     const users = rows as any[];

//     if (users.length === 0) {
//       return NextResponse.json(
//         { error: 'User not found' },
//         { status: 404 }
//       );
//     }

//     const user = users[0];

//     if (!user.is_active) {
//       return NextResponse.json(
//         { error: 'Account is deactivated' },
//         { status: 403 }
//       );
//     }

//     return NextResponse.json({ user }, { status: 200 });

//   } catch (error) {
//     if (error instanceof jwt.JsonWebTokenError) {
//       return NextResponse.json(
//         { error: 'Invalid token' },
//         { status: 401 }
//       );
//     }

//     console.error('Get user error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
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

    const [rows] = await pool.query(
      `SELECT id, username, email, full_name, role, is_active, created_at, last_login 
       FROM users 
       WHERE id = ?`,
      [decoded.userId]
    );

    const users = rows as any[];

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0];

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      );
    }

    return NextResponse.json({ user }, { status: 200 });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
