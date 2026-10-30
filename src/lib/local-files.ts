import path from "node:path";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";

import { resolveDataDir } from "@/src/lib/local-mode";

// Storage keys look like `flowcharts/<flowchartId>/<fileId>.webp`. Anything else is rejected,
// which keeps reads and deletes inside the uploads folder.
const STORAGE_KEY_PATTERN = /^flowcharts\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/i;

export function isValidStorageKey(storageKey: string) {
  return STORAGE_KEY_PATTERN.test(storageKey);
}

function resolveStoragePath(storageKey: string) {
  if (!isValidStorageKey(storageKey)) {
    throw new Error(`Invalid storage key: ${storageKey}`);
  }

  return path.resolve(resolveDataDir(), "uploads", ...storageKey.split("/"));
}

export async function saveLocalFile(storageKey: string, contents: Buffer) {
  const filePath = resolveStoragePath(storageKey);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents);
}

export async function readLocalFile(storageKey: string) {
  return readFile(resolveStoragePath(storageKey));
}

export async function deleteLocalFile(storageKey: string) {
  await rm(resolveStoragePath(storageKey), { force: true });
}

export function localFileUrl(storageKey: string) {
  return `/api/flowcharts/files/${encodeURIComponent(storageKey)}`;
}
