import { prisma } from "@/lib/prisma";
import { addHours, resolveSlaHours } from "@/lib/sla";
import type { Priority } from "@/generated/prisma/enums";

/** Computes a ticket's SLA due date from configured SlaPolicy rows (Section 5.6). */
export async function computeTicketSlaDueAt(
  priority: Priority,
  categoryId: string | null,
  from: Date = new Date(),
): Promise<Date> {
  const policies = await prisma.slaPolicy.findMany();
  const hours = resolveSlaHours(priority, categoryId, policies);
  return addHours(from, hours);
}
