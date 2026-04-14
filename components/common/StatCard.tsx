import { ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  trend: string;
  positive?: boolean;
};

export function StatCard({ title, value, trend, positive = true }: StatCardProps) {
  return (
    <Card className="group transition-colors hover:border-zinc-700">
      <CardHeader className="pb-3">
        <p className="text-sm text-zinc-400">{title}</p>
        <CardTitle className="text-3xl font-semibold">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("flex items-center gap-1 text-sm", positive ? "text-emerald-400" : "text-amber-400")}>
          <ArrowUpRight className="h-4 w-4" />
          {trend}
        </p>
      </CardContent>
    </Card>
  );
}
