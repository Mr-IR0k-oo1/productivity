import { createHash, randomBytes } from "node:crypto";

export type ApiKeyScope = "read" | "write";

/** Every Orbit key starts with this, so secret scanners and people can recognise it. */
export const API_KEY_PREFIX = "orb_";
const KEY_BODY_LENGTH = 40;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const KEY_PATTERN = new RegExp(`^${API_KEY_PREFIX}[A-Za-z0-9]{${KEY_BODY_LENGTH}}$`);

/** SHA-256 is enough here: keys are 238 bits of randomness, so there's nothing to brute-force. */
export function hashApiKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

/** A new key. `key` is shown to the person once; only `hash` and `prefix` are stored. */
export function generateApiKey() {
  // Rejection sampling keeps every character equally likely (256 isn't a multiple of 62).
  const chars: string[] = [];
  while (chars.length < KEY_BODY_LENGTH) {
    for (const byte of randomBytes(KEY_BODY_LENGTH)) {
      if (byte < 248 && chars.length < KEY_BODY_LENGTH) chars.push(ALPHABET[byte % ALPHABET.length]);
    }
  }
  const key = `${API_KEY_PREFIX}${chars.join("")}`;
  return { key, hash: hashApiKey(key), prefix: key.slice(0, API_KEY_PREFIX.length + 6) };
}

export function isApiKeyFormat(value: string) {
  return KEY_PATTERN.test(value);
}

/** The API key from an `Authorization: Bearer orb_…` header, or null for anything else. */
export function readApiKeyFromHeader(header: string | null | undefined) {
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  if (!match) return null;
  return isApiKeyFormat(match[1]) ? match[1] : null;
}

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Read keys may only read; write keys may do whatever the owner's role allows. */
export function isMethodAllowedForScope(scope: ApiKeyScope, method: string) {
  return scope === "write" || READ_METHODS.has(method.toUpperCase());
}

/** Why a stored key can't be used right now, or null when it can. */
export function apiKeyUnusableReason(
  key: { revokedAt: Date | null; expiresAt: Date | null },
  now = new Date(),
): "revoked" | "expired" | null {
  if (key.revokedAt) return "revoked";
  if (key.expiresAt && key.expiresAt.getTime() <= now.getTime()) return "expired";
  return null;
}

/** Paths an API key may never call: managing keys, and session-based auth endpoints. */
export function isPathBlockedForApiKeys(path: string) {
  return path.startsWith("/api/api-keys") || path.startsWith("/api/auth");
}

/** Last-used timestamps are written at most this often, to avoid a write on every request. */
export const LAST_USED_WRITE_INTERVAL_MS = 60_000;

export function shouldRecordLastUsed(lastUsedAt: Date | null, now = new Date()) {
  return !lastUsedAt || now.getTime() - lastUsedAt.getTime() >= LAST_USED_WRITE_INTERVAL_MS;
}
