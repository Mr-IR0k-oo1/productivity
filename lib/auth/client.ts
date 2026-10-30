"use client";

import { createAuthClient } from "better-auth/react";

// Same-origin: /api/auth/* is proxied to the Orbit API (see next.config.ts), so the
// session cookie is first-party.
export const authClient = createAuthClient();

export type AuthConfig = {
  loginEnabled: boolean;
  providers: Array<"github" | "google" | "microsoft" | "apple" | "gitlab">;
};

export async function fetchAuthConfig(): Promise<AuthConfig> {
  const response = await fetch("/api/auth/config");

  if (!response.ok) {
    throw new Error("Could not reach the Orbit API");
  }

  return ((await response.json()) as { data: AuthConfig }).data;
}
