"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { WORKSPACE_STORAGE_KEY } from "@/lib/auth/session";
import { fetchApiJson } from "@/lib/api/client";
import { ApiError } from "@/lib/queryClient";
import type { WorkspaceRole } from "@/src/lib/workspace-access";

const defaultWorkspaceId = process.env.NEXT_PUBLIC_DEFAULT_WORKSPACE_ID?.trim() || "";
// Requests authenticate with the session cookie (or as the local user when login is off);
// this placeholder only marks the session as resolved for hooks that check authToken.
const cookieSessionToken = "session";

type WorkspaceListResponse = {
  data: Array<{
    id: string;
    name: string;
    slug: string;
    ownerId: string;
  }>;
};

type WorkspaceProfileResponse = {
  data: {
    workspace: {
      id: string;
      name: string;
      slug: string;
    };
    membership: {
      role: WorkspaceRole;
      isActive: boolean;
    };
  };
};

type AuthSessionResponse = {
  data: {
    authUserId: string;
  };
};

type SessionContextValue = {
  workspaceId: string;
  authToken: string | null;
  userId: string | null;
  workspaceRole: WorkspaceRole | null;
  isReady: boolean;
  /** True when login is on and there is no signed-in session. */
  needsLogin: boolean;
  setWorkspaceId: (workspaceId: string) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function readWorkspaceId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(WORKSPACE_STORAGE_KEY)?.trim() || null;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [workspaceId, setWorkspaceIdState] = useState(defaultWorkspaceId);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [workspaceRole, setWorkspaceRole] = useState<WorkspaceRole | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasResolvedInitialAuth, setHasResolvedInitialAuth] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    const storedWorkspaceId = readWorkspaceId();
    let isActive = true;

    if (storedWorkspaceId) {
      setWorkspaceIdState(storedWorkspaceId);
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== WORKSPACE_STORAGE_KEY) {
        return;
      }

      setWorkspaceIdState(event.newValue?.trim() || defaultWorkspaceId);
    };

    window.addEventListener("storage", onStorage);

    void fetchApiJson<AuthSessionResponse>("/api/auth/session", { session: {} })
      .then((payload) => {
        if (!isActive) {
          return;
        }

        const resolvedUserId = payload.data.authUserId?.trim() || null;
        setAuthToken(resolvedUserId ? cookieSessionToken : null);
        setUserId(resolvedUserId);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setAuthToken(null);
        setUserId(null);
        setNeedsLogin(error instanceof ApiError && error.status === 401);
      })
      .finally(() => {
        if (isActive) {
          setHasResolvedInitialAuth(true);
        }
      });

    return () => {
      isActive = false;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!hasResolvedInitialAuth) {
      return;
    }

    if (!authToken || !userId) {
      setWorkspaceRole(null);
      setIsReady(true);
      return;
    }

    let isActive = true;

    const resolveWorkspaceContext = async () => {
      setIsReady(false);

      const storedWorkspaceId = readWorkspaceId();
      const candidateWorkspaceId = workspaceId.trim() || storedWorkspaceId || defaultWorkspaceId;

      if (!candidateWorkspaceId) {
        try {
          const workspaceList = await fetchApiJson<WorkspaceListResponse>("/api/workspace", {
            session: { authToken },
          });

          if (!isActive) {
            return;
          }

          const firstWorkspaceId = workspaceList.data[0]?.id ?? null;

          if (firstWorkspaceId) {
            setWorkspaceIdState(firstWorkspaceId);

            if (typeof window !== "undefined") {
              window.localStorage.setItem(WORKSPACE_STORAGE_KEY, firstWorkspaceId);
            }

            return;
          }

          setWorkspaceRole(null);
          setIsReady(true);
          return;
        } catch {
          if (isActive) {
            setWorkspaceRole(null);
            setIsReady(true);
          }

          return;
        }
      }

      try {
        const payload = await fetchApiJson<WorkspaceProfileResponse>("/api/workspace/me", {
          session: { workspaceId: candidateWorkspaceId, authToken },
        });

        if (!isActive) {
          return;
        }

        setWorkspaceRole(payload.data.membership.role);

        if (payload.data.workspace.id !== workspaceId) {
          setWorkspaceIdState(payload.data.workspace.id);
        }

        if (typeof window !== "undefined") {
          window.localStorage.setItem(WORKSPACE_STORAGE_KEY, payload.data.workspace.id);
        }

        setIsReady(true);
      } catch (error) {
        if (!isActive) {
          return;
        }

        const message = error instanceof Error ? error.message : "";

        if (
          message.includes("Workspace not found") ||
          message.includes("Workspace membership required") ||
          message.includes("No access to workspace") ||
          message.includes("Workspace id is required")
        ) {
          try {
            const workspaceList = await fetchApiJson<WorkspaceListResponse>("/api/workspace", {
              session: { authToken },
            });

            if (!isActive) {
              return;
            }

            const fallbackWorkspaceId = workspaceList.data[0]?.id ?? null;

            if (fallbackWorkspaceId && fallbackWorkspaceId !== candidateWorkspaceId) {
              setWorkspaceIdState(fallbackWorkspaceId);

              if (typeof window !== "undefined") {
                window.localStorage.setItem(WORKSPACE_STORAGE_KEY, fallbackWorkspaceId);
              }

              return;
            }
          } catch {
            // fall through to ready state below.
          }
        }

        setWorkspaceRole(null);
        setIsReady(true);
      }
    };

    void resolveWorkspaceContext();

    return () => {
      isActive = false;
    };
  }, [authToken, hasResolvedInitialAuth, userId, workspaceId]);

  useEffect(() => {
    if (!isReady || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId);
  }, [isReady, workspaceId]);

  const value = useMemo<SessionContextValue>(
    () => ({
      workspaceId,
      authToken,
      userId,
      workspaceRole,
      isReady,
      needsLogin,
      setWorkspaceId: (nextWorkspaceId: string) => {
        setWorkspaceIdState(nextWorkspaceId.trim() || defaultWorkspaceId);
      },
    }),
    [authToken, isReady, needsLogin, userId, workspaceId, workspaceRole],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionContext() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }

  return context;
}
