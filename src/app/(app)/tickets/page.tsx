"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { useTickets } from "@/hooks/use-tickets";
import { formatTicketNumber } from "@/lib/ticket-number";
import { StatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/relative-time";

type Tab = "all" | "mine" | "unassigned";

export default function TicketsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");

  const filters = useMemo(
    () => ({
      assignee:
        tab === "mine" ? "me" : tab === "unassigned" ? "unassigned" : undefined,
      q: search || undefined,
    }),
    [tab, search],
  );

  const { data, isLoading } = useTickets(filters);
  const tickets = data?.tickets ?? [];
  const prefix = data?.ticketPrefix ?? "KYM";

  // Fetched unfiltered (not `tickets` above) so tab counts stay accurate
  // regardless of which tab is currently active.
  const { data: allData } = useTickets({});
  const allTickets = allData?.tickets ?? [];
  const mineCount = allTickets.filter(
    (t) => t.assignee?.id === session?.user.id,
  ).length;
  const unassignedCount = allTickets.filter((t) => !t.assignee).length;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-7 py-4.5">
        <h1 className="font-heading text-xl font-semibold">Tickets</h1>
        <div className="flex items-center gap-2.5">
          <Input
            placeholder="Search tickets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-60"
          />
          <Button asChild>
            <Link href="/tickets/new">New ticket</Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-5.5 overflow-x-auto border-b px-7">
        {(
          [
            ["all", "All tickets", allTickets.length],
            ["mine", "My tickets", mineCount],
            ["unassigned", "Unassigned", unassignedCount],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "text-muted-foreground border-b-2 border-transparent py-3 text-sm font-semibold whitespace-nowrap",
              tab === key && "border-primary text-primary",
            )}
          >
            {label} <span className="text-muted-foreground">{count}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-7">
        <div className="overflow-x-auto rounded-lg border">
          <div className="min-w-[860px]">
            <div className="bg-muted/60 text-muted-foreground grid grid-cols-[96px_1fr_130px_110px_150px_130px_96px] px-4 py-2 text-[10.5px] font-bold tracking-wide uppercase">
              <div>ID</div>
              <div>Title</div>
              <div>Status</div>
              <div>Priority</div>
              <div>Assignee</div>
              <div>Category</div>
              <div>Updated</div>
            </div>

            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[96px_1fr_130px_110px_150px_130px_96px] items-center border-t px-4 py-2.5"
                >
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}

            {!isLoading && tickets.length === 0 && (
              <div className="text-muted-foreground p-10 text-center text-sm">
                No tickets match this view.
              </div>
            )}

            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="hover:bg-muted/40 grid grid-cols-[96px_1fr_130px_110px_150px_130px_96px] items-center border-t px-4 py-2.5 text-sm"
              >
                <div className="text-muted-foreground font-mono text-xs">
                  {formatTicketNumber(prefix, ticket.ticketNumber)}
                </div>
                <div className="truncate pr-4 font-medium">
                  {ticket.title}
                  {ticket.source && (
                    <span className="text-muted-foreground ml-1.5 text-[10.5px] font-normal">
                      via {ticket.source.name}
                    </span>
                  )}
                </div>
                <div>
                  <StatusBadge
                    label={ticket.status.label}
                    color={ticket.status.color}
                  />
                </div>
                <div>
                  <PriorityBadge priority={ticket.priority} />
                </div>
                <div>
                  {ticket.assignee ? (
                    <div className="flex items-center gap-1.5">
                      <UserAvatar name={ticket.assignee.name} />
                      <span className="truncate">{ticket.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Unassigned
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground truncate">
                  {ticket.category?.label ?? "—"}
                </div>
                <div className="text-muted-foreground text-xs">
                  {relativeTime(ticket.updatedAt)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
