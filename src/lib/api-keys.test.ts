import { describe, expect, it } from "vitest";

import {
  apiKeyUnusableReason,
  generateApiKey,
  hashApiKey,
  isApiKeyFormat,
  isMethodAllowedForScope,
  isPathBlockedForApiKeys,
  readApiKeyFromHeader,
  shouldRecordLastUsed,
} from "@/src/lib/api-keys";

describe("generateApiKey", () => {
  it("makes a well-formed key whose hash and prefix match", () => {
    const { key, hash, prefix } = generateApiKey();
    expect(isApiKeyFormat(key)).toBe(true);
    expect(hash).toBe(hashApiKey(key));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(key.startsWith(prefix)).toBe(true);
    expect(prefix).toHaveLength(10);
  });

  it("never repeats", () => {
    const keys = new Set(Array.from({ length: 200 }, () => generateApiKey().key));
    expect(keys.size).toBe(200);
  });
});

describe("readApiKeyFromHeader", () => {
  const { key } = generateApiKey();

  it("reads a bearer key", () => {
    expect(readApiKeyFromHeader(`Bearer ${key}`)).toBe(key);
    expect(readApiKeyFromHeader(`bearer   ${key}`)).toBe(key);
  });

  it("ignores missing, malformed and non-Orbit tokens", () => {
    expect(readApiKeyFromHeader(undefined)).toBeNull();
    expect(readApiKeyFromHeader(key)).toBeNull();
    expect(readApiKeyFromHeader("Bearer some-session-token")).toBeNull();
    expect(readApiKeyFromHeader(`Bearer ${key}x`)).toBeNull();
    expect(readApiKeyFromHeader(`Bearer ${key} extra`)).toBeNull();
  });
});

describe("isMethodAllowedForScope", () => {
  it("limits read keys to safe methods", () => {
    expect(isMethodAllowedForScope("read", "GET")).toBe(true);
    expect(isMethodAllowedForScope("read", "head")).toBe(true);
    expect(isMethodAllowedForScope("read", "POST")).toBe(false);
    expect(isMethodAllowedForScope("read", "DELETE")).toBe(false);
    expect(isMethodAllowedForScope("write", "PATCH")).toBe(true);
  });
});

describe("apiKeyUnusableReason", () => {
  const now = new Date("2026-10-31T12:00:00Z");
  it("reports revoked before expired, and null for a live key", () => {
    expect(apiKeyUnusableReason({ revokedAt: now, expiresAt: new Date("2020-01-01") }, now)).toBe("revoked");
    expect(apiKeyUnusableReason({ revokedAt: null, expiresAt: now }, now)).toBe("expired");
    expect(apiKeyUnusableReason({ revokedAt: null, expiresAt: new Date("2027-01-01") }, now)).toBeNull();
    expect(apiKeyUnusableReason({ revokedAt: null, expiresAt: null }, now)).toBeNull();
  });
});

describe("isPathBlockedForApiKeys", () => {
  it("keeps keys away from key management and auth", () => {
    expect(isPathBlockedForApiKeys("/api/api-keys")).toBe(true);
    expect(isPathBlockedForApiKeys("/api/api-keys/123/revoke")).toBe(true);
    expect(isPathBlockedForApiKeys("/api/auth/sign-out")).toBe(true);
    expect(isPathBlockedForApiKeys("/api/tasks")).toBe(false);
  });
});

describe("shouldRecordLastUsed", () => {
  const now = new Date("2026-10-31T12:00:00Z");
  it("writes on first use and then at most once a minute", () => {
    expect(shouldRecordLastUsed(null, now)).toBe(true);
    expect(shouldRecordLastUsed(new Date(now.getTime() - 30_000), now)).toBe(false);
    expect(shouldRecordLastUsed(new Date(now.getTime() - 60_000), now)).toBe(true);
  });
});
