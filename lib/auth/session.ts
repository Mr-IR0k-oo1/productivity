import { getAppUrl } from "@/lib/config/domains";

export const WORKSPACE_STORAGE_KEY = "pf-workspace-id";

export function getPublicAppUrl() {
  return getAppUrl("");
}
