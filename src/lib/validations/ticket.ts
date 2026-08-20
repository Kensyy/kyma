import { z } from "zod";

export const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

// fieldDefinitionId -> raw string value (Section 5.1 — values are always
// stored as strings; validated per field type server-side).
const customFieldsShape = z
  .record(z.string(), z.string().nullable())
  .optional();

export const createTicketSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200),
  description: z.string().trim().min(1, "Description is required."),
  priority: priorityEnum,
  statusId: z.string().min(1, "Status is required."),
  categoryId: z.string().min(1).optional(),
  assigneeId: z.string().min(1).optional(),
  branchId: z.string().min(1).optional(),
  customFields: customFieldsShape,
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const updateTicketSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().min(1).optional(),
  priority: priorityEnum.optional(),
  statusId: z.string().min(1).optional(),
  categoryId: z.string().min(1).nullable().optional(),
  assigneeId: z.string().min(1).nullable().optional(),
  assetId: z.string().min(1).nullable().optional(),
  customFields: customFieldsShape,
});

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, "Comment can't be empty."),
  isInternal: z.boolean().default(false),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
