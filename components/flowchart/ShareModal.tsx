"use client";

import { Copy, Globe, Link2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ShareModalProps = {
  open: boolean;
  shareUrl: string | null;
  isPublic: boolean;
  onClose: () => void;
  onToggle: (enabled: boolean) => void;
};

export default function ShareModal({ open, shareUrl, isPublic, onClose, onToggle }: ShareModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Share Flowchart</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-4">
            {isPublic ? <Globe className="h-5 w-5 text-emerald-400" /> : <Lock className="h-5 w-5 text-amber-400" />}
            <div className="flex-1">
              <div className="text-sm font-medium text-[var(--color-text-primary)]">
                {isPublic ? "Public link enabled" : "Private flowchart"}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                {shareUrl ?? "Generate a link to share a read-only public view."}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => onToggle(!isPublic)}>
              <Link2 className="h-4 w-4" />
              {isPublic ? "Disable Link" : "Generate Link"}
            </Button>
            {shareUrl ? (
              <Button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(shareUrl);
                }}
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
            ) : null}
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
