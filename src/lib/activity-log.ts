import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { EntityType } from "@/generated/prisma/enums";

type LogActivityInput = {
  entityType: EntityType;
  entityId: string;
  actorId: string;
  action: string;
  metadata?: Prisma.InputJsonValue;
};

/**
 * Records one row in the system-wide audit trail (Section 6, Milestone 10).
 * Distinct from AssetHistory: AssetHistory is a presentation-focused,
 * per-asset check-in/out timeline shown on the asset detail page;
 * ActivityLog is a generic entityType/entityId feed across every entity,
 * surfaced admin-wide at /admin/activity. Assets get entries in both.
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  await prisma.activityLog.create({ data: input });
}
