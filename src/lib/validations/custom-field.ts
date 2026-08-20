import { z } from "zod";

export const entityTypeEnum = z.enum(["TICKET", "ASSET"]);

// fieldDefinitionId -> raw string value (Section 5.1 — values are always
// stored as strings; validated per field type server-side). Shared between
// the ticket and asset create/update schemas so both entities submit custom
// fields the same shape.
export const customFieldsShape = z
  .record(z.string(), z.string().nullable())
  .optional();
export const customFieldTypeEnum = z.enum([
  "TEXT",
  "NUMBER",
  "SELECT",
  "DATE",
  "BOOLEAN",
]);

export const createCustomFieldDefinitionSchema = z
  .object({
    entityType: entityTypeEnum,
    name: z.string().trim().min(1, "Name is required.").max(100),
    fieldType: customFieldTypeEnum,
    options: z.array(z.string().trim().min(1)).max(50).optional(),
    required: z.boolean(),
  })
  .refine(
    (data) => data.fieldType !== "SELECT" || (data.options?.length ?? 0) > 0,
    {
      message: "Select fields need at least one option.",
      path: ["options"],
    },
  );

export type CreateCustomFieldDefinitionInput = z.infer<
  typeof createCustomFieldDefinitionSchema
>;

export const updateCustomFieldDefinitionSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  options: z.array(z.string().trim().min(1)).max(50).optional(),
  required: z.boolean().optional(),
  order: z.number().int().optional(),
});

export type UpdateCustomFieldDefinitionInput = z.infer<
  typeof updateCustomFieldDefinitionSchema
>;
