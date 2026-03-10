import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/saved',
  '/explore',
  '/achievements',
  '/article',
  '/onboarding',
];

// Routes that should redirect to dashboard if already logged in
const authRoutes = [
  '/login',
  '/signin',
  '/signup',
];

function isAuthenticated(request: NextRequest): boolean {
  // Check for Supabase access token in cookies
  const token = request.cookies.get('sb-access-token');
  return !!token && token.value.length > 0;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuth = isAuthenticated(request);
  const onboardingComplete = request.cookies.get('onboarding-complete')?.value;

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if current path is an auth page (login/signup)
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isAuth) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // Add a redirect param so we can send them back after login
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users who already finished onboarding away from auth pages
  if (isAuthRoute && isAuth && onboardingComplete === 'true') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Prevent access to protected routes (like dashboard) until onboarding is finished
  if (isProtectedRoute && isAuth && pathname !== '/onboarding') {
    if (onboardingComplete === 'false') {
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding';
      // Preserve original destination so we could optionally use it later
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Redirect users who already completed onboarding away from onboarding page
  if (pathname.startsWith('/onboarding') && isAuth) {
    if (onboardingComplete === 'true') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
