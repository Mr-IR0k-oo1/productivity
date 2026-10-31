import path from "node:path";
import { mkdirSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { Pool } from "pg";

import { env } from "@/src/types/env";
import * as schema from "@/src/db/schema";
import {
  LOCAL_AUTH_USER_ID,
  LOCAL_USER_EMAIL,
  LOCAL_WORKSPACE_SLUG,
  isLocalMode,
  resolveDataDir,
} from "@/src/lib/local-mode";

type Database = NodePgDatabase<typeof schema>;

function createLocalDatabase() {
  const dataDir = path.resolve(resolveDataDir());
  mkdirSync(dataDir, { recursive: true });

  const client = new PGlite(path.join(dataDir, "pgdata"));
  // Both drivers expose the same Drizzle query builder; only the session class differs.
  const localDb = drizzlePglite(client, { schema }) as unknown as Database;

  const ready = (async () => {
    await migratePglite(drizzlePglite(client, { schema }), {
      migrationsFolder: path.resolve("drizzle"),
    });
    await seedLocalWorkspace(localDb);
    console.log(`[Orbit] Local database ready at ${dataDir}`);
  })();

  return { db: localDb, ready };
}

export async function seedLocalWorkspace(database: Database) {
  // Only a brand-new database gets the built-in user. If accounts already exist (for example
  // login was on and has been switched off again), single-user mode reuses the first of them.
  const [existing] = await database.select({ id: schema.users.id }).from(schema.users).limit(1);

  if (existing) {
    return existing.id;
  }

  return database.transaction(async (tx) => {
    const [user] = await tx
      .insert(schema.users)
      .values({ authUserId: LOCAL_AUTH_USER_ID, email: LOCAL_USER_EMAIL, fullName: "You" })
      .returning({ id: schema.users.id });

    const [workspace] = await tx
      .insert(schema.workspaces)
      .values({ name: "My Workspace", slug: LOCAL_WORKSPACE_SLUG, ownerId: user.id })
      .returning({ id: schema.workspaces.id });

    await tx.insert(schema.workspaceMembers).values({ workspaceId: workspace.id, userId: user.id, role: "owner" });
    await tx.insert(schema.workspaceSettings).values({ workspaceId: workspace.id });

    return user.id;
  });
}

function createRemoteDatabase(connectionString: string) {
  const pool = new Pool({ connectionString });
  return { db: drizzlePg(pool, { schema }), ready: Promise.resolve() };
}

const connection = isLocalMode() || !env.DATABASE_URL
  ? createLocalDatabase()
  : createRemoteDatabase(env.DATABASE_URL);

export const db = connection.db;

/** Resolves once migrations and the local seed have run. Await before serving requests. */
export const dbReady = connection.ready;
