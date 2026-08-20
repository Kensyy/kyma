import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { updateTicketSchema } from "@/lib/validations/ticket";
import { computeSlaDueAt } from "@/lib/sla";
import { ticketDetailInclude } from "@/lib/types/ticket";
import {
  persistCustomFieldValues,
  validateCustomFields,
} from "@/lib/custom-field-sync";

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

  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [appSettings, customFields] = await Promise.all([
    prisma.appSettings.findFirst(),
    loadCustomFields(id),
  ]);

  return NextResponse.json({
    ticket,
    ticketPrefix: appSettings?.ticketPrefix ?? "KYM",
    customFields,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if ("error" in session) return session.error;

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

  // Recompute the SLA window whenever priority changes (a re-triaged
  // ticket gets a fresh deadline based on its new priority).
  const slaDueAt =
    priority && priority !== existing.priority
      ? computeSlaDueAt(priority)
      : undefined;

  const ticket = await prisma.ticket.update({
    where: { id },
    data: { ...rest, statusId, priority, slaDueAt },
    include: ticketDetailInclude,
  });

  await persistCustomFieldValues(id, customFields, fieldsResult.definitions);

  return NextResponse.json({ ticket });
}
