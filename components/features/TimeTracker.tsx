"use client";

import { useState } from "react";
import { Play, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TimeTracker() {
  const [running, setRunning] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Tracker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[var(--color-text-secondary)]">Track focused sessions and generate timesheets.</p>
        <Button variant="secondary" onClick={() => setRunning((value) => !value)}>
          {running ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? "Stop Timer" : "Start Timer"}
        </Button>
      </CardContent>
    </Card>
  );
}
