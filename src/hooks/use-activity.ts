"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { ActivityLogModel } from "@/generated/prisma/models";

export type ActivityLogEntry = ActivityLogModel & {
  actor: { id: string; name: string };
};

export function useActivityLog(entityType?: "TICKET" | "ASSET") {
  return useQuery({
    queryKey: ["activity", entityType],
    queryFn: () =>
      apiFetch<{ entries: ActivityLogEntry[] }>(
        `/api/activity${entityType ? `?entityType=${entityType}` : ""}`,
      ),
  });
}
