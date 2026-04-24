import type { MiddlewareHandler } from "hono";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

function getIP(c: any): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-real-ip") ??
    "unknown"
  );
}

export const authRateLimiter: MiddlewareHandler = async (c, next) => {
  const ip = getIP(c);
  const now = Date.now();
  const record = store.get(ip);

  if (!record || record.resetAt < now) {
    // First request or window expired — reset
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfterSecs = Math.ceil((record.resetAt - now) / 1000);
    c.res.headers.set("Retry-After", String(retryAfterSecs));
    return c.json(
      { error: `Too many attempts. Try again in ${Math.ceil(retryAfterSecs / 60)} minutes.` },
      429
    );
  }

  record.count += 1;
  return next();
};
