import { prisma } from "@/lib/prisma";
import { isEmptyValue, validateCustomFieldValue } from "@/lib/custom-fields";
import type { CustomFieldDefinitionModel } from "@/generated/prisma/models";
import type { EntityType } from "@/generated/prisma/enums";

export type CustomFieldsInput = Record<string, string | null> | undefined;

/**
 * Fetches the relevant definitions and validates a { fieldDefinitionId:
 * value } submission against them, without writing anything — lets a
 * create route reject bad custom-field input before the entity itself
 * is created.
 *
 * `requireAllRequired` controls how "missing" is treated: on create, every
 * required definition must have a non-empty value even if its id was never
 * included in `customFields` at all (a field the user never touched is
 * still missing). On update, only the fields actually present in the patch
 * are checked — an update to just `status`, say, shouldn't be rejected for
 * not re-submitting every required custom field.
 */
export async function validateCustomFields(
  entityType: EntityType,
  customFields: CustomFieldsInput,
  { requireAllRequired = false }: { requireAllRequired?: boolean } = {},
): Promise<
  | { ok: true; definitions: CustomFieldDefinitionModel[] }
  | { ok: false; errors: Record<string, string> }
> {
  if (
    !requireAllRequired &&
    (!customFields || Object.keys(customFields).length === 0)
  ) {
    return { ok: true, definitions: [] };
  }

  const definitions = requireAllRequired
    ? await prisma.customFieldDefinition.findMany({ where: { entityType } })
    : await prisma.customFieldDefinition.findMany({
        where: { entityType, id: { in: Object.keys(customFields ?? {}) } },
      });

  const toValidate = requireAllRequired
    ? definitions
    : definitions.filter((d) => customFields && d.id in customFields);

  const errors: Record<string, string> = {};
  for (const def of toValidate) {
    const raw = customFields?.[def.id] ?? null;
    const result = validateCustomFieldValue(def, raw);
    if (!result.ok) errors[def.id] = result.error;
  }

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, definitions };
}

/**
 * Writes an already-validated custom-field submission: upserts non-empty
 * values, deletes cleared ones. Unknown field ids are silently skipped.
 */
export async function persistCustomFieldValues(
  entityId: string,
  customFields: CustomFieldsInput,
  definitions: CustomFieldDefinitionModel[],
): Promise<void> {
  if (!customFields) return;
  const knownIds = new Set(definitions.map((d) => d.id));

  await Promise.all(
    Object.entries(customFields).map(([fieldId, raw]) => {
      if (!knownIds.has(fieldId)) return Promise.resolve();

      if (isEmptyValue(raw)) {
        return prisma.customFieldValue.deleteMany({
          where: { entityId, fieldDefinitionId: fieldId },
        });
      }

      return prisma.customFieldValue.upsert({
        where: {
          entityId_fieldDefinitionId: { entityId, fieldDefinitionId: fieldId },
        },
        create: { entityId, fieldDefinitionId: fieldId, value: raw as string },
        update: { value: raw as string },
      });
    }),
  );
}
