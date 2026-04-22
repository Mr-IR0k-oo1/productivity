export const AUTH_STORAGE_KEY = "pf-auth-session";
export const AUTH_COOKIE_NAME = "pf-auth-cookie";
export const REMEMBER_ME_STORAGE_KEY = "pf-remember-me";
export const WORKSPACE_STORAGE_KEY = "pf-workspace-id";
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function isLocalhostUrl(value: string) {
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function getPublicAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (typeof window !== "undefined") {
    const browserOrigin = window.location.origin.replace(/\/$/, "");

    if (!configuredUrl) {
      return browserOrigin;
    }

    if (isLocalhostUrl(configuredUrl) && !isLocalhostUrl(browserOrigin)) {
      return browserOrigin;
    }

    return configuredUrl.replace(/\/$/, "");
  }

  return configuredUrl?.replace(/\/$/, "") || "http://localhost:3000";
}
