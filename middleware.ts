import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Protected routes
const protectedRoutes = [
  '/admin',
  '/admin/:path*',
  '/api/admin',
  '/api/admin/:path*'
];

// Auth routes (redirect to dashboard if already logged in)
const authRoutes = [
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register'
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => {
    if (route.includes(':path*')) {
      const baseRoute = route.replace('/:path*', '');
      return pathname.startsWith(baseRoute);
    }
    return pathname === route;
  });

  // Check if route is auth route
  const isAuthRoute = authRoutes.some(route => {
    if (route.includes(':path*')) {
      const baseRoute = route.replace('/:path*', '');
      return pathname.startsWith(baseRoute);
    }
    return pathname === route;
  });

  // Verify token for protected routes
  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      return NextResponse.next();
    } catch {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  // Redirect to dashboard if already logged in on auth routes
  if (isAuthRoute && token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    } catch {
      // Token invalid, continue to auth page
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};