// lmsistts\src\middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const isLoggedIn = !!token;

  // Rute autentikasi (login & register)
  const isAuthRoute = pathname === '/login' || pathname === '/register';

  // Rute yang diproteksi
  const isProtectedRoute =
    pathname.startsWith('/student') ||
    pathname.startsWith('/lecturer') ||
    pathname.startsWith('/admin');

  // Jika sudah login dan mencoba akses halaman login/register, alihkan ke landing page
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Jika belum login dan mencoba akses halaman terproteksi, alihkan ke login
  if (!isLoggedIn && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

// Tentukan rute mana yang akan dijalankan oleh middleware
export const config = {
  matcher: ['/student/:path*', '/lecturer/:path*', '/admin/:path*', '/login', '/register'],
};