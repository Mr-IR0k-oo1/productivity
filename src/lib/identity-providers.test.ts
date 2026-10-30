import { describe, expect, it } from "vitest";

import { enabledProviderIds, resolveSocialProviders } from "@/src/lib/identity-providers";
import { isAuthBypassEnabled, isLoginEnabled } from "@/src/lib/local-mode";

describe("resolveSocialProviders", () => {
  it("enables nothing without credentials", () => {
    expect(enabledProviderIds(resolveSocialProviders({}))).toEqual([]);
  });

  it("requires both client id and secret", () => {
    const config = resolveSocialProviders({ GITHUB_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "secret" });
    expect(enabledProviderIds(config)).toEqual([]);
  });

  it("enables configured providers in a stable order", () => {
    const config = resolveSocialProviders({
      GITLAB_CLIENT_ID: "g",
      GITLAB_CLIENT_SECRET: "g",
      GITHUB_CLIENT_ID: " id ",
      GITHUB_CLIENT_SECRET: "secret",
    });
    expect(enabledProviderIds(config)).toEqual(["github", "gitlab"]);
    expect(config.github).toEqual({ clientId: "id", clientSecret: "secret" });
  });

  it("defaults Microsoft to the common tenant", () => {
    const config = resolveSocialProviders({ MICROSOFT_CLIENT_ID: "m", MICROSOFT_CLIENT_SECRET: "s" });
    expect(config.microsoft?.tenantId).toBe("common");
  });

  it("passes through optional Apple and GitLab settings", () => {
    const config = resolveSocialProviders({
      APPLE_CLIENT_ID: "a",
      APPLE_CLIENT_SECRET: "s",
      APPLE_APP_BUNDLE_IDENTIFIER: "com.example.orbit",
      GITLAB_CLIENT_ID: "g",
      GITLAB_CLIENT_SECRET: "s",
      GITLAB_ISSUER: "https://gitlab.example.com",
    });
    expect(config.apple?.appBundleIdentifier).toBe("com.example.orbit");
    expect(config.gitlab?.issuer).toBe("https://gitlab.example.com");
  });
});

describe("login switch", () => {
  it("is off without a secret", () => {
    expect(isLoginEnabled({})).toBe(false);
    expect(isAuthBypassEnabled({})).toBe(true);
  });

  it("turns on with BETTER_AUTH_SECRET", () => {
    expect(isLoginEnabled({ BETTER_AUTH_SECRET: "x".repeat(32) })).toBe(true);
  });

  it("can be forced off for local debugging", () => {
    expect(isLoginEnabled({ BETTER_AUTH_SECRET: "x".repeat(32), ORBIT_DISABLE_AUTH: "true" })).toBe(false);
  });
});
