import type { WorkspaceRole } from "@/src/lib/workspace-access";

export type AuthBindings = {
  Variables: {
    authUserId: string;
    authToken: string;
  };
};

export type WorkspaceBindings = {
  Variables: {
    authUserId: string;
    userId: string;
    workspaceId: string;
    workspaceRole: WorkspaceRole;
  };
};
