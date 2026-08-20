"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDashboard } from "@/hooks/use-dashboard";
import { relativeTime } from "@/lib/relative-time";
import { cssColorForToken } from "@/lib/color-tokens";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const PRIORITY_LABEL: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};
const PRIORITY_COLOR = ["muted", "warning", "destructive", "destructive"];

function KpiTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "destructive";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-semibold">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={`font-heading text-3xl font-semibold ${tone === "destructive" ? "text-destructive" : ""}`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export function AdminDashboard() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-6 p-7">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-7">
      <div>
        <h1 className="font-heading text-xl font-semibold">Admin dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Widgets are fixed for now — configurable layout lands in Milestone 8.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiTile label="Open tickets" value={data.openTickets} />
        <KpiTile
          label="SLA breaches"
          value={data.slaBreaches}
          tone="destructive"
        />
        <KpiTile label="Assets tracked" value={data.totalAssets} />
        <KpiTile label="Active assets" value={data.activeAssets} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Tickets by status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="h-40 w-40 shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data.ticketsByStatus}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={45}
                    outerRadius={70}
                    strokeWidth={2}
                  >
                    {data.ticketsByStatus.map((s) => (
                      <Cell key={s.id} fill={cssColorForToken(s.color)} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-1.5">
              {data.ticketsByStatus.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 text-[11.5px]"
                >
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ background: cssColorForToken(s.color) }}
                  />
                  {s.label} · {s.count}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Tickets by priority
            </CardTitle>
          </CardHeader>
          <CardContent className="h-48">
            <ResponsiveContainer>
              <BarChart
                data={data.ticketsByPriority}
                layout="vertical"
                margin={{ left: 8 }}
              >
                <XAxis type="number" allowDecimals={false} hide />
                <YAxis
                  type="category"
                  dataKey="priority"
                  tickFormatter={(p) => PRIORITY_LABEL[p] ?? p}
                  width={64}
                  fontSize={12}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(value) => [value, "Tickets"]} />
                <Bar dataKey="count" radius={4}>
                  {data.ticketsByPriority.map((p, i) => (
                    <Cell
                      key={p.priority}
                      fill={cssColorForToken(PRIORITY_COLOR[i])}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Assets by status
            </CardTitle>
          </CardHeader>
          <CardContent className="h-48">
            <ResponsiveContainer>
              <BarChart
                data={data.assetsByStatus}
                layout="vertical"
                margin={{ left: 8 }}
              >
                <XAxis type="number" allowDecimals={false} hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={90}
                  fontSize={12}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(value) => [value, "Assets"]} />
                <Bar dataKey="count" radius={4}>
                  {data.assetsByStatus.map((s) => (
                    <Cell key={s.id} fill={cssColorForToken(s.color)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.activity.length === 0 && (
              <p className="text-muted-foreground text-sm">Nothing yet.</p>
            )}
            {data.activity.map((item) => (
              <div key={item.id} className="flex gap-2.5 text-sm">
                <div className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                <div>
                  <span className="font-medium">{item.actor}</span>{" "}
                  <span className="text-muted-foreground">{item.label}</span>
                  <div className="text-muted-foreground text-[11px]">
                    {relativeTime(item.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
