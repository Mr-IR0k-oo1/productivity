import { redirect } from "next/navigation";

type SearchParamValue = string | string[] | undefined;

type AuthRedirectPageProps = {
  searchParams?: Promise<{
    tab?: SearchParamValue;
    error?: SearchParamValue;
    notice?: SearchParamValue;
  }>;
};

function readFirst(value: SearchParamValue) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return typeof value === "string" ? value : null;
}

export default async function AuthRedirectPage({ searchParams }: AuthRedirectPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const tab = readFirst(resolvedParams?.tab);
  const error = readFirst(resolvedParams?.error);
  const notice = readFirst(resolvedParams?.notice);

  const target = tab === "register" && !error && !notice ? "/register" : "/login";
  const nextParams = new URLSearchParams();

  if (error) {
    nextParams.set("error", error);
  }

  if (notice) {
    nextParams.set("notice", notice);
  }

<<<<<<< HEAD
    const message = queryNoticeMessages[noticeParam];

    if (message) {
      setInlineNotice(message);
    }
  }, [noticeParam]);

  const errorMessage = useMemo(() => {
    if (inlineError) {
      return inlineError;
    }

    if (!callbackError) {
      return null;
    }

    return callbackErrorMessages[callbackError] ?? "Unable to complete sign in.";
  }, [callbackError, inlineError]);

  const isBusy = loadingProvider !== null || magicLinkLoading;

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isActive = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!isActive || !data.session) {
        return;
      }

      router.replace("/dashboard");
    });

    return () => {
      isActive = false;
    };
  }, [router]);

  const setTab = (tab: AuthTab) => {
    setInlineError(null);
    setInlineNotice(null);
    setActiveTab(tab);

    const nextParams = new URLSearchParams(searchParams.toString());

    if (tab === "register") {
      nextParams.set("tab", "register");
    } else {
      nextParams.delete("tab");
    }

    nextParams.delete("error");
    nextParams.delete("notice");
    const query = nextParams.toString();
    router.replace(query ? `/auth?${query}` : "/auth", { scroll: false });
  };

  const handleOAuth = async (provider: OAuthProvider) => {
    setInlineNotice(null);
    setInlineError(null);

    if (!supabase) {
      setInlineError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(REMEMBER_ME_STORAGE_KEY, "true");
    }

    setLoadingProvider(provider);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setInlineError(error.message);
      setLoadingProvider(null);
    }
  };

  const handleMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInlineNotice(null);
    setInlineError(null);

    if (!supabase) {
      setInlineError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    const email = magicLinkEmail.trim().toLowerCase();

    if (!email) {
      setInlineError("Enter an email address to receive a magic link.");
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(REMEMBER_ME_STORAGE_KEY, "true");
    }

    setMagicLinkLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setInlineError(error.message);
      setMagicLinkLoading(false);
      return;
    }

    setMagicLinkEmail("");
    setInlineNotice("Magic link sent. Check your inbox to continue.");
    setMagicLinkLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-6 text-[var(--foreground)]">
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]">
              <span className="text-3xl font-bold text-white">P</span>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)]">Orbit</h1>
          </div>
        </div>

        <div className="rounded-3xl border border-[color:var(--card-border)] bg-[var(--surface)] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl">
          <div className="mb-8 flex border-b border-zinc-800">
            <button
              type="button"
              onClick={() => setTab("login")}
              disabled={isBusy}
              className={`flex-1 border-b-2 pb-4 text-base font-medium transition-colors disabled:cursor-not-allowed ${
                activeTab === "login" ? "border-[var(--accent)] text-[var(--foreground)]" : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setTab("register")}
              disabled={isBusy}
              className={`flex-1 border-b-2 pb-4 text-base font-medium transition-colors disabled:cursor-not-allowed ${
                activeTab === "register"
                  ? "border-[var(--accent)] text-[var(--foreground)]"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Register
            </button>
          </div>

          {errorMessage && (
            <p className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{errorMessage}</p>
          )}

          {inlineNotice && (
            <p className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{inlineNotice}</p>
          )}

          <div className="mb-8">{activeTab === "login" ? <LoginForm showSocialLogin={false} showRegisterPrompt={false} /> : <RegisterForm showLoginPrompt={false} />}</div>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-700" />
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Continue with</span>
            <div className="h-px flex-1 bg-zinc-700" />
          </div>

          <div className="space-y-4">
            {providers.map(({ provider, label, icon: Icon, className }) => (
              <button
                key={provider}
                type="button"
                onClick={() => handleOAuth(provider)}
                disabled={isBusy}
                className={`flex w-full items-center justify-center gap-3 rounded-2xl py-4 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
              >
                <Icon className="h-5 w-5" />
                {loadingProvider === provider ? "Redirecting..." : label}
              </button>
            ))}
          </div>

          <form onSubmit={handleMagicLink} className="mt-4 space-y-3">
            <label className="text-sm text-zinc-400">Email for Magic Link</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={magicLinkEmail}
                onChange={(event) => setMagicLinkEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                disabled={isBusy}
                className="flex min-w-[132px] items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Mail className="h-4 w-4" />
                {magicLinkLoading ? "Sending..." : "Magic Link"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--muted)]">
            <Link href="/auth/forgot-password" className="text-[var(--accent)] transition-colors hover:opacity-80">
              Forgot your password?
            </Link>
          </div>

          <div className="mt-4 text-center text-sm text-[var(--muted)]">
            {activeTab === "login" ? (
              <>
                Need an account?{" "}
                <button type="button" onClick={() => setTab("register")} className="text-[var(--accent)] transition-colors hover:opacity-80">
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button type="button" onClick={() => setTab("login")} className="text-[var(--accent)] transition-colors hover:opacity-80">
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-[var(--muted)]">By signing in, you agree to our Terms and Privacy Policy.</p>
      </div>
    </div>
  );
}
=======
  redirect(nextParams.size > 0 ? `${target}?${nextParams.toString()}` : target);
}
>>>>>>> 5887c3ffd1f244c5f98a8839a5bce2fd51cdc98a
