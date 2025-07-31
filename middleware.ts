import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { locales, localePrefix } from './i18n.config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'zh',
  localePrefix
});

// Function to check auth status
const checkAuth = async (request: NextRequest) => {
  const token =
    request.cookies.get('token')?.value ||
    request.cookies.get('auth-token')?.value;

  if (!token) return false;

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured in middleware');
      return false;
    }

    const secretKey = new TextEncoder().encode(jwtSecret);
    await jwtVerify(token, secretKey);
    return true;
  } catch (error) {
    console.error('JWT verification failed in middleware:', error);
    return false;
  }
};

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip API routes entirely
  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/auth/')) {
      return NextResponse.next();
    }

    // Check auth for protected API routes
    return checkAuth(request).then((isAuthenticated) => {
      if (!isAuthenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.next();
    });
  }

  // Skip not-found route to prevent infinite loops
  if (pathname.includes('/not-found')) {
    return NextResponse.next();
  }

  // Handle locale middleware
  const response = intlMiddleware(request);

  // Check authentication for protected routes
  const protectedPaths = ['/dashboard', '/system-management'];
  const isProtected = protectedPaths.some((path) => pathname.includes(path));

  if (isProtected && !pathname.includes('/auth/')) {
    return checkAuth(request).then((isAuthenticated) => {
      if (!isAuthenticated) {
        const locale = pathname.split('/')[1];
        const targetLocale = locales.includes(locale as any) ? locale : 'zh';

        return NextResponse.redirect(
          new URL(`/${targetLocale}/auth/sign-in`, request.url)
        );
      }
      return response;
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Skip all paths with a dot (files) and next.js internals
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
    // Always apply to root
    '/'
  ]
};
