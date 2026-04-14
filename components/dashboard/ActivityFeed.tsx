import { ActivityItem } from "@/components/common/ActivityItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const activity = [
  {
    user: "A",
    text: "Alice completed task Setup CI/CD pipeline",
    timestamp: "2h ago",
  },
  {
    user: "B",
    text: "Bob commented on API design proposal",
    timestamp: "3h ago",
  },
  {
    user: "C",
    text: "Carol created idea Mobile app redesign",
    timestamp: "5h ago",
  },
];

export function ActivityFeed() {
  return (
    <Card className="transition-colors hover:border-zinc-700">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <p className="text-sm text-zinc-400">Latest updates from your workspace</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {activity.map((item, index) => (
          <ActivityItem key={`${item.user}-${index}`} {...item} />
        ))}
      </CardContent>
    </Card>
  );
}
