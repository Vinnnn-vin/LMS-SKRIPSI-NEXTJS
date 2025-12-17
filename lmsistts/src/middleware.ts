// lmsistts\src\middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

function getDashboardPath(role: string | undefined | null): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "lecturer":
      return "/lecturer/dashboard";
    case "student":
      return "/student/dashboard";
    default:
      return "/";
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ TAMBAHKAN INI: Skip middleware untuk API routes
  // Biarkan API route handle auth sendiri
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isLoggedIn = !!token;
  const userRole = token?.role as string | undefined;

  const isAuthRoute = pathname === "/login" || pathname === "/register";

  const isProtectedRoute =
    pathname.startsWith("/student") ||
    pathname.startsWith("/lecturer") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/profile");

  if (isLoggedIn && isAuthRoute) {
    const dashboardPath = getDashboardPath(userRole);
    return NextResponse.redirect(new URL(dashboardPath, req.url));
  }

  if (!isLoggedIn && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // ✅ UPDATE MATCHER: Exclude API routes, static files, dan _next
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};