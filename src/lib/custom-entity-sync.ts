import { prisma } from "@/lib/prisma";
import { isEmptyValue, validateCustomFieldValue } from "@/lib/custom-fields";
import type { CustomEntityFieldDefinitionModel } from "@/generated/prisma/models";
import type { RelationTargetType } from "@/generated/prisma/enums";

export type CustomEntityFieldsInput = Record<string, string | null> | undefined;

// Confirms a RELATION value actually points at a real row — the pure
// validateCustomFieldValue below only checks that something was submitted,
// since it doesn't have a database to check against. For CUSTOM_ENTITY, also
// confirms the record belongs to the specific target table (not just any
// custom entity record anywhere) — otherwise a Vendor id could be spoofed
// into a field that's supposed to link to Maintenance records.
async function relationTargetExists(
  target: RelationTargetType,
  id: string,
  relationTargetEntityId: string | null,
): Promise<boolean> {
  switch (target) {
    case "TICKET":
      return (
        (await prisma.ticket.findUnique({
          where: { id },
          select: { id: true },
        })) !== null
      );
    case "ASSET":
      return (
        (await prisma.asset.findUnique({
          where: { id },
          select: { id: true },
        })) !== null
      );
    case "USER":
      return (
        (await prisma.user.findUnique({
          where: { id },
          select: { id: true },
        })) !== null
      );
    case "CUSTOM_ENTITY":
      if (!relationTargetEntityId) return false;
      return (
        (await prisma.customEntityRecord.findFirst({
          where: { id, entityDefinitionId: relationTargetEntityId },
          select: { id: true },
        })) !== null
      );
  }
}

/**
 * Mirrors validateCustomFields in custom-field-sync.ts (Section 5.1) for
 * custom entity records (Section 5.4) — same requireAllRequired semantics,
 * plus a RELATION-specific existence check the Ticket/Asset engine doesn't
 * need.
 */
export async function validateCustomEntityFields(
  entityDefinitionId: string,
  fields: CustomEntityFieldsInput,
  { requireAllRequired = false }: { requireAllRequired?: boolean } = {},
): Promise<
  | { ok: true; definitions: CustomEntityFieldDefinitionModel[] }
  | { ok: false; errors: Record<string, string> }
> {
  if (!requireAllRequired && (!fields || Object.keys(fields).length === 0)) {
    return { ok: true, definitions: [] };
  }

  const definitions = requireAllRequired
    ? await prisma.customEntityFieldDefinition.findMany({
        where: { entityDefinitionId },
      })
    : await prisma.customEntityFieldDefinition.findMany({
        where: { entityDefinitionId, id: { in: Object.keys(fields ?? {}) } },
      });

  const toValidate = requireAllRequired
    ? definitions
    : definitions.filter((d) => fields && d.id in fields);

  const errors: Record<string, string> = {};
  for (const def of toValidate) {
    const raw = fields?.[def.id] ?? null;
    const result = validateCustomFieldValue(def, raw);
    if (!result.ok) {
      errors[def.id] = result.error;
      continue;
    }
    if (
      def.fieldType === "RELATION" &&
      def.relationTarget &&
      !isEmptyValue(raw)
    ) {
      const exists = await relationTargetExists(
        def.relationTarget,
        raw as string,
        def.relationTargetEntityId,
      );
      if (!exists) errors[def.id] = "Linked record was not found.";
    }
  }

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, definitions };
}

/** Mirrors persistCustomFieldValues in custom-field-sync.ts. */
export async function persistCustomEntityFieldValues(
  recordId: string,
  fields: CustomEntityFieldsInput,
  definitions: CustomEntityFieldDefinitionModel[],
): Promise<void> {
  if (!fields) return;
  const knownIds = new Set(definitions.map((d) => d.id));

  await Promise.all(
    Object.entries(fields).map(([fieldId, raw]) => {
      if (!knownIds.has(fieldId)) return Promise.resolve();

      if (isEmptyValue(raw)) {
        return prisma.customEntityFieldValue.deleteMany({
          where: { recordId, fieldDefinitionId: fieldId },
        });
      }

      return prisma.customEntityFieldValue.upsert({
        where: {
          recordId_fieldDefinitionId: { recordId, fieldDefinitionId: fieldId },
        },
        create: { recordId, fieldDefinitionId: fieldId, value: raw as string },
        update: { value: raw as string },
      });
    }),
  );
}
