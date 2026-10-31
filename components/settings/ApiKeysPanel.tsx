"use client";

import { type FormEvent, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { Check, Copy, KeyRound } from "lucide-react";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  type ApiKeyDTO,
  type ApiKeyScope,
  type CreateApiKeyInput,
  useApiKeysQuery,
  useCreateApiKeyMutation,
  useRevokeApiKeyMutation,
} from "@/hooks/useApiKeys";

function keyStatus(key: ApiKeyDTO): { label: string; tone: "ok" | "off" } {
  if (key.revokedAt) return { label: "Revoked", tone: "off" };
  if (key.expiresAt && new Date(key.expiresAt).getTime() <= Date.now()) return { label: "Expired", tone: "off" };
  return { label: "Active", tone: "ok" };
}

function describeDate(value: string | null, empty: string) {
  if (!value) return empty;
  return formatDistanceToNowStrict(new Date(value), { addSuffix: true });
}

function CreateKeyDialog({ onClose, canWrite }: { onClose: () => void; canWrite: boolean }) {
  const createKey = useCreateApiKeyMutation();
  const [name, setName] = useState("");
  const [scope, setScope] = useState<ApiKeyScope>("read");
  const [expiresInDays, setExpiresInDays] = useState<CreateApiKeyInput["expiresInDays"]>(90);
  const [created, setCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const result = await createKey.mutateAsync({ name: name.trim(), scope, expiresInDays });
      setCreated(result.key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the key");
    }
  }

  async function copy() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created);
      setCopied(true);
    } catch {
      setError("Couldn't copy. Select the key and copy it manually.");
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Copy your new key</DialogTitle>
              <DialogDescription>This is the only time it&apos;s shown. Store it somewhere safe, like a password manager or a secret store.</DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2">
              <Input readOnly value={created} aria-label="New API key" className="font-mono text-xs" onFocus={(event) => event.currentTarget.select()} />
              <Button type="button" variant="secondary" onClick={copy}>
                {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Send it as <code className="font-mono">Authorization: Bearer {created.slice(0, 10)}…</code> to the Orbit API.
            </p>
            {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
            <DialogFooter>
              <Button type="button" onClick={onClose}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Create API key</DialogTitle>
              <DialogDescription>The key acts as you in this workspace, limited to the access you choose.</DialogDescription>
            </DialogHeader>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-[var(--color-text-primary)]">Name</span>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. CI release script" required maxLength={100} autoFocus />
            </label>
            <fieldset className="space-y-1.5 text-sm">
              <legend className="font-medium text-[var(--color-text-primary)]">Access</legend>
              <label className="flex items-start gap-2">
                <input type="radio" name="scope" checked={scope === "read"} onChange={() => setScope("read")} className="mt-1" />
                <span>
                  Read only
                  <span className="block text-xs text-[var(--color-text-secondary)]">Can list and read issues, sprints, ideas and reports.</span>
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input type="radio" name="scope" checked={scope === "write"} onChange={() => setScope("write")} disabled={!canWrite} className="mt-1" />
                <span className={canWrite ? undefined : "opacity-60"}>
                  Read and write
                  <span className="block text-xs text-[var(--color-text-secondary)]">
                    {canWrite ? "Can also create and change things, as far as your role allows." : "Your role can only create read-only keys."}
                  </span>
                </span>
              </label>
            </fieldset>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-[var(--color-text-primary)]">Expires</span>
              <select
                value={expiresInDays === null ? "never" : String(expiresInDays)}
                onChange={(event) => setExpiresInDays(event.target.value === "never" ? null : (Number(event.target.value) as 30 | 90 | 365))}
                className="h-9 w-full rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-3 text-sm"
              >
                <option value="30">In 30 days</option>
                <option value="90">In 90 days</option>
                <option value="365">In 1 year</option>
                <option value="never">Never</option>
              </select>
            </label>
            {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
            <DialogFooter className="gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || createKey.isPending}>
                {createKey.isPending ? "Creating..." : "Create key"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ApiKeysPanel() {
  const { userId, workspaceRole } = useSessionContext();
  const keysQuery = useApiKeysQuery();
  const revokeKey = useRevokeApiKeyMutation();
  const [creating, setCreating] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const canWrite = workspaceRole !== "viewer";
  const keys = keysQuery.data ?? [];

  async function revoke(key: ApiKeyDTO) {
    if (!window.confirm(`Revoke "${key.name}"? Anything using it stops working immediately.`)) return;
    setRevokeError(null);
    try {
      await revokeKey.mutateAsync(key.id);
    } catch (err) {
      setRevokeError(err instanceof Error ? err.message : "Couldn't revoke the key");
    }
  }

  return (
    <section aria-labelledby="api-keys-heading" className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="api-keys-heading" className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            API keys
          </h3>
          <p className="mt-1 max-w-prose text-xs text-[var(--color-text-secondary)]">
            Use a key to reach the Orbit API from scripts and tools. Each key acts as you, in this workspace only.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => setCreating(true)}>
          Create key
        </Button>
      </div>

      {keysQuery.isLoading ? (
        <div className="h-16 animate-pulse rounded-md bg-[var(--color-surface-hover)]" aria-busy="true" />
      ) : keysQuery.error ? (
        <p className="text-sm text-[var(--color-error)]">Couldn&apos;t load API keys. {keysQuery.error instanceof Error ? keysQuery.error.message : ""}</p>
      ) : keys.length === 0 ? (
        <p className="rounded-md border border-dashed border-[var(--color-border-secondary)] px-4 py-5 text-sm text-[var(--color-text-secondary)]">
          No keys yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-[var(--color-border-secondary)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[var(--color-surface-hover)] text-xs text-[var(--color-text-secondary)]">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Name</th>
                <th scope="col" className="px-3 py-2 font-medium">Access</th>
                <th scope="col" className="px-3 py-2 font-medium">Last used</th>
                <th scope="col" className="px-3 py-2 font-medium">Expires</th>
                <th scope="col" className="px-3 py-2 font-medium">Status</th>
                <th scope="col" className="px-3 py-2"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-secondary)]">
              {keys.map((key) => {
                const status = keyStatus(key);
                return (
                  <tr key={key.id}>
                    <td className="px-3 py-2.5">
                      <span className="block text-[var(--color-text-primary)]">{key.name}</span>
                      <span className="font-mono text-xs text-[var(--color-text-tertiary)]">{key.prefix}…</span>
                      {key.userId !== userId ? (
                        <span className="block text-xs text-[var(--color-text-tertiary)]">{key.ownerName || key.ownerEmail}</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5">{key.scope === "write" ? "Read and write" : "Read only"}</td>
                    <td className="px-3 py-2.5 text-[var(--color-text-secondary)]">{describeDate(key.lastUsedAt, "Never")}</td>
                    <td className="px-3 py-2.5 text-[var(--color-text-secondary)]">{describeDate(key.expiresAt, "Never")}</td>
                    <td className="px-3 py-2.5">
                      <span className={status.tone === "ok" ? "text-[var(--color-success)]" : "text-[var(--color-text-tertiary)]"}>{status.label}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {status.tone === "ok" ? (
                        <Button type="button" variant="secondary" size="sm" onClick={() => revoke(key)} disabled={revokeKey.isPending}>
                          Revoke
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {revokeError ? <p className="text-sm text-[var(--color-error)]">{revokeError}</p> : null}

      {creating ? <CreateKeyDialog onClose={() => setCreating(false)} canWrite={canWrite} /> : null}
    </section>
  );
}
