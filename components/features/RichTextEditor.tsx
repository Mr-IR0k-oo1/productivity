"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RichTextEditor() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Idea Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="min-h-[180px] rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-400">
          Tiptap editor scaffold. Connect extensions and persistence here.
        </div>
      </CardContent>
    </Card>
  );
}
