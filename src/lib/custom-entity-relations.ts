import { prisma } from "@/lib/prisma";
import { formatTicketNumber } from "@/lib/ticket-number";
import type { RelationTargetType } from "@/generated/prisma/enums";

/**
 * A custom entity record has no built-in "name" the way a Ticket has
 * `title` or an Asset has `name` — it's just whatever fields the admin
 * added. `displayFieldId` (Section 5.4) is the admin's explicit choice of
 * which field represents a record everywhere one needs to be shown: a
 * relation picker on another table, this table's own detail header, and
 * (via resolveRelationLabel below) any RELATION field's rendered value.
 * Falls back to the first field by `order` when the admin hasn't set one.
 */
export async function getCustomEntityRecordLabel(
  recordId: string,
): Promise<string | null> {
  const record = await prisma.customEntityRecord.findUnique({
    where: { id: recordId },
    include: { entityDefinition: true, values: true },
  });
  if (!record) return null;

  const displayFieldId =
    record.entityDefinition.displayFieldId ??
    (
      await prisma.customEntityFieldDefinition.findFirst({
        where: { entityDefinitionId: record.entityDefinitionId },
        orderBy: { order: "asc" },
      })
    )?.id;
  if (!displayFieldId) return null;

  return (
    record.values.find((v) => v.fieldDefinitionId === displayFieldId)?.value ??
    null
  );
}

/** Renders a human label for whatever a RELATION field's value points at. */
export async function resolveRelationLabel(
  target: RelationTargetType,
  id: string,
): Promise<string | null> {
  switch (target) {
    case "TICKET": {
      const [ticket, settings] = await Promise.all([
        prisma.ticket.findUnique({
          where: { id },
          select: { ticketNumber: true, title: true },
        }),
        prisma.appSettings.findFirst(),
      ]);
      if (!ticket) return null;
      return `${formatTicketNumber(settings?.ticketPrefix ?? "KYM", ticket.ticketNumber)} — ${ticket.title}`;
    }
    case "ASSET": {
      const asset = await prisma.asset.findUnique({
        where: { id },
        select: { name: true },
      });
      return asset?.name ?? null;
    }
    case "USER": {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { name: true },
      });
      return user?.name ?? null;
    }
    case "CUSTOM_ENTITY":
      return getCustomEntityRecordLabel(id);
  }
}
