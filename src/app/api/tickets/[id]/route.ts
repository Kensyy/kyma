import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireSession,
  requireStaff,
  requireWriteSession,
} from "@/lib/api-auth";
import { updateTicketSchema } from "@/lib/validations/ticket";
import { computeTicketSlaDueAt } from "@/lib/sla-policy";
import { ticketDetailInclude } from "@/lib/types/ticket";
import {
  persistCustomFieldValues,
  validateCustomFields,
} from "@/lib/custom-field-sync";
import { logActivity } from "@/lib/activity-log";
import { notify } from "@/lib/notify";
import { dispatchWebhook } from "@/lib/webhooks";

async function loadCustomFields(ticketId: string) {
  const [definitions, values] = await Promise.all([
    prisma.customFieldDefinition.findMany({
      where: { entityType: "TICKET" },
      orderBy: { order: "asc" },
    }),
    prisma.customFieldValue.findMany({ where: { entityId: ticketId } }),
  ]);
  const valueByDefId = new Map(
    values.map((v) => [v.fieldDefinitionId, v.value]),
  );
  return definitions.map((definition) => ({
    definition,
    value: valueByDefId.get(definition.id) ?? null,
  }));
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: ticketDetailInclude,
  });

  // 404 rather than 403 for a ticket that isn't theirs — an End User
  // shouldn't be able to tell the difference between "doesn't exist" and
  // "exists but isn't yours" by probing ids.
  if (
    !ticket ||
    (session.user.role === "END_USER" && ticket.createdById !== session.user.id)
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Internal notes are staff-only, even on a ticket the End User reported
  // themselves.
  const visibleTicket =
    session.user.role === "END_USER"
      ? { ...ticket, comments: ticket.comments.filter((c) => !c.isInternal) }
      : ticket;

  const [appSettings, customFields] = await Promise.all([
    prisma.appSettings.findFirst(),
    loadCustomFields(id),
  ]);

  return NextResponse.json({
    ticket: visibleTicket,
    ticketPrefix: appSettings?.ticketPrefix ?? "KYM",
    customFields,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireWriteSession();
  if ("error" in session) return session.error;
  const forbidden = requireStaff(session.user);
  if (forbidden) return forbidden;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { statusId, priority, customFields, ...rest } = parsed.data;

  if (statusId) {
    const status = await prisma.status.findUnique({ where: { id: statusId } });
    if (!status || status.entityType !== "TICKET") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
  }

  const fieldsResult = await validateCustomFields("TICKET", customFields);
  if (!fieldsResult.ok) {
    return NextResponse.json(
      { error: { customFields: fieldsResult.errors } },
      { status: 400 },
    );
  }

  // Recompute the SLA window whenever priority or category changes — both
  // can affect which SlaPolicy row applies (Section 5.6), not just priority.
  const priorityChanged = priority && priority !== existing.priority;
  const categoryChanged =
    "categoryId" in rest && rest.categoryId !== existing.categoryId;
  const slaDueAt =
    priorityChanged || categoryChanged
      ? await computeTicketSlaDueAt(
          priority ?? existing.priority,
          (categoryChanged ? rest.categoryId : existing.categoryId) ?? null,
        )
      : undefined;

  const ticket = await prisma.ticket.update({
    where: { id },
    data: { ...rest, statusId, priority, slaDueAt },
    include: ticketDetailInclude,
  });

  await persistCustomFieldValues(id, customFields, fieldsResult.definitions);

  if (statusId && statusId !== existing.statusId) {
    await logActivity({
      entityType: "TICKET",
      entityId: id,
      actorId: session.user.id,
      action: "TICKET_STATUS_CHANGED",
      metadata: { from: existing.statusId, to: statusId },
    });
    await dispatchWebhook("TICKET_STATUS_CHANGED", {
      ticketId: id,
      title: ticket.title,
      statusId,
    });
  }

  if ("assigneeId" in rest && rest.assigneeId !== existing.assigneeId) {
    await logActivity({
      entityType: "TICKET",
      entityId: id,
      actorId: session.user.id,
      action: "TICKET_ASSIGNED",
      metadata: { assigneeId: rest.assigneeId },
    });
    await dispatchWebhook("TICKET_ASSIGNED", {
      ticketId: id,
      title: ticket.title,
      assigneeId: rest.assigneeId,
    });

    if (rest.assigneeId && rest.assigneeId !== session.user.id) {
      await notify({
        userId: rest.assigneeId,
        message: `You were assigned to "${ticket.title}"`,
        entityType: "TICKET",
        entityId: id,
      });
    }
  }

  return NextResponse.json({ ticket });
}
