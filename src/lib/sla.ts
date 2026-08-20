import type { Priority } from "@/generated/prisma/enums";

// Simple fixed SLA policy by priority — no per-org configuration yet
// (CLAUDE.md Section 10 leaves finer SLA rules for later polish).
const SLA_HOURS_BY_PRIORITY: Record<Priority, number> = {
  URGENT: 4,
  HIGH: 24,
  MEDIUM: 72,
  LOW: 120,
};

export function computeSlaDueAt(
  priority: Priority,
  from: Date = new Date(),
): Date {
  const hours = SLA_HOURS_BY_PRIORITY[priority];
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
