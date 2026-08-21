import { z } from "zod";
import { priorityEnum } from "@/lib/validations/ticket";

export const createSlaPolicySchema = z.object({
  priority: priorityEnum,
  categoryId: z.string().min(1).optional(),
  hours: z.coerce
    .number()
    .int()
    .min(1)
    .max(24 * 365),
});

export type CreateSlaPolicyInput = z.infer<typeof createSlaPolicySchema>;
