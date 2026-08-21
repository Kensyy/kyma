"use client";

import { useState } from "react";
import Link from "next/link";
import { useActivityLog } from "@/hooks/use-activity";
import { relativeTime } from "@/lib/relative-time";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const ACTION_LABEL: Record<string, string> = {
  TICKET_CREATED: "created a ticket",
  TICKET_STATUS_CHANGED: "changed a ticket's status",
  TICKET_ASSIGNED: "reassigned a ticket",
  TICKET_COMMENT_ADDED: "commented on a ticket",
  ASSET_CREATED: "created an asset",
  ASSET_STATUS_CHANGED: "changed an asset's status",
  ASSET_CHECKED_OUT: "checked out an asset",
  ASSET_CHECKED_IN: "checked in an asset",
};

const TABS = [
  { value: undefined, label: "All" },
  { value: "TICKET" as const, label: "Tickets" },
  { value: "ASSET" as const, label: "Assets" },
];

export function ActivityLog() {
  const [entityType, setEntityType] = useState<"TICKET" | "ASSET" | undefined>(
    undefined,
  );
  const { data, isLoading } = useActivityLog(entityType);

  return (
    <div className="flex flex-col gap-6 p-7">
      <div>
        <h1 className="font-heading text-xl font-semibold">Activity log</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          A system-wide audit trail of who did what, most recent first.
        </p>
      </div>

      <div className="flex gap-5.5 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setEntityType(tab.value)}
            className={cn(
              "text-muted-foreground border-b-2 border-transparent py-2.5 text-sm font-semibold",
              entityType === tab.value && "border-primary text-primary",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}

        {!isLoading && data?.entries.length === 0 && (
          <p className="text-muted-foreground text-sm">No activity yet.</p>
        )}

        {data?.entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between gap-3 border-b py-2.5 text-sm last:border-b-0"
          >
            <div>
              <span className="font-medium">{entry.actor.name}</span>{" "}
              <span className="text-muted-foreground">
                {ACTION_LABEL[entry.action] ?? entry.action}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={
                  entry.entityType === "TICKET"
                    ? `/tickets/${entry.entityId}`
                    : `/assets/${entry.entityId}`
                }
                className="text-primary text-xs font-medium hover:underline"
              >
                View
              </Link>
              <span className="text-muted-foreground w-20 shrink-0 text-right text-[11px]">
                {relativeTime(entry.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
