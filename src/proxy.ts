import { NextRequest, NextResponse } from 'next/server';
import { SUPPORTED_LOCALES } from '@/lib/locales';

const supportedLocales = SUPPORTED_LOCALES.map(locale => locale.code);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin route authentication (now under locale structure)
  const adminPathMatch = pathname.match(/^\/[a-z]{2}\/admin/);
  if (adminPathMatch && !pathname.includes('/login') && pathname !== '/api/admin/config') {
    const cookieToken = request.cookies.get('admin-token')?.value;
    const authHeader = request.headers.get('authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    const token = cookieToken || headerToken;
    
    if (!token) {
      // Extract locale from the path for redirect
      const locale = pathname.split('/')[1];
      return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url));
    }
    return NextResponse.next();
  }

  // Skip locale handling for API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/fonts') ||
    pathname.includes('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Check if pathname already has a valid locale
  const pathnameHasLocale = supportedLocales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Redirect root path to default locale
  if (pathname === '/') {
    // Get locale from cookie or default to 'en'
    const locale = request.cookies.get('locale')?.value || 'en';
    const validLocale = supportedLocales.includes(locale) ? locale : 'en';
    return NextResponse.redirect(new URL(`/${validLocale}`, request.url));
  }

  // For other paths without locale, redirect to default locale with the path
  const locale = request.cookies.get('locale')?.value || 'en';
  const validLocale = supportedLocales.includes(locale) ? locale : 'en';
  return NextResponse.redirect(new URL(`/${validLocale}${pathname}`, request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};