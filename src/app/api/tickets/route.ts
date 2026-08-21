import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { createTicketSchema } from "@/lib/validations/ticket";
import { computeTicketSlaDueAt } from "@/lib/sla-policy";
import { ticketListInclude } from "@/lib/types/ticket";
import {
  persistCustomFieldValues,
  validateCustomFields,
} from "@/lib/custom-field-sync";
import { logActivity } from "@/lib/activity-log";
import { dispatchWebhook } from "@/lib/webhooks";

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const params = request.nextUrl.searchParams;
  const statusId = params.get("status");
  const priority = params.get("priority");
  const categoryId = params.get("category");
  const assignee = params.get("assignee");
  const q = params.get("q");

  const where: Prisma.TicketWhereInput = {};
  if (statusId) where.statusId = statusId;
  if (priority)
    where.priority = priority as Prisma.TicketWhereInput["priority"];
  if (categoryId) where.categoryId = categoryId;
  if (assignee === "me") where.assigneeId = session.user.id;
  else if (assignee === "unassigned") where.assigneeId = null;
  else if (assignee) where.assigneeId = assignee;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { ticketNumber: Number.isNaN(Number(q)) ? undefined : Number(q) },
    ];
  }

  const [tickets, appSettings] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: ticketListInclude,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.appSettings.findFirst(),
  ]);

  return NextResponse.json({
    tickets,
    ticketPrefix: appSettings?.ticketPrefix ?? "KYM",
  });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const body = await request.json();
  const parsed = createTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    statusId,
    categoryId,
    assigneeId,
    branchId,
    priority,
    customFields,
    ...rest
  } = parsed.data;

  const status = await prisma.status.findUnique({ where: { id: statusId } });
  if (!status || status.entityType !== "TICKET") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const fieldsResult = await validateCustomFields("TICKET", customFields, {
    requireAllRequired: true,
  });
  if (!fieldsResult.ok) {
    return NextResponse.json(
      { error: { customFields: fieldsResult.errors } },
      { status: 400 },
    );
  }

  const ticket = await prisma.ticket.create({
    data: {
      ...rest,
      priority,
      statusId,
      categoryId,
      assigneeId,
      branchId,
      createdById: session.user.id,
      slaDueAt: await computeTicketSlaDueAt(priority, categoryId ?? null),
    },
    include: ticketListInclude,
  });

  await persistCustomFieldValues(
    ticket.id,
    customFields,
    fieldsResult.definitions,
  );

  await logActivity({
    entityType: "TICKET",
    entityId: ticket.id,
    actorId: session.user.id,
    action: "TICKET_CREATED",
  });

  await dispatchWebhook("TICKET_CREATED", {
    ticketId: ticket.id,
    title: ticket.title,
    priority: ticket.priority,
  });

  return NextResponse.json({ ticket }, { status: 201 });
}
