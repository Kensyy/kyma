import type {
  CustomEntityFieldType,
  CustomFieldType,
} from "@/generated/prisma/enums";

// Shared between Ticket/Asset custom fields (Section 5.1, CustomFieldType —
// no RELATION) and custom entity table fields (Section 5.4,
// CustomEntityFieldType — adds RELATION). RELATION only gets a presence
// check here; whether the linked id actually exists is a DB lookup done by
// the async sync layer (custom-entity-sync.ts), not this pure function.
export type FieldDefinitionLike = {
  fieldType: CustomFieldType | CustomEntityFieldType;
  options: unknown;
  required: boolean;
};

export function fieldOptions(options: unknown): string[] {
  return Array.isArray(options)
    ? options.filter((o): o is string => typeof o === "string")
    : [];
}

export function isEmptyValue(raw: string | null | undefined): boolean {
  return raw === null || raw === undefined || raw.trim() === "";
}

/**
 * Validates a raw string value (CustomFieldValue.value is always stored as
 * a string — Section 5.1) against its field definition's type/options.
 */
export function validateCustomFieldValue(
  def: FieldDefinitionLike,
  raw: string | null | undefined,
): { ok: true } | { ok: false; error: string } {
  if (isEmptyValue(raw)) {
    return def.required
      ? { ok: false, error: "This field is required." }
      : { ok: true };
  }

  const value = raw as string;

  switch (def.fieldType) {
    case "TEXT":
      return { ok: true };
    case "NUMBER":
      return Number.isFinite(Number(value))
        ? { ok: true }
        : { ok: false, error: "Must be a number." };
    case "DATE":
      return Number.isNaN(Date.parse(value))
        ? { ok: false, error: "Must be a valid date." }
        : { ok: true };
    case "BOOLEAN":
      return value === "true" || value === "false"
        ? { ok: true }
        : { ok: false, error: "Must be true or false." };
    case "SELECT": {
      const options = fieldOptions(def.options);
      return options.includes(value)
        ? { ok: true }
        : { ok: false, error: `Must be one of: ${options.join(", ")}.` };
    }
    default:
      return { ok: true };
  }
}
