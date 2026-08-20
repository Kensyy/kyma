import { z } from "zod";

// Plain "YYYY-MM-DD" from <input type="date">, not full ISO. An empty
// string (nothing picked) is treated as "no date" downstream rather than
// rejected — keeping this a plain optional string (no zod .transform())
// avoids react-hook-form's resolver typing breaking on input/output drift.
const dateOnly = z.string().trim().optional();

export const createAssetSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200),
  typeId: z.string().min(1, "Type is required."),
  statusId: z.string().min(1, "Status is required."),
  serialNumber: z.string().trim().max(100).optional(),
  location: z.string().trim().max(200).optional(),
  ownerId: z.string().min(1).optional(),
  branchId: z.string().min(1).optional(),
  purchasedAt: dateOnly,
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;

export const updateAssetSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  typeId: z.string().min(1).optional(),
  statusId: z.string().min(1).optional(),
  serialNumber: z.string().trim().max(100).nullable().optional(),
  location: z.string().trim().max(200).nullable().optional(),
  ownerId: z.string().min(1).nullable().optional(),
  purchasedAt: dateOnly.nullable(),
});

export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
