// Which OAuth providers are configured, read from environment variables.
// A provider is enabled only when both its client id and secret are present.

import type { EnvSource } from "@/src/lib/local-mode";

export const SUPPORTED_PROVIDERS = ["github", "google", "microsoft", "apple", "gitlab"] as const;
export type ProviderId = (typeof SUPPORTED_PROVIDERS)[number];

type ProviderCredentials = { clientId: string; clientSecret: string };

export type SocialProviderConfig = Partial<{
  github: ProviderCredentials;
  google: ProviderCredentials;
  microsoft: ProviderCredentials & { tenantId: string };
  apple: ProviderCredentials & { appBundleIdentifier?: string };
  gitlab: ProviderCredentials & { issuer?: string };
}>;

function credentials(env: EnvSource, prefix: string): ProviderCredentials | null {
  const clientId = env[`${prefix}_CLIENT_ID`]?.trim();
  const clientSecret = env[`${prefix}_CLIENT_SECRET`]?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function resolveSocialProviders(env: EnvSource = process.env): SocialProviderConfig {
  const config: SocialProviderConfig = {};

  const github = credentials(env, "GITHUB");
  if (github) config.github = github;

  const google = credentials(env, "GOOGLE");
  if (google) config.google = google;

  const microsoft = credentials(env, "MICROSOFT");
  // "common" accepts both work/school and personal Microsoft accounts.
  if (microsoft) config.microsoft = { ...microsoft, tenantId: env.MICROSOFT_TENANT_ID?.trim() || "common" };

  const apple = credentials(env, "APPLE");
  if (apple) {
    config.apple = {
      ...apple,
      ...(env.APPLE_APP_BUNDLE_IDENTIFIER?.trim() ? { appBundleIdentifier: env.APPLE_APP_BUNDLE_IDENTIFIER.trim() } : {}),
    };
  }

  const gitlab = credentials(env, "GITLAB");
  // Set GITLAB_ISSUER for self-managed GitLab; defaults to gitlab.com.
  if (gitlab) config.gitlab = { ...gitlab, ...(env.GITLAB_ISSUER?.trim() ? { issuer: env.GITLAB_ISSUER.trim() } : {}) };

  return config;
}

export function enabledProviderIds(config: SocialProviderConfig): ProviderId[] {
  return SUPPORTED_PROVIDERS.filter((id) => Boolean(config[id]));
}
