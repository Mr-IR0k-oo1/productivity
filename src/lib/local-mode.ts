// Orbit runs fully on this machine. Two independent switches:
// - Database: embedded PGlite unless DATABASE_URL points at an external Postgres.
// - Login: off (single built-in user) unless BETTER_AUTH_SECRET is set, which turns on
//   self-hosted accounts with email/password and any configured OAuth providers.

export type EnvSource = Record<string, string | undefined>;

export const LOCAL_AUTH_USER_ID = "00000000-0000-4000-8000-000000000001";
export const LOCAL_USER_EMAIL = "you@orbit.local";
export const LOCAL_WORKSPACE_SLUG = "local";

export function isLocalMode(env: EnvSource = process.env) {
  return !env.DATABASE_URL?.trim();
}

export function isLoginEnabled(env: EnvSource = process.env) {
  return Boolean(env.BETTER_AUTH_SECRET?.trim()) && env.ORBIT_DISABLE_AUTH !== "true";
}

export function isAuthBypassEnabled(env: EnvSource = process.env) {
  return !isLoginEnabled(env);
}

export function resolveDataDir(env: EnvSource = process.env) {
  return env.ORBIT_DATA_DIR?.trim() || ".orbit-data";
}
