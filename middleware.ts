import { NextResponse, type NextRequest } from "next/server";

import { validateSession } from "@/src/lib/auth";

const SESSION_COOKIE_NAME = "session_token";

function redirectWithCookies(response: NextResponse, destination: URL) {
  const redirectResponse = NextResponse.redirect(destination);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let session = null;

  if (sessionToken) {
    session = await validateSession(sessionToken);
  }

  const pathname = request.nextUrl.pathname;
  const protectedRoutes = ["/dashboard", "/ideas", "/tasks", "/calendar", "/time", "/reports", "/admin", "/flowcharts"];
  const authRoutes = ["/login", "/register"];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isProtectedRoute && !session) {
    return redirectWithCookies(response, new URL("/login", request.url));
  }

  if (isAuthRoute && session) {
    return redirectWithCookies(response, new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/ideas/:path*",
    "/tasks/:path*",
    "/calendar/:path*",
    "/time/:path*",
    "/reports/:path*",
    "/admin/:path*",
    "/flowcharts/:path*",
    "/login",
    "/login/:path*",
    "/register",
    "/register/:path*",
  ],
};