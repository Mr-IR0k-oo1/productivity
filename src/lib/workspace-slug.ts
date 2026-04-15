import { eq, like, or } from "drizzle-orm";

import { db } from "@/src/db";
import { workspaces } from "@/src/db/schema";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-") || "workspace";
}

export async function createUniqueWorkspaceSlug(input: string) {
  const baseSlug = slugify(input);
  const existing = await db
    .select({ slug: workspaces.slug })
    .from(workspaces)
    .where(or(eq(workspaces.slug, baseSlug), like(workspaces.slug, `${baseSlug}-%`)));

  const existingSlugs = new Set(existing.map((row) => row.slug));

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;

  while (existingSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}