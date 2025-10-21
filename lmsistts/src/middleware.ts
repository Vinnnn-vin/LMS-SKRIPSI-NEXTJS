import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Helper function to get dashboard path based on role
function getDashboardPath(role: string | undefined | null): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'lecturer':
      return '/lecturer/dashboard';
    case 'student':
      return '/student/dashboard';
    default:
      return '/'; 
  }
}

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const isLoggedIn = !!token;
  const userRole = token?.role as string | undefined;

  // Rute autentikasi (login & register)
  const isAuthRoute = pathname === '/login' || pathname === '/register';

  // Rute yang diproteksi
  const isProtectedRoute =
    pathname.startsWith('/student') ||
    pathname.startsWith('/lecturer') ||
    pathname.startsWith('/admin');

  // Jika SUDAH login dan mencoba akses halaman login/register
  if (isLoggedIn && isAuthRoute) {
    // --- PERBAIKAN DI SINI ---
    // Arahkan ke dashboard yang sesuai dengan peran pengguna
    const dashboardPath = getDashboardPath(userRole);
    return NextResponse.redirect(new URL(dashboardPath, req.url));
  }

  // Jika BELUM login dan mencoba akses halaman terproteksi
  if (!isLoggedIn && isProtectedRoute) {
    // Arahkan ke halaman login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

// Tentukan rute mana yang akan dijalankan oleh middleware
export const config = {
  matcher: ['/student/:path*', '/lecturer/:path*', '/admin/:path*', '/login', '/register'],
};