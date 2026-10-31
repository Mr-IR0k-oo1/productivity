import { NextResponse, type NextRequest } from "next/server";
import { isAppHost, getAppUrl, getMarketingUrl } from "@/lib/config/domains";

// Paths that belong strictly to the marketing website
const MARKETING_PATHS = [
  "/features",
  "/privacy",
  "/terms",
  "/cookies",
  "/security",
];

// Paths that belong strictly to the application workspace
const APP_PATHS = [
  "/dashboard",
  "/my-day",
  "/inbox",
  "/projects",
  "/tasks",
  "/goals",
  "/docs",
  "/ideas",
  "/backlog",
  "/calendar",
  "/teams",
  "/time",
  "/flowcharts",
  "/reports",
  "/automations",
  "/integrations",
  "/settings",
  "/admin",
  "/profile",
];

const AUTH_PATHS = [
  "/login",
  "/register",
  "/onboarding",
  "/forgot-password",
  "/reset-password",
];

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const { pathname, search } = request.nextUrl;

  // Bypass Next.js internal files, APIs, and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/f/") || // public shared flowcharts
    pathname.includes(".") // static files like favicon.ico, images, etc.
  ) {
    return NextResponse.next();
  }

  const isApp = isAppHost(host);
  const isProduction = process.env.NODE_ENV === "production";
  const strictSubdomains = process.env.STRICT_SUBDOMAINS === "true" || isProduction;

  // -------------------------------------------------------------
  // 1. APPLICATION SUBDOMAIN (e.g. app.orbit.io or app.localhost)
  // -------------------------------------------------------------
  if (isApp) {
    // Root on app subdomain goes directly to workspace dashboard
    if (pathname === "/") {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      return NextResponse.redirect(dashboardUrl);
    }

    // If accessing marketing-only pages on app subdomain in production, redirect to marketing domain
    const isMarketingOnly = MARKETING_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    if (isMarketingOnly && strictSubdomains) {
      const marketingBase = process.env.NEXT_PUBLIC_MARKETING_URL || "https://orbit.io";
      const targetUrl = new URL(`${pathname}${search}`, marketingBase);
      return NextResponse.redirect(targetUrl);
    }

    return NextResponse.next();
  }

  // -------------------------------------------------------------
  // 2. MARKETING DOMAIN (e.g. orbit.io, www.orbit.io, or localhost:3000)
  // -------------------------------------------------------------
  const isAppRoute = APP_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuthRoute = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // If user hits app or auth routes on marketing domain in production, redirect to app subdomain
  if ((isAppRoute || isAuthRoute) && strictSubdomains) {
    const appBase = process.env.NEXT_PUBLIC_APP_URL || "https://app.orbit.io";
    const targetUrl = new URL(`${pathname}${search}`, appBase);
    return NextResponse.redirect(targetUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
