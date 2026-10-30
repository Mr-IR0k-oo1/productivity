import { describe, expect, it } from "vitest";

import { can, canDeleteOwned, isWriteAllowedForRole } from "@/src/lib/permissions";

describe("can", () => {
  it("lets viewers do nothing that changes data", () => {
    expect(can("viewer", "write")).toBe(false);
    expect(can("viewer", "manageSprints")).toBe(false);
  });

  it("lets members write but not administer", () => {
    expect(can("member", "write")).toBe(true);
    expect(can("member", "manageSprints")).toBe(false);
    expect(can("member", "manageSettings")).toBe(false);
    expect(can("member", "deleteAnyIssue")).toBe(false);
  });

  it("lets admins administer but not delete the workspace", () => {
    expect(can("admin", "manageMembers")).toBe(true);
    expect(can("admin", "manageProjects")).toBe(true);
    expect(can("admin", "deleteWorkspace")).toBe(false);
  });

  it("lets owners do everything", () => {
    expect(can("owner", "deleteWorkspace")).toBe(true);
  });

  it("denies when there is no role", () => {
    expect(can(null, "write")).toBe(false);
    expect(can(undefined, "write")).toBe(false);
  });
});

describe("canDeleteOwned", () => {
  it("allows members to delete only their own items", () => {
    expect(canDeleteOwned("member", "u1", "u1")).toBe(true);
    expect(canDeleteOwned("member", "u1", "u2")).toBe(false);
  });

  it("allows admins to delete anything", () => {
    expect(canDeleteOwned("admin", "u1", "u2")).toBe(true);
  });

  it("never lets viewers delete, even their own", () => {
    expect(canDeleteOwned("viewer", "u1", "u1")).toBe(false);
  });
});

describe("isWriteAllowedForRole", () => {
  it("always allows reads", () => {
    expect(isWriteAllowedForRole("viewer", "GET", "/api/tasks")).toBe(true);
  });

  it("blocks viewer writes to workspace data", () => {
    expect(isWriteAllowedForRole("viewer", "POST", "/api/tasks")).toBe(false);
    expect(isWriteAllowedForRole("viewer", "PATCH", "/api/tasks/1")).toBe(false);
    expect(isWriteAllowedForRole("viewer", "DELETE", "/api/comments/1")).toBe(false);
  });

  it("lets viewers manage their own notifications", () => {
    expect(isWriteAllowedForRole("viewer", "POST", "/api/notifications/read-all")).toBe(true);
    expect(isWriteAllowedForRole("viewer", "POST", "/api/notificationsX")).toBe(false);
  });

  it("allows member writes", () => {
    expect(isWriteAllowedForRole("member", "POST", "/api/tasks")).toBe(true);
  });
});
