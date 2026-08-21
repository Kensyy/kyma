import type { Prisma } from "@/generated/prisma/client";

export const ticketListInclude = {
  status: true,
  category: true,
  assignee: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  source: { select: { id: true, name: true } },
} satisfies Prisma.TicketInclude;

export type TicketListItem = Prisma.TicketGetPayload<{
  include: typeof ticketListInclude;
}>;

export const ticketDetailInclude = {
  status: true,
  category: true,
  branch: true,
  assignee: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  asset: { select: { id: true, name: true } },
  source: { select: { id: true, name: true } },
  comments: {
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.TicketInclude;

export type TicketDetail = Prisma.TicketGetPayload<{
  include: typeof ticketDetailInclude;
}>;
export type TicketCommentWithAuthor = TicketDetail["comments"][number];
