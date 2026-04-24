import { ApiError } from "@/lib/queryClient";

type ApiSessionContext = {
  workspaceId?: string;
  authToken?: string | null;
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

  if (session.workspaceId) {
    requestHeaders.set("x-workspace-id", session.workspaceId);
  }

  if (session.authToken) {
    requestHeaders.set("authorization", `Bearer ${session.authToken}`);
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
    const message = await readErrorMessage(response);
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}
