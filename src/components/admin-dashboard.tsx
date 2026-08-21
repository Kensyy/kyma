"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
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
import {
  useDashboardConfig,
  useUpdateDashboardConfig,
} from "@/hooks/use-dashboard-config";
import {
  DEFAULT_WIDGET_IDS,
  WIDGET_IDS,
  WIDGET_TITLES,
  WIDGET_WIDE,
  type DashboardWidgetId,
} from "@/lib/dashboard-widgets";
import { relativeTime } from "@/lib/relative-time";
import { cssColorForToken } from "@/lib/color-tokens";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

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

// --- Self-contained widgets (Section 5.3) ---------------------------------
// Each widget owns its title and how it renders its slice of dashboard data.
// They all call useDashboard() themselves rather than receiving props from
// the shell — TanStack Query dedupes the identical query key into one
// network request, so this stays cheap while keeping each widget a
// standalone unit: adding one means writing a component + a registry entry
// below, never touching AdminDashboard's layout logic.

function OpenTicketsWidget() {
  const { data } = useDashboard();
  return <KpiTile label="Open tickets" value={data?.openTickets ?? 0} />;
}

function SlaBreachesWidget() {
  const { data } = useDashboard();
  return (
    <KpiTile
      label="SLA breaches"
      value={data?.slaBreaches ?? 0}
      tone="destructive"
    />
  );
}

function AssetsTrackedWidget() {
  const { data } = useDashboard();
  return <KpiTile label="Assets tracked" value={data?.totalAssets ?? 0} />;
}

function ActiveAssetsWidget() {
  const { data } = useDashboard();
  return <KpiTile label="Active assets" value={data?.activeAssets ?? 0} />;
}

function TicketsByStatusWidget() {
  const { data } = useDashboard();
  const ticketsByStatus = data?.ticketsByStatus ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-bold">Tickets by status</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <div className="h-40 w-40 shrink-0">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={ticketsByStatus}
                dataKey="count"
                nameKey="label"
                innerRadius={45}
                outerRadius={70}
                strokeWidth={2}
              >
                {ticketsByStatus.map((s) => (
                  <Cell key={s.id} fill={cssColorForToken(s.color)} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-1.5">
          {ticketsByStatus.map((s) => (
            <div key={s.id} className="flex items-center gap-2 text-[11.5px]">
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
  );
}

function TicketsByPriorityWidget() {
  const { data } = useDashboard();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-bold">
          Tickets by priority
        </CardTitle>
      </CardHeader>
      <CardContent className="h-48">
        <ResponsiveContainer>
          <BarChart
            data={data?.ticketsByPriority ?? []}
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
              {(data?.ticketsByPriority ?? []).map((p, i) => (
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
  );
}

function AssetsByStatusWidget() {
  const { data } = useDashboard();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-bold">Assets by status</CardTitle>
      </CardHeader>
      <CardContent className="h-48">
        <ResponsiveContainer>
          <BarChart
            data={data?.assetsByStatus ?? []}
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
              {(data?.assetsByStatus ?? []).map((s) => (
                <Cell key={s.id} fill={cssColorForToken(s.color)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function RecentActivityWidget() {
  const { data } = useDashboard();
  const activity = data?.activity ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-bold">Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {activity.length === 0 && (
          <p className="text-muted-foreground text-sm">Nothing yet.</p>
        )}
        {activity.map((item) => (
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
  );
}

const WIDGET_COMPONENTS: Record<DashboardWidgetId, React.ComponentType> = {
  "open-tickets": OpenTicketsWidget,
  "sla-breaches": SlaBreachesWidget,
  "assets-tracked": AssetsTrackedWidget,
  "active-assets": ActiveAssetsWidget,
  "tickets-by-status": TicketsByStatusWidget,
  "tickets-by-priority": TicketsByPriorityWidget,
  "assets-by-status": AssetsByStatusWidget,
  "recent-activity": RecentActivityWidget,
};

// --- Customize panel --------------------------------------------------------

function CustomizePanel({
  widgetIds,
  onClose,
}: {
  widgetIds: DashboardWidgetId[];
  onClose: () => void;
}) {
  const updateConfig = useUpdateDashboardConfig();
  // Local editable order: saved/enabled widgets first (in their saved
  // order), then any not-yet-enabled ones appended in registry order.
  const [order, setOrder] = useState<DashboardWidgetId[]>(() => [
    ...widgetIds,
    ...WIDGET_IDS.filter((id) => !widgetIds.includes(id)),
  ]);
  const [enabled, setEnabled] = useState<Set<DashboardWidgetId>>(
    () => new Set(widgetIds),
  );

  function toggle(id: DashboardWidgetId, checked: boolean) {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function move(id: DashboardWidgetId, direction: "up" | "down") {
    setOrder((prev) => {
      const index = prev.indexOf(id);
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next;
    });
  }

  async function handleSave() {
    try {
      await updateConfig.mutateAsync(order.filter((id) => enabled.has(id)));
      toast.success("Dashboard updated");
      onClose();
    } catch {
      toast.error("Could not save the dashboard layout.");
    }
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-base font-bold">
          Customize dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {order.map((id, i) => (
          <div
            key={id}
            className="flex items-center gap-3 rounded-md border p-2.5"
          >
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => move(id, "up")}
                disabled={i === 0}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                aria-label="Move up"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 12 5-5 5 5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => move(id, "down")}
                disabled={i === order.length - 1}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                aria-label="Move down"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 8 5 5 5-5" />
                </svg>
              </button>
            </div>
            <label className="flex flex-1 items-center gap-2 text-sm">
              <Checkbox
                checked={enabled.has(id)}
                onCheckedChange={(checked) => toggle(id, checked === true)}
              />
              {WIDGET_TITLES[id]}
            </label>
          </div>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={updateConfig.isPending}
          >
            {updateConfig.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminDashboard() {
  const { isLoading } = useDashboard();
  const { data: configData, isLoading: configLoading } = useDashboardConfig();
  const [customizing, setCustomizing] = useState(false);

  if (isLoading || configLoading || !configData) {
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

  const widgetIds =
    configData.widgetIds.length > 0 ? configData.widgetIds : DEFAULT_WIDGET_IDS;

  return (
    <div className="flex flex-col gap-6 p-7">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">
            Admin dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Pick which widgets show and reorder them — the layout is saved per
            admin.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCustomizing((v) => !v)}>
            {customizing ? "Close" : "Customize"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/custom-fields">Custom fields</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/custom-entities">Custom tables</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/activity">Activity log</Link>
          </Button>
        </div>
      </div>

      {customizing && (
        <CustomizePanel
          widgetIds={widgetIds}
          onClose={() => setCustomizing(false)}
        />
      )}

      {widgetIds.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No widgets selected — click Customize to add some.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {widgetIds.map((id) => {
          const Widget = WIDGET_COMPONENTS[id];
          if (!Widget) return null;
          return (
            <div
              key={id}
              className={cn(WIDGET_WIDE[id] && "col-span-2 lg:col-span-2")}
            >
              <Widget />
            </div>
          );
        })}
      </div>
    </div>
  );
}
