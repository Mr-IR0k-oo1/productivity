"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";

import { fetchApiJson } from "@/lib/api/client";
import { supabase } from "@/lib/supabase";

const SESSION_RETRY_COUNT = 5;
const SESSION_RETRY_DELAY_MS = 250;

type OAuthBootstrapResponse = {
  data: {
    userId: string;
    workspaceId: string;
    createdUser: boolean;
    createdWorkspace: boolean;
  };
};

type OAuthSessionCookiePayload = {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  expires_at?: number;
  provider_token?: string | null;
  provider_refresh_token?: string | null;
};

function toCookieSessionPayload(session: Session): OAuthSessionCookiePayload {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    token_type: session.token_type,
    expires_in: session.expires_in,
    expires_at: session.expires_at,
    provider_token: session.provider_token ?? null,
    provider_refresh_token: session.provider_refresh_token ?? null,
  };
}

function wait(delayMs: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

function buildLoginRedirect(error: string, reason?: string | null) {
  const params = new URLSearchParams({ error });

  if (reason?.trim()) {
    params.set("reason", reason.trim());
  }

  return `/login?${params.toString()}`;
}

function readOAuthCallbackError(searchParams: URLSearchParams) {
  const error = searchParams.get("error")?.trim() || null;

  if (!error) {
    return null;
  }

  const errorDescription = searchParams.get("error_description")?.trim() || null;
  const errorCode = searchParams.get("error_code")?.trim() || null;

  return {
    error,
    reason: errorDescription || errorCode || error,
  };
}

async function resolveSessionWithRetry() {
  if (!supabase) {
    return null;
  }

  for (let attempt = 0; attempt < SESSION_RETRY_COUNT; attempt += 1) {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    if (data.session) {
      return data.session;
    }

    if (attempt < SESSION_RETRY_COUNT - 1) {
      await wait(SESSION_RETRY_DELAY_MS);
    }
  }

  return null;
}

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let isActive = true;

    const completeOAuth = async () => {
      if (!supabase) {
        if (isActive) {
          router.replace(buildLoginRedirect("oauth_unavailable"));
        }
        return;
      }

      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      const callbackError = readOAuthCallbackError(searchParams);

      if (callbackError && !code) {
        if (isActive) {
          router.replace(buildLoginRedirect("oauth_failed", callbackError.reason));
        }
        return;
      }

      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            if (isActive) {
              router.replace(buildLoginRedirect("oauth_failed", error.message));
            }
            return;
          }
        } catch (error) {
          if (isActive) {
            const reason = error instanceof Error && error.message.trim() ? error.message.trim() : "OAuth session exchange failed.";
            router.replace(buildLoginRedirect("oauth_failed", reason));
          }
          return;
        }
      }

      let session: Session | null = null;

      try {
        session = await resolveSessionWithRetry();
      } catch {
        if (isActive) {
          router.replace(buildLoginRedirect("oauth_failed", "Unable to resolve the OAuth session."));
        }
        return;
      }

      if (!session) {
        if (isActive) {
          router.replace(buildLoginRedirect("oauth_failed", "No OAuth session was found after sign-in."));
        }
        return;
      }

      try {
        await fetchApiJson<OAuthBootstrapResponse>("/api/auth/oauth/bootstrap", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            session: toCookieSessionPayload(session),
          }),
          session: {
            authToken: session.access_token,
          },
        });

        if (isActive) {
          router.replace("/dashboard");
          router.refresh();
        }
      } catch (error) {
        if (isActive) {
          const reason =
            error instanceof Error && error.message.trim()
              ? error.message.trim()
              : "Workspace setup failed during OAuth bootstrap.";
          router.replace(buildLoginRedirect("oauth_bootstrap_failed", reason));
        }
      }
    };

    void completeOAuth();

    return () => {
      isActive = false;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-6 text-[var(--foreground)]">
      <div className="rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface)] px-6 py-5 text-center">
        <p className="text-sm text-[var(--muted)]">Completing sign in...</p>
      </div>
    </div>
  );
}
