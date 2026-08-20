"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export type DashboardData = {
  openTickets: number;
  slaBreaches: number;
  totalAssets: number;
  activeAssets: number;
  ticketsByStatus: {
    id: string;
    label: string;
    color: string;
    count: number;
  }[];
  assetsByStatus: { id: string; label: string; color: string; count: number }[];
  ticketsByPriority: { priority: string; count: number }[];
  activity: {
    id: string;
    kind: "ticket_created" | "comment" | "asset_event";
    label: string;
    actor: string;
    timestamp: string;
  }[];
};

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<DashboardData>("/api/dashboard"),
    // Dashboard widgets are allowed to poll on an interval (unlike the rest
    // of the app, which relies on refetch-on-focus).
    refetchInterval: 60_000,
  });
}
