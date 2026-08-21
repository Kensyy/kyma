import { z } from "zod";
import { priorityEnum } from "@/lib/validations/ticket";

export const createIntegrationSourceSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
});

export type CreateIntegrationSourceInput = z.infer<
  typeof createIntegrationSourceSchema
>;

export const webhookEventEnum = z.enum([
  "TICKET_CREATED",
  "TICKET_STATUS_CHANGED",
  "TICKET_ASSIGNED",
]);

export const createWebhookSubscriptionSchema = z.object({
  url: z.string().trim().url("Must be a valid URL."),
  event: webhookEventEnum,
});

export type CreateWebhookSubscriptionInput = z.infer<
  typeof createWebhookSubscriptionSchema
>;

// What an external system's webhook call sends — deliberately minimal
// (no custom-fields requirement) since the source doesn't know this
// deployment's org-specific fields. Priority defaults to MEDIUM so a
// minimal payload ({title, description}) still works.
export const inboundTicketSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200),
  description: z.string().trim().min(1, "Description is required."),
  priority: priorityEnum.optional(),
  externalRef: z.string().trim().max(200).optional(),
});

export type InboundTicketInput = z.infer<typeof inboundTicketSchema>;
