// The widget catalog for the admin dashboard (Section 5.3) — shared between
// the API route (to validate a submitted layout) and the dashboard UI (to
// render the customize panel and resolve each widget's component). Adding a
// widget means adding one entry here plus one component in
// admin-dashboard.tsx — the dashboard shell itself never changes.
export const WIDGET_IDS = [
  "open-tickets",
  "sla-breaches",
  "assets-tracked",
  "active-assets",
  "tickets-by-status",
  "tickets-by-priority",
  "assets-by-status",
  "recent-activity",
] as const;

export type DashboardWidgetId = (typeof WIDGET_IDS)[number];

export const WIDGET_TITLES: Record<DashboardWidgetId, string> = {
  "open-tickets": "Open tickets",
  "sla-breaches": "SLA breaches",
  "assets-tracked": "Assets tracked",
  "active-assets": "Active assets",
  "tickets-by-status": "Tickets by status",
  "tickets-by-priority": "Tickets by priority",
  "assets-by-status": "Assets by status",
  "recent-activity": "Recent activity",
};

// KPI tiles are narrow (1 of 4 grid columns); chart/activity cards are wide
// (2 of 4) — used to size each widget's card without needing a full
// drag-and-resize layout builder.
export const WIDGET_WIDE: Record<DashboardWidgetId, boolean> = {
  "open-tickets": false,
  "sla-breaches": false,
  "assets-tracked": false,
  "active-assets": false,
  "tickets-by-status": true,
  "tickets-by-priority": true,
  "assets-by-status": true,
  "recent-activity": true,
};

export const DEFAULT_WIDGET_IDS: DashboardWidgetId[] = [...WIDGET_IDS];
