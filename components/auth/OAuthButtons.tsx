"use client";

import { useState } from "react";
import { Apple, Building2, Chrome, Github, Gitlab } from "lucide-react";

import { authClient, type AuthConfig } from "@/lib/auth/client";

type ProviderId = AuthConfig["providers"][number];

const providerMeta: Record<ProviderId, { label: string; icon: typeof Github }> = {
  github: { label: "GitHub", icon: Github },
  google: { label: "Google", icon: Chrome },
  microsoft: { label: "Microsoft", icon: Building2 },
  apple: { label: "Apple", icon: Apple },
  gitlab: { label: "GitLab", icon: Gitlab },
};

type OAuthButtonsProps = {
  providers: ProviderId[];
  disabled?: boolean;
  onError: (message: string) => void;
};

export default function OAuthButtons({ providers, disabled, onError }: OAuthButtonsProps) {
  const [pending, setPending] = useState<ProviderId | null>(null);

  if (providers.length === 0) {
    return null;
  }

  const signIn = async (provider: ProviderId) => {
    setPending(provider);
    // Redirects to the provider; errors come back to /login?error=...
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: "/dashboard",
      errorCallbackURL: "/login",
    });

    if (error) {
      setPending(null);
      onError(error.message ?? `Could not start ${providerMeta[provider].label} sign-in`);
    }
  };

  return (
    <div className="grid gap-2">
      {providers.map((provider) => {
        const { label, icon: Icon } = providerMeta[provider];
        return (
          <button
            key={provider}
            type="button"
            onClick={() => void signIn(provider)}
            disabled={disabled || pending !== null}
            className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-tertiary)] hover:bg-[var(--color-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {pending === provider ? "Redirecting…" : `Continue with ${label}`}
          </button>
        );
      })}
    </div>
  );
}
