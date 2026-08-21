import { z } from "zod";
import { customFieldsShape } from "@/lib/validations/custom-field";

export const createCustomEntityDefinitionSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
});

export type CreateCustomEntityDefinitionInput = z.infer<
  typeof createCustomEntityDefinitionSchema
>;

export const updateCustomEntityDefinitionSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  order: z.number().int().optional(),
  // Which of this table's own fields represents a record elsewhere (Section
  // 5.4) — null clears it back to the first-field-by-order fallback.
  displayFieldId: z.string().nullable().optional(),
});

export type UpdateCustomEntityDefinitionInput = z.infer<
  typeof updateCustomEntityDefinitionSchema
>;

export const customEntityFieldTypeEnum = z.enum([
  "TEXT",
  "NUMBER",
  "SELECT",
  "DATE",
  "BOOLEAN",
  "RELATION",
]);
export const relationTargetEnum = z.enum([
  "TICKET",
  "ASSET",
  "USER",
  "CUSTOM_ENTITY",
]);

export const createCustomEntityFieldDefinitionSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(100),
    fieldType: customEntityFieldTypeEnum,
    options: z.array(z.string().trim().min(1)).max(50).optional(),
    relationTarget: relationTargetEnum.optional(),
    // Only set (and required) when relationTarget is CUSTOM_ENTITY — which
    // other admin-defined table this field links to.
    relationTargetEntityId: z.string().optional(),
    required: z.boolean(),
  })
  .refine(
    (data) => data.fieldType !== "SELECT" || (data.options?.length ?? 0) > 0,
    {
      message: "Select fields need at least one option.",
      path: ["options"],
    },
  )
  .refine((data) => data.fieldType !== "RELATION" || !!data.relationTarget, {
    message: "Relation fields need a target entity.",
    path: ["relationTarget"],
  })
  .refine(
    (data) =>
      data.relationTarget !== "CUSTOM_ENTITY" || !!data.relationTargetEntityId,
    {
      message: "Pick which table this field links to.",
      path: ["relationTargetEntityId"],
    },
  );

export type CreateCustomEntityFieldDefinitionInput = z.infer<
  typeof createCustomEntityFieldDefinitionSchema
>;

export const updateCustomEntityFieldDefinitionSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  options: z.array(z.string().trim().min(1)).max(50).optional(),
  required: z.boolean().optional(),
  order: z.number().int().optional(),
});

export type UpdateCustomEntityFieldDefinitionInput = z.infer<
  typeof updateCustomEntityFieldDefinitionSchema
>;

// A record's field values keyed by fieldDefinitionId — same shape as
// Ticket/Asset custom fields (Section 5.1).
export const createCustomEntityRecordSchema = z.object({
  fields: customFieldsShape,
});

export type CreateCustomEntityRecordInput = z.infer<
  typeof createCustomEntityRecordSchema
>;

export const updateCustomEntityRecordSchema = z.object({
  fields: customFieldsShape,
});

export type UpdateCustomEntityRecordInput = z.infer<
  typeof updateCustomEntityRecordSchema
>;
