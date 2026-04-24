import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Something went wrong. Please try again.";
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: false,
      retry: (failureCount, error) => {
        // Don't retry 401/403/404 — they won't change
        if (error instanceof ApiError && [401, 403, 404].includes(error.status)) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      // Global mutation error handler — fires for any mutation that doesn't
      // have its own onError. Most mutations don't need their own handler now.
      onError: (error) => {
        const msg = getErrorMessage(error);
        // Don't show toast for auth errors — the auth redirect handles those
        if (error instanceof ApiError && error.status === 401) {
          return;
        }
        toast.error(msg);
      },
    },
  },
});
