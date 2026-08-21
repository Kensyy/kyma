"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { NotificationModel } from "@/generated/prisma/models";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      apiFetch<{ notifications: NotificationModel[]; unreadCount: number }>(
        "/api/notifications",
      ),
    // Same polling pattern as dashboard widgets (Section 3 — no WebSockets).
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/notifications/${id}`, { method: "PATCH" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch("/api/notifications/mark-all-read", { method: "POST" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
