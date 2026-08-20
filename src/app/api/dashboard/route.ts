import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/api-auth";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

type ActivityItem = {
  id: string;
  kind: "ticket_created" | "comment" | "asset_event";
  label: string;
  actor: string;
  timestamp: Date;
};

export async function GET() {
  const session = await requireSession();
  if ("error" in session) return session.error;
  const forbidden = requireAdmin(session.user);
  if (forbidden) return forbidden;

  const now = new Date();

  const [
    openTickets,
    slaBreaches,
    totalAssets,
    activeAssets,
    ticketStatuses,
    assetStatuses,
    priorityCounts,
    recentTickets,
    recentComments,
    recentAssetHistory,
  ] = await Promise.all([
    prisma.ticket.count({ where: { status: { isTerminal: false } } }),
    prisma.ticket.count({
      where: { status: { isTerminal: false }, slaDueAt: { lt: now } },
    }),
    prisma.asset.count(),
    prisma.asset.count({ where: { status: { isTerminal: false } } }),
    prisma.status.findMany({
      where: { entityType: "TICKET" },
      orderBy: { order: "asc" },
      include: { _count: { select: { tickets: true } } },
    }),
    prisma.status.findMany({
      where: { entityType: "ASSET" },
      orderBy: { order: "asc" },
      include: { _count: { select: { assets: true } } },
    }),
    prisma.ticket.groupBy({ by: ["priority"], _count: true }),
    prisma.ticket.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true } } },
    }),
    prisma.ticketComment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true } },
        ticket: { select: { title: true } },
      },
    }),
    prisma.assetHistory.findMany({
      take: 5,
      orderBy: { timestamp: "desc" },
      include: {
        user: { select: { name: true } },
        asset: { select: { name: true } },
      },
    }),
  ]);

  const ticketsByStatus = ticketStatuses.map((s) => ({
    id: s.id,
    label: s.label,
    color: s.color,
    count: s._count.tickets,
  }));

  const assetsByStatus = assetStatuses.map((s) => ({
    id: s.id,
    label: s.label,
    color: s.color,
    count: s._count.assets,
  }));

  const ticketsByPriority = PRIORITIES.map((priority) => ({
    priority,
    count: priorityCounts.find((p) => p.priority === priority)?._count ?? 0,
  }));

  const activity: ActivityItem[] = [
    ...recentTickets.map((t) => ({
      id: `ticket-${t.id}`,
      kind: "ticket_created" as const,
      label: `New ticket "${t.title}"`,
      actor: t.createdBy.name,
      timestamp: t.createdAt,
    })),
    ...recentComments.map((c) => ({
      id: `comment-${c.id}`,
      kind: "comment" as const,
      label: `${c.isInternal ? "Internal note" : "Reply"} on "${c.ticket.title}"`,
      actor: c.author.name,
      timestamp: c.createdAt,
    })),
    ...recentAssetHistory.map((h) => ({
      id: `asset-${h.id}`,
      kind: "asset_event" as const,
      label: `${h.eventType.replaceAll("_", " ").toLowerCase()} — ${h.asset.name}`,
      actor: h.user.name,
      timestamp: h.timestamp,
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 6);

  return NextResponse.json({
    openTickets,
    slaBreaches,
    totalAssets,
    activeAssets,
    ticketsByStatus,
    assetsByStatus,
    ticketsByPriority,
    activity,
  });
}
