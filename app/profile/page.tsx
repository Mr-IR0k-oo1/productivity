"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Lock,
  Bell,
  Eye,
  Shield,
  Copy,
  Download,
  RefreshCw,
  Eye as EyeIcon,
  EyeOff,
  LogOut,
  User as UserIcon,
  Settings,
  Eye as EyePrivacyIcon,
} from "lucide-react";

import { supabaseClient as supabase } from "@/lib/supabase/client";
import { useSessionContext } from "@/components/providers/SessionProvider";

const TIMEZONES = [
  "UTC",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Pacific/Auckland",
  "Australia/Sydney",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
];

interface ProfileData {
  full_name: string;
  job_title: string;
  bio: string;
  avatar_url: string;
  timezone: string;
  phone: string;
  location: string;
  department: string;
  socialLinks: {
    website?: string;
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
  notificationPreferences?: {
    emailEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
    digestFrequency: "daily" | "weekly" | "never";
    importantOnly: boolean;
  };
  privacySettings?: {
    profileVisibility: "private" | "workspace" | "public";
    analyticsTracking: boolean;
    shareWithIntegrations: boolean;
    searchable: boolean;
    showActivityStatus: boolean;
    emailVisibility: "private" | "workspace" | "public";
    phoneVisibility: "private" | "workspace" | "public";
  };
}

interface UserTimestamps {
  createdAt?: string;
  updatedAt?: string;
}

type VisibilitySetting = "private" | "workspace" | "public";
type DigestFrequencySetting = "daily" | "weekly" | "never";

function calculateProfileCompletion(profile: Partial<ProfileData>): number {
  const fields = [
    { key: "full_name", weight: 20 },
    { key: "job_title", weight: 10 },
    { key: "bio", weight: 10 },
    { key: "avatar_url", weight: 10 },
    { key: "timezone", weight: 2 },
    { key: "phone", weight: 2 },
    { key: "location", weight: 2 },
    { key: "department", weight: 2 },
  ];

  let totalWeight = 0;
  let filledWeight = 0;

  fields.forEach((field) => {
    totalWeight += field.weight;
    const value = profile[field.key as keyof Partial<ProfileData>];
    if (value && value !== "") {
      filledWeight += field.weight;
    }
  });

  const socialLinks = profile.socialLinks || {};
  const filledSocialLinks = Object.values(socialLinks).filter(
    (v) => v && v !== ""
  ).length;
  totalWeight += 8;
  filledWeight += Math.min(filledSocialLinks * 2, 8);

  return Math.round((filledWeight / totalWeight) * 100);
}

function getCompletionColor(percentage: number): string {
  if (percentage >= 80) return "bg-emerald-500/20 border-emerald-500/40";
  if (percentage >= 50) return "bg-amber-500/20 border-amber-500/40";
  return "bg-rose-500/20 border-rose-500/40";
}

function getCompletionTextColor(percentage: number): string {
  if (percentage >= 80) return "text-emerald-400";
  if (percentage >= 50) return "text-amber-400";
  return "text-rose-400";
}

type TabType = "basic" | "security" | "privacy" | "preferences";

export default function UserProfilePage() {
  const router = useRouter();
  const { userId } = useSessionContext();
  const supabaseClient = supabase;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [timestamps, setTimestamps] = useState<UserTimestamps>({});
  const [activeTab, setActiveTab] = useState<TabType>("basic");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showTwoFAModal, setShowTwoFAModal] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [twoFAData, setTwoFAData] = useState({
    enabled: false,
    secret: "",
    qrCode: "",
    verificationCode: "",
    recoveryCodes: [] as string[],
  });

