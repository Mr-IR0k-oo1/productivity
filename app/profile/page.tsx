"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfileQuery, useUpdateProfileMutation } from "@/hooks/useProfile";
import { authClient, fetchAuthConfig } from "@/lib/auth/client";

const MAX_PHOTO_BYTES = 500 * 1024;

function initials(name: string | null | undefined, email: string | undefined) {
  const source = name?.trim() || email || "?";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function ProfileDetails() {
  const profileQuery = useProfileQuery();
  const updateProfile = useUpdateProfileMutation();
  const profile = profileQuery.data;
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? "");
      setJobTitle(profile.jobTitle ?? "");
    }
  }, [profile]);

  const save = (event: FormEvent) => {
    event.preventDefault();
    updateProfile.mutate(
      { fullName: fullName.trim(), jobTitle: jobTitle.trim() || null },
      { onSuccess: () => toast.success("Profile saved"), onError: (error) => toast.error(errorMessage(error)) },
    );
  };

  const changePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Choose a PNG, JPEG or WebP image");
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("Photo must be smaller than 500 KB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () =>
      updateProfile.mutate(
        { avatarUrl: String(reader.result) },
        { onSuccess: () => toast.success("Photo updated"), onError: (error) => toast.error(errorMessage(error)) },
      );
    reader.readAsDataURL(file);
  };

  if (profileQuery.isLoading) {
    return <div className="orbit-card h-64 animate-pulse" aria-busy="true" />;
  }

  if (profileQuery.isError || !profile) {
    return (
      <div className="orbit-card p-6 text-sm">
        <p className="text-[var(--color-text-primary)]">Couldn&apos;t load your profile.</p>
        <Button className="mt-3" variant="secondary" onClick={() => void profileQuery.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <section className="orbit-card p-6" aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="text-base font-semibold text-[var(--color-text-primary)]">
        Profile
      </h2>

      <div className="mt-5 flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt="" /> : null}
          <AvatarFallback>{initials(profile.fullName, profile.email)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <label className="cursor-pointer">
              Change photo
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={changePhoto} />
            </label>
          </Button>
          {profile.avatarUrl ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateProfile.mutate({ avatarUrl: null }, { onError: (error) => toast.error(errorMessage(error)) })}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      <form onSubmit={save} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm text-[var(--color-text-secondary)]">
          Name
          <Input value={fullName} onChange={(event) => setFullName(event.target.value)} maxLength={120} required />
        </label>
        <label className="grid gap-1.5 text-sm text-[var(--color-text-secondary)]">
          Job title
          <Input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} maxLength={120} placeholder="Optional" />
        </label>
        <label className="grid gap-1.5 text-sm text-[var(--color-text-secondary)] sm:col-span-2">
          Email
          <Input value={profile.email} disabled />
        </label>
        <div className="flex items-center justify-between gap-3 sm:col-span-2">
          <p className="text-xs text-[var(--color-text-tertiary)]">Member since {format(new Date(profile.createdAt), "MMMM d, yyyy")}</p>
          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      toast.error("Use at least 8 characters for your new password");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    setSaving(true);
    const { error } = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
    setSaving(false);

    if (error) {
      toast.error(error.message ?? "Could not change your password");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password changed. Other devices were signed out.");
  };

  return (
    <section className="orbit-card p-6" aria-labelledby="password-heading">
      <h2 id="password-heading" className="text-base font-semibold text-[var(--color-text-primary)]">
        Password
      </h2>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        Only for accounts that sign in with email. GitHub, Google, Microsoft and Apple accounts are managed by that provider.
      </p>
      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="grid gap-1.5 text-sm text-[var(--color-text-secondary)]">
          Current password
          <Input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required />
        </label>
        <label className="grid gap-1.5 text-sm text-[var(--color-text-secondary)]">
          New password
          <Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={8} required />
        </label>
        <label className="grid gap-1.5 text-sm text-[var(--color-text-secondary)]">
          Confirm new password
          <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required />
        </label>
        <div className="flex justify-end sm:col-span-3">
          <Button type="submit" variant="secondary" disabled={saving}>
            {saving ? "Updating…" : "Update password"}
          </Button>
        </div>
      </form>
    </section>
  );
}

export default function ProfilePage() {
  const [loginEnabled, setLoginEnabled] = useState(false);

  useEffect(() => {
    fetchAuthConfig()
      .then((config) => setLoginEnabled(config.loginEnabled))
      .catch(() => setLoginEnabled(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-5 page-animate">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">Your profile</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">How you appear to people in your workspace.</p>
      </header>
      <ProfileDetails />
      {loginEnabled ? <PasswordSection /> : null}
    </div>
  );
}
