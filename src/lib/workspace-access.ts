export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export function isPrivilegedWorkspaceRole(role: WorkspaceRole | null | undefined): role is "owner" | "admin" {
  return role === "owner" || role === "admin";
}

export function canManageWorkspaceMember(actorRole: WorkspaceRole | null | undefined) {
  return isPrivilegedWorkspaceRole(actorRole);
}

export function canAddWorkspaceMember(actorRole: WorkspaceRole | null | undefined, requestedRole: WorkspaceRole) {
  if (actorRole === "owner") {
    return true;
  }

  if (actorRole === "admin") {
    return requestedRole !== "owner";
  }

  return false;
}

export function canUpdateWorkspaceMemberRole(
  actorRole: WorkspaceRole | null | undefined,
  targetRole: WorkspaceRole,
  requestedRole: WorkspaceRole,
) {
  if (targetRole === "owner" && requestedRole !== "owner") {
    return false;
  }

  if (actorRole === "owner") {
    return true;
  }

  if (actorRole === "admin") {
    return requestedRole !== "owner";
  }

  return false;
}

export function canDeactivateWorkspaceMember(
  actorRole: WorkspaceRole | null | undefined,
  targetRole: WorkspaceRole,
  actorUserId: string,
  targetUserId: string,
) {
  if (actorUserId === targetUserId) {
    return false;
  }

  if (targetRole === "owner") {
    return false;
  }

  if (actorRole === "owner") {
    return true;
  }

  if (actorRole === "admin") {
    return true;
  }

  return false;
}

export function canDeleteWorkspace(actorRole: WorkspaceRole | null | undefined) {
  return actorRole === "owner";
}