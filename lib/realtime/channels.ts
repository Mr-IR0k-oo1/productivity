export const realtimeChannels = {
  tasks: (workspaceId: string) => `workspace:${workspaceId}:tasks`,
  ideas: (workspaceId: string) => `workspace:${workspaceId}:ideas`,
  timeEntries: (workspaceId: string) => `workspace:${workspaceId}:time_entries`,
  activity: (workspaceId: string) => `workspace:${workspaceId}:activity`,
};
