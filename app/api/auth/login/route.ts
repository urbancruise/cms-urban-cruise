// import { NextRequest, NextResponse } from 'next/server';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import { serialize } from 'cookie';
// import pool from '@/lib/db';

// // Validation functions
// const validateIdentifier = (identifier: string) => {
//   if (!identifier || identifier.trim().length === 0) {
//     return { valid: false, error: 'Email or username is required' };
//   }
//   if (identifier.length < 2) {
//     return { valid: false, error: 'Email or username must be at least 2 characters' };
//   }
//   if (identifier.length > 100) {
//     return { valid: false, error: 'Email or username must be less than 100 characters' };
//   }
//   return { valid: true };
// };

// const validatePassword = (password: string) => {
//   if (!password || password.length === 0) {
//     return { valid: false, error: 'Password is required' };
//   }
//   if (password.length < 6) {
//     return { valid: false, error: 'Password must be at least 6 characters' };
//   }
//   if (password.length > 100) {
//     return { valid: false, error: 'Password must be less than 100 characters' };
//   }
//   return { valid: true };
// };

// const validateEmail = (email: string) => {
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   if (!emailRegex.test(email)) {
//     return { valid: false, error: 'Please enter a valid email address' };
//   }
//   return { valid: true };
// };

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const { identifier, password } = body;

//     console.log('Login attempt:', { identifier });

//     // Validate identifier
//     const identifierValidation = validateIdentifier(identifier);
//     if (!identifierValidation.valid) {
//       return NextResponse.json(
//         { error: identifierValidation.error },
//         { status: 400 }
//       );
//     }

//     // Validate password
//     const passwordValidation = validatePassword(password);
//     if (!passwordValidation.valid) {
//       return NextResponse.json(
//         { error: passwordValidation.error },
//         { status: 400 }
//       );
//     }

//     // Check if identifier is email or username
//     const isEmail = identifier.includes('@');
    
//     // Validate email format if it's an email
//     if (isEmail) {
//       const emailValidation = validateEmail(identifier);
//       if (!emailValidation.valid) {
//         return NextResponse.json(
//           { error: emailValidation.error },
//           { status: 400 }
//         );
//       }
//     }

//     const queryField = isEmail ? 'email' : 'username';

//     const [rows] = await pool.query(
//       `SELECT id, username, email, password_hash, full_name, role, is_active 
//        FROM users 
//        WHERE ${queryField} = ?`,
//       [identifier]
//     );

//     const users = rows as any[];

//     if (users.length === 0) {
//       console.log('User not found');
//       return NextResponse.json(
//         { error: 'Invalid credentials' },
//         { status: 401 }
//       );
//     }

//     const user = users[0];
//     console.log('User found:', { username: user.username, role: user.role });

//     // Check if account is active
//     if (!user.is_active) {
//       return NextResponse.json(
//         { error: 'Account is deactivated. Please contact support.' },
//         { status: 403 }
//       );
//     }

//     // Verify password
//     const isPasswordValid = await bcrypt.compare(password, user.password_hash);
//     console.log('Password valid:', isPasswordValid);

//     if (!isPasswordValid) {
//       // Add delay to prevent timing attacks
//       await new Promise(resolve => setTimeout(resolve, 500));
//       return NextResponse.json(
//         { error: 'Invalid credentials' },
//         { status: 401 }
//       );
//     }

//     // Update last login
//     await pool.query(
//       'UPDATE users SET last_login = NOW() WHERE id = ?',
//       [user.id]
//     );

//     // Generate JWT token
//     const token = jwt.sign(
//       {
//         userId: user.id,
//         email: user.email,
//         username: user.username,
//         role: user.role
//       },
//       process.env.JWT_SECRET || 'fallback_secret',
//       { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
//     );

//     console.log('Token generated:', token ? 'Yes' : 'No');

//     const cookie = serialize('token', token, {
//       httpOnly: true,
//       secure: process.env.COOKIE_SECURE === 'true',
//       sameSite: 'lax',
//       path: '/',
//       maxAge: 60 * 60 * 24 * 7 // 7 days
//     });

//     console.log('Cookie set:', cookie ? 'Yes' : 'No');

//     const { password_hash, ...userWithoutPassword } = user;

//     return NextResponse.json(
//       {
//         success: true,
//         message: 'Login successful',
//         user: userWithoutPassword,
//       },
//       {
//         status: 200,
//         headers: {
//           'Set-Cookie': cookie
//         }
//       }
//     );

//   } catch (error) {
//     console.error('Login error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error: ' + (error as Error).message },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import pool from '@/lib/db';

// Validation functions
const validateIdentifier = (identifier: string) => {
  if (!identifier || identifier.trim().length === 0) {
    return { valid: false, error: 'Email or username is required' };
  }
  if (identifier.length < 2) {
    return { valid: false, error: 'Email or username must be at least 2 characters' };
  }
  if (identifier.length > 100) {
    return { valid: false, error: 'Email or username must be less than 100 characters' };
  }
  return { valid: true };
};

const validatePassword = (password: string) => {
  if (!password || password.length === 0) {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }
  if (password.length > 100) {
    return { valid: false, error: 'Password must be less than 100 characters' };
  }
  return { valid: true };
};

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  return { valid: true };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    console.log('Login attempt:', { identifier });

    // Validate identifier
    const identifierValidation = validateIdentifier(identifier);
    if (!identifierValidation.valid) {
      return NextResponse.json(
        { error: identifierValidation.error },
        { status: 400 }
      );
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Check if identifier is email or username
    const isEmail = identifier.includes('@');
    
    // Validate email format if it's an email
    if (isEmail) {
      const emailValidation = validateEmail(identifier);
      if (!emailValidation.valid) {
        return NextResponse.json(
          { error: emailValidation.error },
          { status: 400 }
        );
      }
    }

    const queryField = isEmail ? 'email' : 'username';

    const [rows] = await pool.query(
      `SELECT id, username, email, password_hash, full_name, role, is_active 
       FROM users 
       WHERE ${queryField} = ?`,
      [identifier]
    );

    const users = rows as any[];

    if (users.length === 0) {
      console.log('User not found');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = users[0];
    console.log('User found:', { username: user.username, role: user.role });

    // Check if account is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      // Add delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 500));
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log('Token generated:', token ? 'Yes' : 'No');

    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    console.log('Cookie set:', cookie ? 'Yes' : 'No');

    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: userWithoutPassword,
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': cookie
        }
      }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
