// Orbit runs as a single built-in user with no login. The database is embedded PGlite
// unless DATABASE_URL points at an external Postgres.

export type EnvSource = Record<string, string | undefined>;

export const LOCAL_AUTH_USER_ID = "00000000-0000-4000-8000-000000000001";
export const LOCAL_USER_EMAIL = "you@orbit.local";
export const LOCAL_WORKSPACE_SLUG = "local";

export function isLocalMode(env: EnvSource = process.env) {
  return !env.DATABASE_URL?.trim();
}

export function resolveDataDir(env: EnvSource = process.env) {
  return env.ORBIT_DATA_DIR?.trim() || ".orbit-data";
}
