import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { AUTH_SESSION_STORAGE_KEY } from "@/lib/auth/session";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

function createCookieStorage(request: NextRequest, response: NextResponse) {
  return {
    getItem(key: string) {
      return request.cookies.get(key)?.value ?? null;
    },
    setItem(key: string, value: string) {
      response.cookies.set({
        name: key,
        value,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
      });
    },
    removeItem(key: string) {
      response.cookies.set({
        name: key,
        value: "",
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 0,
      });
    },
  };
}

function redirectWithCookies(response: NextResponse, destination: URL) {
  const redirectResponse = NextResponse.redirect(destination);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
      storageKey: AUTH_SESSION_STORAGE_KEY,
      storage: createCookieStorage(request, response),
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;
  const protectedRoutes = ["/dashboard", "/ideas", "/tasks", "/calendar", "/time", "/reports", "/admin"];
  const authRoutes = ["/auth", "/login", "/register"];
  const recoveryRoutes = ["/auth/forgot-password", "/auth/update-password"];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isRecoveryRoute = recoveryRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isProtectedRoute && !session) {
    return redirectWithCookies(response, new URL("/auth", request.url));
  }

  if (isAuthRoute && !isRecoveryRoute && session) {
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
    "/auth",
    "/auth/:path*",
    "/login",
    "/login/:path*",
    "/register",
    "/register/:path*",
  ],
};