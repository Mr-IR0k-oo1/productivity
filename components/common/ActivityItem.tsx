import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type ActivityItemProps = {
  user: string;
  text: string;
  timestamp: string;
};

export function ActivityItem({ user, text, timestamp }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-zinc-900 bg-zinc-950/60 p-3 transition-colors hover:border-zinc-700">
      <Avatar className="h-8 w-8">
        <AvatarFallback>{user}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm text-zinc-200">{text}</p>
        <p className="mt-1 text-xs text-zinc-500">{timestamp}</p>
      </div>
    </div>
  );
}
