import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  delta: string;
  icon: LucideIcon;
}

export function StatCard({ title, value, delta, icon: Icon }: StatCardProps) {
  return (
    <Card className="border-white/10 bg-[#111111] text-white transition-colors hover:border-white/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-neutral-400">{title}</CardTitle>
        <Icon className="h-4 w-4 text-neutral-400" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <p className={cn("mt-2 text-xs font-medium text-neutral-300")}>{delta}</p>
      </CardContent>
    </Card>
  );
}
