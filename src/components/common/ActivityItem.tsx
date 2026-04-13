import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface ActivityFeedItem {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
}

export function ActivityItem({ user, action, target, time }: ActivityFeedItem) {
  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-9 w-9 border border-white/10 bg-[#111111]">
        <AvatarFallback className="bg-[#111111] text-xs font-semibold text-neutral-200">{user[0]}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-100">{user}</p>
        <p className="text-sm text-neutral-400">
          {action} <span className="font-medium text-neutral-200">{target}</span>
        </p>
        <p className="mt-1 text-xs text-neutral-500">{time}</p>
      </div>
    </div>
  );
}
