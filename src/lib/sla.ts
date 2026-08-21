import type { Priority } from "@/generated/prisma/enums";

// Falls back to this when no SlaPolicy row matches — keeps the app usable
// before an admin configures anything (Section 5.6).
const DEFAULT_SLA_HOURS_BY_PRIORITY: Record<Priority, number> = {
  URGENT: 4,
  HIGH: 24,
  MEDIUM: 72,
  LOW: 120,
};

export type SlaPolicyLike = {
  priority: Priority;
  categoryId: string | null;
  hours: number;
};

/**
 * Picks the SLA window for a (priority, category) pair — a category-specific
 * policy wins over the priority-only default, which wins over the hardcoded
 * fallback. Pure and DB-agnostic so it stays unit-testable; the caller
 * (computeTicketSlaDueAt in sla-policy.ts) is what actually queries
 * SlaPolicy.
 */
export function resolveSlaHours(
  priority: Priority,
  categoryId: string | null,
  policies: SlaPolicyLike[],
): number {
  if (categoryId) {
    const specific = policies.find(
      (p) => p.priority === priority && p.categoryId === categoryId,
    );
    if (specific) return specific.hours;
  }

  const generic = policies.find(
    (p) => p.priority === priority && p.categoryId === null,
  );
  if (generic) return generic.hours;

  return DEFAULT_SLA_HOURS_BY_PRIORITY[priority];
}

export function addHours(from: Date, hours: number): Date {
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

export function isSlaOverdue(
  slaDueAt: Date | null,
  statusIsTerminal: boolean,
  now: Date = new Date(),
): boolean {
  if (!slaDueAt || statusIsTerminal) return false;
  return slaDueAt.getTime() < now.getTime();
}
