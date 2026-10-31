import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type ActivityItemProps = {
  user: string;
  text: string;
  timestamp: string;
};

export function ActivityItem({ user, text, timestamp }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-[color:var(--card-border)] bg-[var(--surface-strong)] p-3 transition-colors hover:border-[var(--color-border-tertiary)]">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-[var(--surface)] text-[var(--foreground)]">{user}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm text-[var(--foreground)]">{text}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">{timestamp}</p>
      </div>
    </div>
  );
}