  const [formData, setFormData] = useState<ProfileData>({
    full_name: "",
    job_title: "",
    bio: "",
    avatar_url: "",
    timezone: "UTC",
    phone: "",
    location: "",
    department: "",
    socialLinks: {
      website: "",
      linkedin: "",
      github: "",
      twitter: "",
    },
    notificationPreferences: {
      emailEnabled: true,
      pushEnabled: false,
      inAppEnabled: true,
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
      digestFrequency: "weekly",
      importantOnly: false,
    },
    privacySettings: {
      profileVisibility: "workspace",
      analyticsTracking: true,
      shareWithIntegrations: false,
      searchable: true,
      showActivityStatus: true,
      emailVisibility: "private",
      phoneVisibility: "private",
    },
  });

  const completionPercentage = calculateProfileCompletion(formData);

  useEffect(() => {
    if (!userId || !supabaseClient) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const [{ data: profileData }, { data: userData }] = await Promise.all([
          supabaseClient.from("profiles").select("*").eq("id", userId).single(),
          supabaseClient.from("users").select("*").eq("id", userId).single(),
        ]);

        if (profileData) {
          setFormData((prev) => ({
            ...prev,
            full_name: profileData.full_name || "",
            job_title: profileData.job_title || "",
            bio: profileData.bio || "",
            avatar_url: profileData.avatar_url || "",
            timezone: profileData.timezone || "UTC",
            phone: profileData.phone || "",
            location: profileData.location || "",
            department: profileData.department || "",
            socialLinks: profileData.socialLinks || {
              website: "",
              linkedin: "",
              github: "",
              twitter: "",
            },
            notificationPreferences: profileData.notificationPreferences || prev.notificationPreferences,
            privacySettings: profileData.privacySettings || prev.privacySettings,
          }));

          setTwoFAData((prev) => ({
            ...prev,
            enabled: profileData.twoFactorEnabled || false,
          }));
        }

        if (userData) {
          setTimestamps({
            createdAt: userData.created_at,
            updatedAt: userData.updated_at,
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, supabaseClient]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setMessage({ type: "error", text: "Only PNG and JPG images are allowed" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image must be smaller than 5MB" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatarPreview(base64);
      setFormData((prev) => ({ ...prev, avatar_url: base64 }));
      setMessage({ type: "success", text: "Image uploaded. Click Save to confirm." });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!userId || !supabaseClient) return;

    setSaving(true);
    try {
      const { error } = await supabaseClient.from("profiles").upsert({
        id: userId,
        ...formData,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        setMessage({ type: "error", text: "Failed to update profile" });
      } else {
        setMessage({ type: "success", text: "Profile updated successfully" });
        setAvatarPreview(null);
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }

    if (!supabaseClient) return;

    setSaving(true);
    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) {
        setMessage({ type: "error", text: error.message || "Failed to update password" });
      } else {
        setMessage({ type: "success", text: "Password updated successfully" });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setShowPasswordForm(false);
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update password" });
    } finally {
      setSaving(false);
    }
  };

  const generateRecoveryCodes = (): string[] => {
    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  };

  const handleEnable2FA = () => {
    const secret = Math.random().toString(36).substring(2, 15);
    const codes = generateRecoveryCodes();
    setTwoFAData({
      enabled: true,
      secret,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=otpauth://totp/Orbit:you@example.com?secret=${secret}`,
      verificationCode: "",
      recoveryCodes: codes,
    });
  };

  const downloadRecoveryCodes = () => {
    const text = `Recovery Codes for 2FA\n\nKeep these codes safe. Each code can be used once to recover your account if you lose access to your authenticator app.\n\n${twoFAData.recoveryCodes.join("\n")}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orbit-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyRecoveryCodes = () => {
    const text = twoFAData.recoveryCodes.join("\n");
    navigator.clipboard.writeText(text);
    setMessage({ type: "success", text: "Recovery codes copied to clipboard" });
  };

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center rounded-3xl border border-[color:var(--card-border)] bg-[var(--surface)] p-8 text-center text-[var(--muted)]">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="page-animate">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header with Profile Completion */}
        <section className="rounded-3xl border border-[color:var(--card-border)] bg-[var(--surface)] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl">
          <div className="mb-6 space-y-2">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">User Profile</p>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">My Profile</h1>
            <p className="text-sm text-[var(--muted)]">Update your personal information, security, and preferences.</p>
          </div>

          {/* Profile Completion */}
          <div className={`space-y-3 rounded-2xl border p-4 ${getCompletionColor(completionPercentage)}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">Profile Completion</p>
                <p className={`text-xs ${getCompletionTextColor(completionPercentage)}`}>
                  {completionPercentage}% complete
                </p>
              </div>
              {completionPercentage >= 80 && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-strong)]">
              <div
                className={`h-full transition-all duration-300 ${
                  completionPercentage >= 80
                    ? "bg-emerald-500"
                    : completionPercentage >= 50
                      ? "bg-amber-500"
                      : "bg-rose-500"
                }`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Account Info */}
          {timestamps.createdAt && (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Created</p>
                <p className="mt-1 font-medium text-[var(--foreground)]">
                  {new Date(timestamps.createdAt).toLocaleDateString()}
                </p>
              </div>
              {timestamps.updatedAt && (
                <div className="rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Last Updated</p>
                  <p className="mt-1 font-medium text-[var(--foreground)]">
                    {new Date(timestamps.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div className="rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Email</p>
                <p className="mt-1 truncate font-medium text-[var(--foreground)]">you@example.com</p>
              </div>
            </div>
          )}
        </section>

        {/* Message Banner */}
        {message && (
          <div
            className={`flex items-center gap-3 rounded-2xl border p-4 ${
              message.type === "success"
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-rose-500/40 bg-rose-500/10"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-400" />
            )}
            <p
              className={`text-sm ${
                message.type === "success" ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="rounded-3xl border border-[color:var(--card-border)] bg-[var(--surface)] shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl">
          <div className="flex border-b border-[color:var(--card-border)]">
            {[
              { id: "basic" as TabType, label: "Basic Info", Icon: UserIcon },
              { id: "security" as TabType, label: "Security", Icon: Lock },
              { id: "privacy" as TabType, label: "Privacy", Icon: EyePrivacyIcon },
              { id: "preferences" as TabType, label: "Preferences", Icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <tab.Icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-8">
            {/* Basic Info Tab */}
            {activeTab === "basic" && (
              <div className="space-y-8">
                {/* Avatar Section */}
                <div>
                  <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">Profile Photo</h2>
                  <div className="flex flex-col items-center gap-6 md:flex-row">
                    <div className="flex-shrink-0">
                      <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-[var(--surface-strong)] text-6xl font-medium text-[var(--foreground)] overflow-hidden">
                        {formData.avatar_url ? (
                          <img src={formData.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          formData.full_name?.charAt(0)?.toUpperCase() || "U"
                        )}
                      </div>
                    </div>

                    <div className="flex-1 rounded-2xl border-2 border-dashed border-[color:var(--card-border)] bg-[var(--surface-strong)] p-6 text-center transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]">
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={handleAvatarChange}
                        className="hidden"
                        id="avatar-input"
                      />
                      <label htmlFor="avatar-input" className="cursor-pointer">
                        <Camera className="mx-auto mb-3 h-8 w-8 text-[var(--muted)]" />
                        <p className="text-sm font-medium text-[var(--foreground)]">Drag & drop your image</p>
                        <p className="text-xs text-[var(--muted)]">or click to select</p>
                        <p className="mt-2 text-xs text-[var(--muted)]">PNG or JPG, max 5MB</p>
                      </label>
                    </div>

                    {formData.avatar_url && (
                      <button
                        onClick={() => setFormData((prev) => ({ ...prev, avatar_url: "" }))}
                        className="flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-2 text-sm text-rose-400 transition-colors hover:bg-rose-500/20"
                        type="button"
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Basic Info Fields */}
                <div className="space-y-4 border-t border-[color:var(--card-border)] pt-8">
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">Basic Information</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--muted)]">Full Name *</label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                        }
                        className="w-full rounded-xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--muted)]">Job Title</label>
                      <input
                        type="text"
                        value={formData.job_title}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, job_title: e.target.value }))
                        }
                        className="w-full rounded-xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        placeholder="e.g., Product Manager"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--muted)]">Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                      className="h-24 w-full rounded-xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--muted)]">Timezone</label>
                      <select
                        value={formData.timezone}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, timezone: e.target.value }))
                        }
                        className="w-full rounded-xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-4 py-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz} value={tz}>
                            {tz}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--muted)]">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                        className="w-full rounded-xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--muted)]">Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, location: e.target.value }))
                        }
                        className="w-full rounded-xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        placeholder="City, Country"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--muted)]">Department</label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, department: e.target.value }))
                        }
                        className="w-full rounded-xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        placeholder="e.g., Engineering"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="space-y-4 border-t border-[color:var(--card-border)] pt-8">
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">Social Links</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      { key: "website", label: "Website", placeholder: "https://yourwebsite.com" },
                      { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
                      { key: "github", label: "GitHub", placeholder: "https://github.com/username" },
                      { key: "twitter", label: "Twitter/X", placeholder: "https://twitter.com/username" },
                    ].map((social) => (
                      <div key={social.key}>
                        <label className="mb-2 block text-sm font-medium text-[var(--muted)]">{social.label}</label>
                        <input
                          type="url"
                          value={
                            formData.socialLinks[
                              social.key as keyof typeof formData.socialLinks
                            ] || ""
                          }
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              socialLinks: {
                                ...prev.socialLinks,
                                [social.key]: e.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                          placeholder={social.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <div className="border-t border-[color:var(--card-border)] pt-8">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-6 py-3.5 font-medium text-[var(--background)] transition-colors hover:bg-[var(--accent-strong)] disabled:opacity-70"
                  >
                    <Save className="h-5 w-5" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                {/* Password Change Section */}
                <div className="space-y-4 rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--foreground)]">Password</h3>
                      <p className="text-sm text-[var(--muted)]">Change your account password</p>
                    </div>
                    {!showPasswordForm && (
                      <button
                        onClick={() => setShowPasswordForm(true)}
                        className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--background)] transition-colors hover:bg-[var(--accent-strong)]"
                        type="button"
                      >
                        Change Password
                      </button>
                    )}
                  </div>

                  {showPasswordForm && (
                    <div className="space-y-4 border-t border-[color:var(--card-border)] pt-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[var(--muted)]">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswordField ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                              setPasswordForm((prev) => ({
                                ...prev,
                                newPassword: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-[color:var(--card-border)] bg-[var(--background)] px-4 py-3 pr-10 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                            placeholder="At least 8 characters"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswordField(!showPasswordField)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                          >
                            {showPasswordField ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-[var(--muted)]">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              confirmPassword: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-[color:var(--card-border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handlePasswordChange}
                          disabled={saving}
                          type="button"
                          className="flex items-center gap-2 rounded-xl bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/30 disabled:opacity-70"
                        >
                          {saving ? "Updating..." : "Update Password"}
                        </button>
                        <button
                          onClick={() => setShowPasswordForm(false)}
                          type="button"
                          className="rounded-xl bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2FA Section */}
                <div className="space-y-4 rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--foreground)]">Two-Factor Authentication</h3>
                      <p className="text-sm text-[var(--muted)]">
                        {twoFAData.enabled ? "Enabled - Secured with 2FA" : "Add an extra layer of security"}
                      </p>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        twoFAData.enabled
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {twoFAData.enabled ? "Enabled" : "Disabled"}
                    </div>
                  </div>

                  {twoFAData.enabled && twoFAData.recoveryCodes.length > 0 && (
                    <div className="space-y-3 border-t border-[color:var(--card-border)] pt-4">
                      <div>
                        <p className="mb-2 text-sm font-medium text-[var(--foreground)]">Recovery Codes</p>
                        <p className="mb-3 text-xs text-[var(--muted)]">
                          Keep these codes safe. Use them if you lose access to your authenticator.
                        </p>
                        <div className="max-h-32 overflow-y-auto rounded-xl bg-[var(--background)] p-4 font-mono text-sm text-[var(--muted)]">
                          {twoFAData.recoveryCodes.map((code, idx) => (
                            <div key={idx}>{code}</div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={copyRecoveryCodes}
                          type="button"
                          className="flex items-center gap-2 rounded-xl bg-blue-500/20 px-3 py-2 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/30"
                        >
                          <Copy className="h-3 w-3" />
                          Copy
                        </button>
                        <button
                          onClick={downloadRecoveryCodes}
                          type="button"
                          className="flex items-center gap-2 rounded-xl bg-blue-500/20 px-3 py-2 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/30"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </button>
                      </div>
                    </div>
                  )}

                  {!twoFAData.enabled ? (
                    <button
                      onClick={handleEnable2FA}
                      type="button"
                      className="mt-4 w-full rounded-xl bg-emerald-500/20 px-4 py-2 font-medium text-emerald-400 transition-colors hover:bg-emerald-500/30"
                    >
                      Enable 2FA
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setTwoFAData({
                          enabled: false,
                          secret: "",
                          qrCode: "",
                          verificationCode: "",
                          recoveryCodes: [],
                        });
                        setMessage({ type: "success", text: "2FA disabled" });
                      }}
                      type="button"
                      className="mt-4 w-full rounded-xl bg-rose-500/20 px-4 py-2 font-medium text-rose-400 transition-colors hover:bg-rose-500/30"
                    >
                      Disable 2FA
                    </button>
                  )}
                </div>

                {/* Session Info */}
                <div className="space-y-4 rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] p-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">Active Sessions</h3>
                    <p className="text-sm text-[var(--muted)]">This session is active on this device</p>
                  </div>

                  <div className="space-y-3 border-t border-[color:var(--card-border)] pt-4">
                    <div className="rounded-xl bg-[var(--background)] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-[var(--foreground)]">This Browser</p>
                          <p className="text-xs text-[var(--muted)]">Signed in {new Date().toLocaleDateString()}</p>
                        </div>
                        <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-400">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === "privacy" && (
              <div className="space-y-6">
                {/* Profile Visibility */}
                <div className="space-y-4 rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] p-6">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Profile Visibility</h3>
                  <div className="space-y-3">
                    {[
                      { value: "private", label: "Private", desc: "Only you can see this profile" },
                      { value: "workspace", label: "Workspace", desc: "Visible to workspace members" },
                      { value: "public", label: "Public", desc: "Visible to anyone with the link" },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className="flex items-start gap-3 rounded-xl border border-[color:var(--card-border)] bg-[var(--background)] p-4 cursor-pointer transition-colors hover:bg-[var(--surface-strong)]"
                      >
                        <input
                          type="radio"
                          name="profileVisibility"
                          value={option.value}
                          checked={
                            formData.privacySettings?.profileVisibility === option.value
                          }
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              privacySettings: {
                                ...prev.privacySettings!,
                                profileVisibility: e.target.value as VisibilitySetting,
                              },
                            }))
                          }
                          className="mt-1"
                        />
                        <div>
                          <p className="font-medium text-[var(--foreground)]">{option.label}</p>
                          <p className="text-xs text-[var(--muted)]">{option.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Data Sharing */}
                <div className="space-y-4 rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] p-6">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Data & Integrations</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 rounded-xl border border-[color:var(--card-border)] bg-[var(--background)] p-4 cursor-pointer transition-colors hover:bg-[var(--surface-strong)]">
                      <input
                        type="checkbox"
                        checked={formData.privacySettings?.analyticsTracking || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            privacySettings: {
                              ...prev.privacySettings!,
                              analyticsTracking: e.target.checked,
                            },
                          }))
                        }
                        className="h-4 w-4 rounded accent-[var(--accent)]"
                      />
                      <div>
                        <p className="font-medium text-[var(--foreground)]">Analytics Tracking</p>
                        <p className="text-xs text-[var(--muted)]">Help us improve Orbit with usage data</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 rounded-xl border border-[color:var(--card-border)] bg-[var(--background)] p-4 cursor-pointer transition-colors hover:bg-[var(--surface-strong)]">
                      <input
                        type="checkbox"
                        checked={formData.privacySettings?.shareWithIntegrations || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            privacySettings: {
                              ...prev.privacySettings!,
                              shareWithIntegrations: e.target.checked,
                            },
                          }))
                        }
                        className="h-4 w-4 rounded accent-[var(--accent)]"
                      />
                      <div>
                        <p className="font-medium text-[var(--foreground)]">Share with Integrations</p>
                        <p className="text-xs text-[var(--muted)]">Allow connected apps to access your profile</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Discovery Settings */}
                <div className="space-y-4 rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] p-6">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Discovery</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 rounded-xl border border-[color:var(--card-border)] bg-[var(--background)] p-4 cursor-pointer transition-colors hover:bg-[var(--surface-strong)]">
                      <input
                        type="checkbox"
                        checked={formData.privacySettings?.searchable || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            privacySettings: {
                              ...prev.privacySettings!,
                              searchable: e.target.checked,
                            },
                          }))
                        }
                        className="h-4 w-4 rounded accent-[var(--accent)]"
                      />
                      <div>
                        <p className="font-medium text-[var(--foreground)]">Searchable Profile</p>
                        <p className="text-xs text-[var(--muted)]">Allow others to find you in search</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 rounded-xl border border-[color:var(--card-border)] bg-[var(--background)] p-4 cursor-pointer transition-colors hover:bg-[var(--surface-strong)]">
                      <input
                        type="checkbox"
                        checked={formData.privacySettings?.showActivityStatus || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            privacySettings: {
                              ...prev.privacySettings!,
                              showActivityStatus: e.target.checked,
                            },
                          }))
                        }
                        className="h-4 w-4 rounded accent-[var(--accent)]"
                      />
                      <div>
                        <p className="font-medium text-[var(--foreground)]">Show Activity Status</p>
                        <p className="text-xs text-[var(--muted)]">Let others see when you&apos;re online</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Contact Visibility */}
                <div className="space-y-4 rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] p-6">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Contact Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--muted)]">Email Visibility</label>
                      <select
                        value={formData.privacySettings?.emailVisibility || "private"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            privacySettings: {
                              ...prev.privacySettings!,
                              emailVisibility: e.target.value as VisibilitySetting,
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-[color:var(--card-border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      >
                        <option value="private">Private (Only me)</option>
                        <option value="workspace">Workspace members</option>
                        <option value="public">Public</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--muted)]">Phone Visibility</label>
                      <select
                        value={formData.privacySettings?.phoneVisibility || "private"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            privacySettings: {
                              ...prev.privacySettings!,
                              phoneVisibility: e.target.value as VisibilitySetting,
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-[color:var(--card-border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      >
                        <option value="private">Private (Only me)</option>
                        <option value="workspace">Workspace members</option>
                        <option value="public">Public</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-6 py-3.5 font-medium text-[var(--background)] transition-colors hover:bg-[var(--accent-strong)] disabled:opacity-70"
                  >
                    <Save className="h-5 w-5" />
                    {saving ? "Saving..." : "Save Privacy Settings"}
                  </button>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && (
              <div className="space-y-6">
                {/* Notification Preferences */}
                <div className="space-y-4 rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] p-6">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Notification Channels</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 rounded-xl border border-[color:var(--card-border)] bg-[var(--background)] p-4 cursor-pointer transition-colors hover:bg-[var(--surface-strong)]">
                      <input
                        type="checkbox"
                        checked={
                          formData.notificationPreferences?.emailEnabled || false
                        }
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            notificationPreferences: {
                              ...prev.notificationPreferences!,
                              emailEnabled: e.target.checked,
                            },
                          }))
                        }
                        className="h-4 w-4 rounded accent-[var(--accent)]"
                      />
                      <div>
                        <p className="font-medium text-[var(--foreground)]">Email Notifications</p>
                        <p className="text-xs text-[var(--muted)]">Receive updates via email</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 rounded-xl border border-[color:var(--card-border)] bg-[var(--background)] p-4 cursor-pointer transition-colors hover:bg-[var(--surface-strong)]">
                      <input
                        type="checkbox"
                        checked={formData.notificationPreferences?.pushEnabled || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            notificationPreferences: {
                              ...prev.notificationPreferences!,
                              pushEnabled: e.target.checked,
                            },
                          }))
                        }
                        className="h-4 w-4 rounded accent-[var(--accent)]"
                      />
                      <div>
                        <p className="font-medium text-[var(--foreground)]">Push Notifications</p>
                        <p className="text-xs text-[var(--muted)]">Get instant browser alerts</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 rounded-xl border border-[color:var(--card-border)] bg-[var(--background)] p-4 cursor-pointer transition-colors hover:bg-[var(--surface-strong)]">
                      <input
                        type="checkbox"
                        checked={formData.notificationPreferences?.inAppEnabled || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            notificationPreferences: {
                              ...prev.notificationPreferences!,
                              inAppEnabled: e.target.checked,
                            },
                          }))
                        }
                        className="h-4 w-4 rounded accent-[var(--accent)]"
                      />
                      <div>
                        <p className="font-medium text-[var(--foreground)]">In-App Notifications</p>
                        <p className="text-xs text-[var(--muted)]">See notifications in app</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Notification Digest */}
                <div className="space-y-4 rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] p-6">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Digest & Summary</h3>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--muted)]">Digest Frequency</label>
                    <select
                      value={formData.notificationPreferences?.digestFrequency || "weekly"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences!,
                            digestFrequency: e.target.value as DigestFrequencySetting,
                          },
                        }))
                      }
                      className="w-full rounded-xl border border-[color:var(--card-border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    >
                      <option value="daily">Daily digest</option>
                      <option value="weekly">Weekly digest</option>
                      <option value="never">No digest</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-3 rounded-xl border border-[color:var(--card-border)] bg-[var(--background)] p-4 cursor-pointer transition-colors hover:bg-[var(--surface-strong)]">
                    <input
                      type="checkbox"
                      checked={formData.notificationPreferences?.importantOnly || false}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences!,
                            importantOnly: e.target.checked,
                          },
                        }))
                      }
                      className="h-4 w-4 rounded accent-[var(--accent)]"
                    />
                    <div>
                      <p className="font-medium text-[var(--foreground)]">Important Only</p>
                      <p className="text-xs text-[var(--muted)]">Only get notified for urgent messages</p>
                    </div>
                  </label>
                </div>

                {/* Quiet Hours */}
                <div className="space-y-4 rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] p-6">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Quiet Hours</h3>
                  <p className="text-sm text-[var(--muted)]">Notifications won&apos;t be sent during these hours</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--muted)]">Start Time</label>
                      <input
                        type="time"
                        value={formData.notificationPreferences?.quietHoursStart || "22:00"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            notificationPreferences: {
                              ...prev.notificationPreferences!,
                              quietHoursStart: e.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-[color:var(--card-border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--muted)]">End Time</label>
                      <input
                        type="time"
                        value={formData.notificationPreferences?.quietHoursEnd || "08:00"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            notificationPreferences: {
                              ...prev.notificationPreferences!,
                              quietHoursEnd: e.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-[color:var(--card-border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-6 py-3.5 font-medium text-[var(--background)] transition-colors hover:bg-[var(--accent-strong)] disabled:opacity-70"
                  >
                    <Save className="h-5 w-5" />
                    {saving ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
