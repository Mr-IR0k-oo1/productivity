import { toast } from "sonner";
import { ApiError } from "./queryClient";

export function handleError(error: unknown, fallback = "Something went wrong.") {
  console.error(error);

  if (error instanceof ApiError) {
    if (error.status === 401) {
      toast.error("Your session has expired. Please log in again.");
      // Optionally redirect: window.location.href = "/login";
      return;
    }
    if (error.status === 403) {
      toast.error("You don't have permission to do that.");
      return;
    }
    if (error.status === 404) {
      toast.error("Not found.");
      return;
    }
    toast.error(error.message);
    return;
  }

  if (error instanceof Error) {
    toast.error(error.message || fallback);
    return;
  }

  toast.error(fallback);
}
