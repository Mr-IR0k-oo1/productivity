import { type ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RouteStubCardProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function RouteStubCard({ title, description, children }: RouteStubCardProps) {
  return (
    <Card className="border-white/10 bg-[#111111] text-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-white">{title}</CardTitle>
        <p className="text-sm text-neutral-400">{description}</p>
      </CardHeader>
      {children ? <CardContent className="pt-0">{children}</CardContent> : null}
    </Card>
  );
}
