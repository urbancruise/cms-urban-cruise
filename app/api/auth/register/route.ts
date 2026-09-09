// import { NextRequest, NextResponse } from 'next/server';
// import bcrypt from 'bcryptjs';
// import pool from '@/lib/db';

// // Validation functions
// const validateUsername = (username: string) => {
//   if (!username || username.trim().length === 0) {
//     return { valid: false, error: 'Username is required' };
//   }
//   if (username.length < 3) {
//     return { valid: false, error: 'Username must be at least 3 characters' };
//   }
//   if (username.length > 50) {
//     return { valid: false, error: 'Username must be less than 50 characters' };
//   }
//   if (!/^[a-zA-Z0-9_]+$/.test(username)) {
//     return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
//   }
//   return { valid: true };
// };

// const validateEmail = (email: string) => {
//   if (!email || email.trim().length === 0) {
//     return { valid: false, error: 'Email is required' };
//   }
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   if (!emailRegex.test(email)) {
//     return { valid: false, error: 'Please enter a valid email address' };
//   }
//   if (email.length > 100) {
//     return { valid: false, error: 'Email must be less than 100 characters' };
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
  
//   // Password strength validation
//   const hasUpperCase = /[A-Z]/.test(password);
//   const hasLowerCase = /[a-z]/.test(password);
//   const hasNumber = /[0-9]/.test(password);
//   const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
//   if (!hasUpperCase || !hasLowerCase) {
//     return { valid: false, error: 'Password must contain both uppercase and lowercase letters' };
//   }
//   if (!hasNumber) {
//     return { valid: false, error: 'Password must contain at least one number' };
//   }
//   if (!hasSpecialChar) {
//     return { valid: false, error: 'Password must contain at least one special character' };
//   }
  
//   return { valid: true };
// };

// const validateFullName = (fullName: string) => {
//   if (fullName && fullName.length > 100) {
//     return { valid: false, error: 'Full name must be less than 100 characters' };
//   }
//   return { valid: true };
// };

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const { username, email, password, full_name } = body;

//     // Validate username
//     const usernameValidation = validateUsername(username);
//     if (!usernameValidation.valid) {
//       return NextResponse.json(
//         { error: usernameValidation.error },
//         { status: 400 }
//       );
//     }

//     // Validate email
//     const emailValidation = validateEmail(email);
//     if (!emailValidation.valid) {
//       return NextResponse.json(
//         { error: emailValidation.error },
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

//     // Validate full name (optional)
//     if (full_name) {
//       const fullNameValidation = validateFullName(full_name);
//       if (!fullNameValidation.valid) {
//         return NextResponse.json(
//           { error: fullNameValidation.error },
//           { status: 400 }
//         );
//       }
//     }

//     // Check if username or email already exists
//     const [existingUsers] = await pool.query(
//       'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
//       [username, email]
//     );

//     const existing = existingUsers as any[];
//     if (existing.length > 0) {
//       const existingUser = existing[0];
//       if (existingUser.username === username) {
//         return NextResponse.json(
//           { error: 'Username is already taken' },
//           { status: 409 }
//         );
//       }
//       if (existingUser.email === email) {
//         return NextResponse.json(
//           { error: 'Email is already registered' },
//           { status: 409 }
//         );
//       }
//     }

//     // Hash password with salt
//     const saltRounds = 10;
//     const passwordHash = await bcrypt.hash(password, saltRounds);

//     // Insert user
//     const [result] = await pool.query(
//       `INSERT INTO users (username, email, password_hash, full_name, role) 
//        VALUES (?, ?, ?, ?, ?)`,
//       [username, email, passwordHash, full_name || username, 'user']
//     );

//     const insertResult = result as any;

//     return NextResponse.json(
//       {
//         success: true,
//         message: 'User registered successfully',
//         userId: insertResult.insertId,
//         user: {
//           id: insertResult.insertId,
//           username,
//           email,
//           full_name: full_name || username,
//           role: 'user'
//         }
//       },
//       { status: 201 }
//     );

//   } catch (error) {
//     console.error('Registration error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

// Validation functions
const validateUsername = (username: string) => {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: 'Username is required' };
  }
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  if (username.length > 50) {
    return { valid: false, error: 'Username must be less than 50 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  return { valid: true };
};

const validateEmail = (email: string) => {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'Email is required' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  if (email.length > 100) {
    return { valid: false, error: 'Email must be less than 100 characters' };
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
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  if (!hasUpperCase || !hasLowerCase) {
    return { valid: false, error: 'Password must contain both uppercase and lowercase letters' };
  }
  if (!hasNumber) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  if (!hasSpecialChar) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }
  
  return { valid: true };
};

const validateFullName = (fullName: string) => {
  if (fullName && fullName.length > 100) {
    return { valid: false, error: 'Full name must be less than 100 characters' };
  }
  return { valid: true };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, full_name } = body;

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return NextResponse.json(
        { error: usernameValidation.error },
        { status: 400 }
      );
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error },
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

    // Validate full name (optional)
    if (full_name) {
      const fullNameValidation = validateFullName(full_name);
      if (!fullNameValidation.valid) {
        return NextResponse.json(
          { error: fullNameValidation.error },
          { status: 400 }
        );
      }
    }

    // Check if username or email already exists
    const [existingUsers] = await pool.query(
      'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    const existing = existingUsers as any[];
    if (existing.length > 0) {
      const existingUser = existing[0];
      if (existingUser.username === username) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 409 }
        );
      }
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: 'Email is already registered' },
          { status: 409 }
        );
      }
    }

    // Hash password with salt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [result] = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, role) 
       VALUES (?, ?, ?, ?, ?)`,
      [username, email, passwordHash, full_name || username, 'user']
    );

    const insertResult = result as any;

    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        userId: insertResult.insertId,
        user: {
          id: insertResult.insertId,
          username,
          email,
          full_name: full_name || username,
          role: 'user'
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
