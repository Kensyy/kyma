import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { createCommentSchema } from "@/lib/validations/ticket";
import { logActivity } from "@/lib/activity-log";
import { notifyMany } from "@/lib/notify";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const comment = await prisma.ticketComment.create({
    data: {
      ticketId: id,
      authorId: session.user.id,
      body: parsed.data.body,
      isInternal: parsed.data.isInternal,
    },
    include: { author: { select: { id: true, name: true } } },
  });

  // Touch the ticket's updatedAt so "recently active" ordering reflects it.
  await prisma.ticket.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  await logActivity({
    entityType: "TICKET",
    entityId: id,
    actorId: session.user.id,
    action: "TICKET_COMMENT_ADDED",
    metadata: { isInternal: parsed.data.isInternal },
  });

  // An internal note is staff-only, so the ticket's (possibly End User)
  // creator only gets notified about public replies — the assignee sees
  // both, since they're staff either way.
  const recipients = parsed.data.isInternal
    ? [ticket.assigneeId]
    : [ticket.createdById, ticket.assigneeId];
  await notifyMany(
    recipients.filter((userId) => userId !== session.user.id),
    `New ${parsed.data.isInternal ? "internal note" : "reply"} on "${ticket.title}"`,
    { entityType: "TICKET", entityId: id },
  );

  return NextResponse.json({ comment }, { status: 201 });
}
