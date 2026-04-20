import { NextResponse, type NextRequest } from "next/server";

import { AUTH_SESSION_STORAGE_KEY } from "@/lib/auth/session";
import { validateSession } from "@/src/lib/auth";

function redirectWithCookies(response: NextResponse, destination: URL) {
  const redirectResponse = NextResponse.redirect(destination);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const sessionToken = request.cookies.get(AUTH_SESSION_STORAGE_KEY)?.value;
  let session = null;

  if (sessionToken) {
    session = await validateSession(sessionToken);
  }

  const pathname = request.nextUrl.pathname;
  const protectedRoutes = ["/dashboard", "/ideas", "/tasks", "/calendar", "/time", "/reports", "/admin", "/flowcharts"];
  const authRoutes = ["/auth", "/login", "/register"];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isOAuthCallbackRoute = pathname === "/auth/callback" || pathname.startsWith("/auth/callback/");

  if (isProtectedRoute && !session) {
    return redirectWithCookies(response, new URL("/login", request.url));
  }

  if (isAuthRoute && !isOAuthCallbackRoute && session) {
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
    "/auth",
    "/auth/:path*",
    "/login",
    "/login/:path*",
    "/register",
    "/register/:path*",
  ],
};