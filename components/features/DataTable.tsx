import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const rows = [
  { metric: "Tasks Completed", value: "91" },
  { metric: "Avg Cycle Time", value: "2.8d" },
  { metric: "Tracked Hours", value: "156h" },
];

export function DataTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Snapshot</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-zinc-500">
              <th className="pb-2">Metric</th>
              <th className="pb-2">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.metric} className="border-t border-zinc-900 text-zinc-300">
                <td className="py-2.5">{row.metric}</td>
                <td className="py-2.5">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
