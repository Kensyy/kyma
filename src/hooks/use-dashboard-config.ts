"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { DashboardWidgetId } from "@/lib/dashboard-widgets";

export function useDashboardConfig() {
  return useQuery({
    queryKey: ["dashboardConfig"],
    queryFn: () =>
      apiFetch<{ widgetIds: DashboardWidgetId[] }>("/api/dashboard-config"),
  });
}

export function useUpdateDashboardConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (widgetIds: DashboardWidgetId[]) =>
      apiFetch<{ widgetIds: DashboardWidgetId[] }>("/api/dashboard-config", {
        method: "PATCH",
        body: JSON.stringify({ widgetIds }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["dashboardConfig"] }),
  });
}
