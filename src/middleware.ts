import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth';

// Define routes that are always accessible without authentication
const publicRoutes = ['/', '/auth/sign-in', '/auth/sign-up'];

// Define routes that require specific permissions
const protectedRoutes = [
  {
    path: '/dashboard/system-management/users',
    permission: 'user:list'
  },
  {
    path: '/dashboard/system-management/roles',
    permission: 'role:list'
  },
  {
    path: '/dashboard/system-management/permissions',
    permission: 'permission:list'
  },
  {
    path: '/dashboard/system-management/menus',
    permission: 'menu:list'
  }
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes
  if (pathname.startsWith('/api/')) {
    // Check if the route is public
    if (pathname.startsWith('/api/auth/')) {
      return NextResponse.next();
    }

    // Get token from cookies
    const token = request.cookies.get('token')?.value;

    // If no token, return 401
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      // Verify token
      await verifyAuth(token);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Check if the route is public (no locale prefix needed)
  if (
    publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + '/')
    )
  ) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('token')?.value;

  // If no token, redirect to login
  if (!token) {
    const url = new URL('/auth/sign-in', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  try {
    // Verify token
    const payload = await verifyAuth(token);

    // Check if the route requires specific permissions
    const protectedRoute = protectedRoutes.find(
      (route) =>
        pathname === route.path || pathname.startsWith(route.path + '/')
    );

    if (protectedRoute) {
      // For protected routes, check the user's permissions
      const hasPermission =
        Array.isArray(payload.permissions) &&
        payload.permissions.includes(protectedRoute.permission);

      if (!hasPermission) {
        // Redirect to dashboard with access denied message
        const url = new URL('/dashboard', request.url);
        url.searchParams.set('accessDenied', 'true');
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Token is invalid, redirect to login
    const url = new URL('/auth/sign-in', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
}

// Run the middleware on all routes except static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads/ (uploaded files - should be served as static assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|uploads/).*)'
  ]
};
