import type { ApiKeyScope } from "@/src/lib/api-keys";
import type { WorkspaceRole } from "@/src/lib/workspace-access";

/** Set when the request authenticated with an API key instead of a session. */
export type ApiKeyContext = { id: string; workspaceId: string; scope: ApiKeyScope };

export type AuthBindings = {
  Variables: {
    authUserId: string;
    authToken: string;
    apiKey?: ApiKeyContext;
  };
};

export type WorkspaceBindings = {
  Variables: {
    authUserId: string;
    userId: string;
    workspaceId: string;
    workspaceRole: WorkspaceRole;
    apiKey?: ApiKeyContext;
  };
};
