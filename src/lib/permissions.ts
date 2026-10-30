import type { WorkspaceRole } from "@/src/lib/workspace-access";

// One place that decides what each workspace role may do. Routes call `can()`;
// the UI uses the same table to hide actions a role can't take.
//
//   viewer  read everything, change nothing
//   member  create and edit work; delete only their own issues and ideas
//   admin   + manage sprints, projects, workspace settings and members
//   owner   + delete the workspace

export type Permission =
  | "write"
  | "deleteAnyIssue"
  | "manageSprints"
  | "manageProjects"
  | "manageSettings"
  | "manageMembers"
  | "deleteWorkspace";

const rank: Record<WorkspaceRole, number> = { viewer: 0, member: 1, admin: 2, owner: 3 };

const minimumRole: Record<Permission, WorkspaceRole> = {
  write: "member",
  deleteAnyIssue: "admin",
  manageSprints: "admin",
  manageProjects: "admin",
  manageSettings: "admin",
  manageMembers: "admin",
  deleteWorkspace: "owner",
};

export function can(role: WorkspaceRole | null | undefined, permission: Permission) {
  return role ? rank[role] >= rank[minimumRole[permission]] : false;
}

/** Members may delete what they created; admins and owners may delete anything. */
export function canDeleteOwned(role: WorkspaceRole | null | undefined, ownerUserId: string, actorUserId: string) {
  return can(role, "deleteAnyIssue") || (can(role, "write") && ownerUserId === actorUserId);
}

// Writes a viewer may still make: they only touch the viewer's own state.
const VIEWER_ALLOWED_WRITES = [/^\/api\/notifications(\/|$)/, /^\/api\/workspace\/switch\//];

export function isWriteAllowedForRole(role: WorkspaceRole, method: string, path: string) {
  if (["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
    return true;
  }

  return can(role, "write") || VIEWER_ALLOWED_WRITES.some((pattern) => pattern.test(path));
}
