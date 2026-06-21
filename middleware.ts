import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Paths that require authentication
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isTrainerRoute = pathname.startsWith('/trainer');
  const isMemberRoute = pathname.startsWith('/member');
  const isAuthRoute = pathname === '/login' || pathname === '/register';

  if (!token) {
    // If user is trying to access protected route without token, redirect to login
    if (isDashboardRoute || isTrainerRoute || isMemberRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // If token is present, decode it
  const payload = decodeJwt(token);
  if (!payload || !payload.role) {
    // Invalid token structure, clear it and redirect to login
    if (isDashboardRoute || isTrainerRoute || isMemberRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      const response = NextResponse.redirect(url);
      response.cookies.delete('token');
      return response;
    }
    return NextResponse.next();
  }

  const role = payload.role.toUpperCase();

  // If user is logged in and tries to access /login or /register, redirect to dashboard
  if (isAuthRoute) {
    const url = request.nextUrl.clone();
    if (role === 'MEMBER') {
      url.pathname = '/member';
    } else if (role === 'TRAINER') {
      url.pathname = '/trainer';
    } else {
      url.pathname = '/dashboard';
    }
    return NextResponse.redirect(url);
  }

  // Role-based route authorization
  if (isDashboardRoute && role !== 'GYM_ADMIN' && role !== 'SUPER_ADMIN') {
    const url = request.nextUrl.clone();
    url.pathname = role === 'MEMBER' ? '/member' : '/trainer';
    return NextResponse.redirect(url);
  }

  if (isTrainerRoute && role !== 'TRAINER') {
    const url = request.nextUrl.clone();
    url.pathname = role === 'MEMBER' ? '/member' : '/dashboard';
    return NextResponse.redirect(url);
  }

  if (isMemberRoute && role !== 'MEMBER') {
    const url = request.nextUrl.clone();
    url.pathname = role === 'TRAINER' ? '/trainer' : '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Config to specify matching paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - images (public images)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|images|favicon.ico).*)',
  ],
};
