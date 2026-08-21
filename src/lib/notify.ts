import { prisma } from "@/lib/prisma";
import type { EntityType } from "@/generated/prisma/enums";

type NotifyTarget = {
  userId: string;
  message: string;
  entityType?: EntityType;
  entityId?: string;
};

/**
 * Creates one in-app notification (Milestone 10 — no email delivery).
 * Callers are expected to already have excluded the acting user from the
 * recipient list where "don't notify yourself" applies — kept explicit at
 * each call site since the right exclusion differs by event (e.g. a comment
 * author vs. the person who reassigned a ticket).
 */
export async function notify(target: NotifyTarget): Promise<void> {
  await prisma.notification.create({ data: target });
}

/** Notifies several users at once, skipping duplicates and empty ids. */
export async function notifyMany(
  userIds: (string | null | undefined)[],
  message: string,
  entity?: { entityType: EntityType; entityId: string },
): Promise<void> {
  const uniqueIds = [...new Set(userIds.filter((id): id is string => !!id))];
  if (uniqueIds.length === 0) return;

  await prisma.notification.createMany({
    data: uniqueIds.map((userId) => ({
      userId,
      message,
      entityType: entity?.entityType,
      entityId: entity?.entityId,
    })),
  });
}
