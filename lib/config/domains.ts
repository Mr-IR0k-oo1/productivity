/**
 * Domain & Subdomain Configuration for ORBIT
 *
 * Separates Marketing (e.g. orbit.io or localhost:3000)
 * from Application (e.g. app.orbit.io or app.localhost:3000)
 */

export const DEFAULT_MARKETING_DOMAIN = "orbit.io";
export const DEFAULT_APP_DOMAIN = "app.orbit.io";

/**
 * Checks whether the given hostname belongs to the application subdomain.
 * Matches:
 *  - "app.orbit.io"
 *  - "app.localhost:3000" / "app.localhost"
 *  - any hostname starting with "app."
 *  - desktop / tauri environments ("tauri.localhost")
 */
export function isAppHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const cleanHost = host.toLowerCase().split(":")[0]; // strip port

  if (cleanHost === "tauri.localhost") return true;
  if (cleanHost.startsWith("app.")) return true;

  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (configuredAppUrl) {
    try {
      const parsed = new URL(configuredAppUrl);
      if (parsed.hostname.toLowerCase() === cleanHost) return true;
    } catch {
      // ignore
    }
  }

  return false;
}

/**
 * Checks whether the given hostname belongs to the marketing domain.
 */
export function isMarketingHost(host: string | null | undefined): boolean {
  if (!host) return true;
  return !isAppHost(host);
}

/**
 * Resolves the absolute or relative URL to the Application subdomain.
 *
 * In browser:
 * - If on app host: returns relative path (e.g. "/login")
 * - If on marketing host: returns full app URL (e.g. "https://app.orbit.io/login" or "http://app.localhost:3000/login")
 *
 * On server / SSR:
 * - Uses configured NEXT_PUBLIC_APP_URL or production app domain.
 */
export function getAppUrl(path: string = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (typeof window !== "undefined") {
    const currentHost = window.location.host;
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

    if (isAppHost(currentHost)) {
      return normalizedPath;
    }

    if (isLocalhost) {
      // Local dev subdomain: app.localhost:<port>
      const port = window.location.port ? `:${window.location.port}` : "";
      return `${window.location.protocol}//app.localhost${port}${normalizedPath}`;
    }

    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || DEFAULT_APP_DOMAIN;
    return `https://${appDomain}${normalizedPath}`;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    const base = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    return `${base}${normalizedPath}`;
  }

  return `https://${DEFAULT_APP_DOMAIN}${normalizedPath}`;
}

/**
 * Resolves the absolute or relative URL to the Marketing domain.
 *
 * In browser:
 * - If on marketing host: returns relative path (e.g. "/features")
 * - If on app host: returns full marketing URL (e.g. "https://orbit.io/features" or "http://localhost:3000/features")
 */
export function getMarketingUrl(path: string = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (typeof window !== "undefined") {
    const currentHost = window.location.host;
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname.endsWith(".localhost");

    if (isMarketingHost(currentHost)) {
      return normalizedPath;
    }

    if (isLocalhost) {
      const port = window.location.port ? `:${window.location.port}` : "";
      return `${window.location.protocol}//localhost${port}${normalizedPath}`;
    }

    const marketingDomain = process.env.NEXT_PUBLIC_MARKETING_DOMAIN || DEFAULT_MARKETING_DOMAIN;
    return `https://${marketingDomain}${normalizedPath}`;
  }

  if (process.env.NEXT_PUBLIC_MARKETING_URL) {
    const base = process.env.NEXT_PUBLIC_MARKETING_URL.replace(/\/$/, "");
    return `${base}${normalizedPath}`;
  }

  return `https://${DEFAULT_MARKETING_DOMAIN}${normalizedPath}`;
}
