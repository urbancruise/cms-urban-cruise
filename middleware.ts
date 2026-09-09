import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Protected routes (require authentication)
const protectedRoutes = [
  '/admin',
  '/admin/:path*',
  '/api/admin',
  '/api/admin/:path*'
];

// Auth routes (redirect to dashboard if already logged in)
// REMOVED: '/register' from auth routes
const authRoutes = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/forgot-password',
  '/api/auth/reset-password'
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  console.log('Middleware - Path:', pathname);
  console.log('Middleware - Has Token:', !!token);

  // ✅ ROOT ROUTE - Show landing page (NO REDIRECT)
  if (pathname === '/') {
    console.log('Root route - showing landing page');
    return NextResponse.next();
  }

  // ✅ Allow static files and public assets
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon.ico') || 
      pathname.startsWith('/public') ||
      pathname.startsWith('/images') ||
      pathname.startsWith('/fonts')) {
    return NextResponse.next();
  }

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

  // ✅ Verify token for protected routes
  if (isProtectedRoute) {
    if (!token) {
      console.log('Protected route - No token, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      console.log('Protected route - Token verified for user:', decoded);
      return NextResponse.next();
    } catch (error) {
      console.log('Protected route - Invalid token');
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  // ✅ Redirect to dashboard if already logged in on auth routes
  if (isAuthRoute && token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      console.log('Auth route - Already logged in, redirecting to dashboard');
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    } catch {
      // Token invalid, continue to auth page
      console.log('Auth route - Invalid token, showing auth page');
      return NextResponse.next();
    }
  }

  // ✅ For all other routes, continue
  return NextResponse.next();
}

// ✅ Force Node.js runtime instead of Edge
export const runtime = 'nodejs';

// ✅ Configure which routes to run middleware on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|images|fonts).*)',
  ],
};
