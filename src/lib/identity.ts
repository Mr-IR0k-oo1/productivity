import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { acceptPendingInvites, claimLocalProfile, ensureOAuthUserWorkspace } from "@/src/controllers/auth-controller";
import { db } from "@/src/db";
import { authAccounts, authSessions, authUsers, authVerifications } from "@/src/db/schema";
import { enabledProviderIds, resolveSocialProviders } from "@/src/lib/identity-providers";
import { isLoginEnabled } from "@/src/lib/local-mode";
import { env } from "@/src/types/env";

const socialProviders = resolveSocialProviders();

export const loginEnabled = isLoginEnabled();
export const enabledProviders = enabledProviderIds(socialProviders);

/**
 * Self-hosted accounts (Better Auth). Created only when BETTER_AUTH_SECRET is set;
 * otherwise Orbit runs as a single local user and this is null.
 */
export const identity = loginEnabled
  ? betterAuth({
      appName: "Orbit",
      secret: process.env.BETTER_AUTH_SECRET,
      // Browsers reach the API through the Next.js origin (see next.config.ts rewrites),
      // so OAuth callbacks are `${APP_URL}/api/auth/callback/<provider>`.
      baseURL: env.APP_URL,
      basePath: "/api/auth",
      trustedOrigins: [env.APP_URL],
      database: drizzleAdapter(db, {
        provider: "pg",
        schema: { user: authUsers, session: authSessions, account: authAccounts, verification: authVerifications },
      }),
      advanced: { database: { generateId: "uuid" } },
      emailAndPassword: { enabled: true, minPasswordLength: 8 },
      socialProviders,
      databaseHooks: {
        user: {
          create: {
            // The first account adopts the existing local data; later ones get their own workspace.
            after: async (user) => {
              const profile = { authUserId: user.id, email: user.email, fullName: user.name || null };
              if (!(await claimLocalProfile(profile))) {
                await ensureOAuthUserWorkspace(profile);
              }
              await acceptPendingInvites(profile);
            },
          },
        },
      },
    })
  : null;
