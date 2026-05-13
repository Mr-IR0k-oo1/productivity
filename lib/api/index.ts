import { buildApiHeaders } from "@/lib/api/client";
import { ApiError } from "@/lib/queryClient";

type ApiSessionContext = {
  workspaceId?: string;
  authToken?: string | null;
};

type ApiFetchInit = RequestInit & {
  session?: ApiSessionContext;
};

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.clone().json()) as { error?: unknown };
    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    // Ignore JSON parse failures and fall back to the status text.
  }

  return response.statusText || "Request failed";
}

export async function apiFetch(input: RequestInfo | URL, init: ApiFetchInit = {}) {
  const { session = {}, headers, ...requestInit } = init;
  const response = await fetch(input, {
    credentials: "include",
    ...requestInit,
    headers: buildApiHeaders(session, headers),
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  return response;
}

export async function apiFetchJson<TResponse>(input: RequestInfo | URL, init: ApiFetchInit = {}) {
  const response = await apiFetch(input, init);

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}
