import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWriteSession } from "@/lib/api-auth";
import { createCommentSchema } from "@/lib/validations/ticket";
import { logActivity } from "@/lib/activity-log";
import { notifyMany } from "@/lib/notify";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireWriteSession();
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
  // Same "not found" rather than "forbidden" as the ticket GET — an End
  // User can't distinguish someone else's ticket from a nonexistent one.
  if (
    !ticket ||
    (session.user.role === "END_USER" && ticket.createdById !== session.user.id)
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // An End User has no "internal note" toggle in the UI — force it server
  // side too, so every reply they post is one the ticket's other viewers
  // can see.
  const isInternal =
    session.user.role === "END_USER" ? false : parsed.data.isInternal;

  const comment = await prisma.ticketComment.create({
    data: {
      ticketId: id,
      authorId: session.user.id,
      body: parsed.data.body,
      isInternal,
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
    metadata: { isInternal },
  });

  // An internal note is staff-only, so the ticket's (possibly End User)
  // creator only gets notified about public replies — the assignee sees
  // both, since they're staff either way.
  const recipients = isInternal
    ? [ticket.assigneeId]
    : [ticket.createdById, ticket.assigneeId];
  await notifyMany(
    recipients.filter((userId) => userId !== session.user.id),
    `New ${isInternal ? "internal note" : "reply"} on "${ticket.title}"`,
    { entityType: "TICKET", entityId: id },
  );

  return NextResponse.json({ comment }, { status: 201 });
}
