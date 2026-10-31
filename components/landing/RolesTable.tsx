import { Check } from "lucide-react";

export const roles = ["Owner", "Admin", "Member", "Viewer"] as const;
export const permissions: Array<{ label: string; allowed: Record<(typeof roles)[number], boolean> }> = [
  { label: "See issues, boards and reports", allowed: { Owner: true, Admin: true, Member: true, Viewer: true } },
  { label: "Create and edit issues", allowed: { Owner: true, Admin: true, Member: true, Viewer: false } },
  { label: "Delete other people's issues", allowed: { Owner: true, Admin: true, Member: false, Viewer: false } },
  { label: "Plan, start and complete sprints", allowed: { Owner: true, Admin: true, Member: false, Viewer: false } },
  { label: "Invite people and change roles", allowed: { Owner: true, Admin: true, Member: false, Viewer: false } },
  { label: "Delete the workspace", allowed: { Owner: true, Admin: false, Member: false, Viewer: false } },
];

/** What each workspace role can do. Mirrors src/lib/permissions.ts. */
export function RolesTable() {
  return (
    <div className="self-start overflow-x-auto rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)]">
          <table className="w-full min-w-[480px] text-sm">
            <caption className="sr-only">What each role can do</caption>
            <thead>
              <tr className="border-b border-[var(--color-border-secondary)] text-left">
                <th scope="col" className="px-4 py-3.5 font-medium text-[var(--color-text-secondary)]">
                  Permission
                </th>
                {roles.map((role) => (
                  <th key={role} scope="col" className="px-3 py-3.5 text-center font-semibold">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-secondary)]">
              {permissions.map((permission) => (
                <tr key={permission.label}>
                  <th scope="row" className="px-4 py-3.5 text-left font-normal">
                    {permission.label}
                  </th>
                  {roles.map((role) => (
                    <td key={role} className="px-3 py-3.5 text-center">
                      {permission.allowed[role] ? (
                        <Check className="mx-auto h-4 w-4 text-[var(--color-accent)]" aria-label="Allowed" />
                      ) : (
                        <span className="text-[var(--color-text-tertiary)]" aria-label="Not allowed">–</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
    </div>
  );
}
