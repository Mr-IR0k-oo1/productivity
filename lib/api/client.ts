type ApiSessionContext = {
  workspaceId?: string;
  authToken?: string | null;
  authUserId?: string | null;
};

function readErrorMessage(response: Response) {
  return response
    .clone()
    .json()
    .then((payload: unknown) => {
      if (typeof payload === "object" && payload && "error" in payload) {
        const error = (payload as { error?: unknown }).error;

        if (typeof error === "string" && error.trim()) {
          return error;
        }
      }

      return response.statusText || "Request failed";
    })
    .catch(() => response.statusText || "Request failed");
}

export function buildApiHeaders(session: ApiSessionContext, headers: HeadersInit = {}) {
  const requestHeaders = new Headers(headers);
  const authToken = session.authToken?.trim() || null;

  let authUserId = session.authUserId?.trim() || null;

  if (!authUserId && authToken) {
    try {
      const payload = authToken.split(".")[1];

      if (payload) {
        const decodedPayload = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
        const parsed = JSON.parse(decodedPayload) as { sub?: string } | null;
        authUserId = typeof parsed?.sub === "string" ? parsed.sub : null;
      }
    } catch {
      authUserId = null;
    }
  }

  if (session.workspaceId) {
    requestHeaders.set("x-workspace-id", session.workspaceId);
  }

  if (authToken) {
    requestHeaders.set("authorization", `Bearer ${authToken}`);
  }

  if (authUserId) {
    requestHeaders.set("x-auth-user-id", authUserId);
  }

  return requestHeaders;
}

export async function fetchApiJson<TResponse>(
  input: RequestInfo | URL,
  init: RequestInit & { session: ApiSessionContext },
) {
  const { session, headers, ...requestInit } = init;
  const response = await fetch(input, {
    ...requestInit,
    headers: buildApiHeaders(session, headers),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}
