import { ActivityFeedItem, ActivityItem } from "@/components/common/ActivityItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const activity: ActivityFeedItem[] = [
  {
    id: "activity-1",
    user: "Alice",
    action: "completed task",
    target: "Setup CI/CD pipeline",
    time: "2h ago",
  },
  {
    id: "activity-2",
    user: "Bob",
    action: "commented on",
    target: "API design proposal",
    time: "3h ago",
  },
  {
    id: "activity-3",
    user: "Carol",
    action: "created idea",
    target: "Mobile app redesign",
    time: "5h ago",
  },
];

export function RecentActivity() {
  return (
    <Card className="border-white/10 bg-[#111111]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-white">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activity.map((item) => (
          <ActivityItem key={item.id} {...item} />
        ))}
      </CardContent>
    </Card>
  );
}
