export const AUTH_STORAGE_KEY = "pf-auth-session";
export const AUTH_COOKIE_NAME = "pf-auth-cookie";
export const REMEMBER_ME_STORAGE_KEY = "pf-remember-me";
export const WORKSPACE_STORAGE_KEY = "pf-workspace-id";
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function getPublicAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}
