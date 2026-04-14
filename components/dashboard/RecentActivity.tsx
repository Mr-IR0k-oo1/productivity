'use client';

import { useState, useMemo } from 'react';
import { ActivityItem } from "@/components/common/ActivityItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, ArrowUpDown, Trash2 } from 'lucide-react';

type ActivityType = 'task' | 'idea' | 'time' | 'comment' | 'other';

interface Activity {
  id: string;
  user: string;
  text: string;
  timestamp: string;
  type: ActivityType;
  date: Date;
}

const activityData: Activity[] = [
  { 
    id: '1',
    user: "Alice", 
    text: 'moved "Launch checklist" to In Progress', 
    timestamp: "2m ago",
    type: 'task',
    date: new Date(Date.now() - 2 * 60000)
  },
  { 
    id: '2',
    user: "Bob", 
    text: 'created a new idea: "AI standup summaries"', 
    timestamp: "9m ago",
    type: 'idea',
    date: new Date(Date.now() - 9 * 60000)
  },
  { 
    id: '3',
    user: "Carol", 
    text: 'logged 3.5h on Sprint Planning', 
    timestamp: "21m ago",
    type: 'time',
    date: new Date(Date.now() - 21 * 60000)
  },
  { 
    id: '4',
    user: "Dave", 
    text: 'completed task: "Fix calendar sync bug"', 
    timestamp: "1h ago",
    type: 'task',
    date: new Date(Date.now() - 60 * 60000)
  },
];

const typeColors: Record<ActivityType, string> = {
  task: 'bg-blue-500/10 text-blue-400',
  idea: 'bg-purple-500/10 text-purple-400',
  time: 'bg-green-500/10 text-green-400',
  comment: 'bg-yellow-500/10 text-yellow-400',
  other: 'bg-gray-500/10 text-gray-400',
};

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>(activityData);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedFilter, setSelectedFilter] = useState<ActivityType | 'all'>('all');

  const filtered = useMemo(() => {
    let result = activities;

    // Apply filter
    if (selectedFilter !== 'all') {
      result = result.filter(a => a.type === selectedFilter);
    }

    // Apply sort
    result = [...result].sort((a, b) => {
      const comparison = b.date.getTime() - a.date.getTime();
      return sortOrder === 'oldest' ? -comparison : comparison;
    });

    return result;
  }, [activities, selectedFilter, sortOrder]);

  const removeActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const clearAll = () => {
    setActivities([]);
  };

  const activityTypes: (ActivityType | 'all')[] = ['all', 'task', 'idea', 'time', 'comment'];

  return (
    <Card className="transition-colors hover:border-zinc-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Recent Activity</CardTitle>
          {activities.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              title="Clear all activities"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Filter and Sort Controls */}
        <div className="space-y-3">
          {/* Sort Button */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSortOrder(s => s === 'newest' ? 'oldest' : 'newest')}
              className=""
            >
              <ArrowUpDown className="w-3 h-3 mr-1" />
              {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
            </Button>
          </div>

          {/* Type Filter */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <Filter className="w-3 h-3" />
              <span>Filter by type</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {activityTypes.map(type => (
                <Button
                  key={type}
                  variant={selectedFilter === type ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedFilter(type)}
                  className="text-xs"
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-6 text-zinc-500">
            {activities.length === 0 ? 'No activity yet' : 'No activities match the filter'}
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="group relative flex items-start justify-between gap-2 rounded-lg p-2 hover:bg-zinc-900/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[item.type]}`}>
                    {item.type}
                  </span>
                  <span className="text-xs text-zinc-500">{item.timestamp}</span>
                </div>
                <ActivityItem user={item.user} text={item.text} timestamp={item.timestamp} />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeActivity(item.id)}
                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="Remove activity"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))
        )}

        {filtered.length > 0 && (
          <div className="pt-2 text-xs text-zinc-500 border-t border-zinc-800">
            Showing {filtered.length} of {activities.length} activities
          </div>
        )}
      </CardContent>
    </Card>
  );
}
