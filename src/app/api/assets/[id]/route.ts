import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireSession,
  requireStaff,
  requireWriteSession,
} from "@/lib/api-auth";
import { updateAssetSchema } from "@/lib/validations/asset";
import { assetDetailInclude } from "@/lib/types/asset";
import {
  persistCustomFieldValues,
  validateCustomFields,
} from "@/lib/custom-field-sync";
import { logActivity } from "@/lib/activity-log";
import { notify } from "@/lib/notify";

async function loadCustomFields(assetId: string) {
  const [definitions, values] = await Promise.all([
    prisma.customFieldDefinition.findMany({
      where: { entityType: "ASSET" },
      orderBy: { order: "asc" },
    }),
    prisma.customFieldValue.findMany({ where: { entityId: assetId } }),
  ]);
  const valueByDefId = new Map(
    values.map((v) => [v.fieldDefinitionId, v.value]),
  );
  return definitions.map((definition) => ({
    definition,
    value: valueByDefId.get(definition.id) ?? null,
  }));
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if ("error" in session) return session.error;
  const forbidden = requireStaff(session.user);
  if (forbidden) return forbidden;

  const { id } = await params;
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: assetDetailInclude,
  });

  if (!asset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const customFields = await loadCustomFields(id);

  return NextResponse.json({ asset, customFields });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireWriteSession();
  if ("error" in session) return session.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.asset.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { typeId, statusId, purchasedAt, customFields, ...rest } = parsed.data;

  if (typeId) {
    const type = await prisma.assetType.findUnique({ where: { id: typeId } });
    if (!type)
      return NextResponse.json(
        { error: "Invalid asset type" },
        { status: 400 },
      );
  }
  if (statusId) {
    const status = await prisma.status.findUnique({ where: { id: statusId } });
    if (!status || status.entityType !== "ASSET") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
  }

  const fieldsResult = await validateCustomFields("ASSET", customFields);
  if (!fieldsResult.ok) {
    return NextResponse.json(
      { error: { customFields: fieldsResult.errors } },
      { status: 400 },
    );
  }

  // Log check-in/check-out and status-change events so the asset's history
  // (Section 2's "check-in/check-out history") reflects real activity
  // instead of requiring a separate manual logging step.
  const historyEvents: { eventType: string; userId: string }[] = [];
  if (statusId && statusId !== existing.statusId) {
    historyEvents.push({
      eventType: "STATUS_CHANGED",
      userId: session.user.id,
    });
  }
  if ("ownerId" in parsed.data && parsed.data.ownerId !== existing.ownerId) {
    historyEvents.push({
      eventType: parsed.data.ownerId ? "CHECKED_OUT" : "CHECKED_IN",
      userId: session.user.id,
    });
  }

  const asset = await prisma.asset.update({
    where: { id },
    data: {
      ...rest,
      typeId,
      statusId,
      purchasedAt:
        purchasedAt === undefined
          ? undefined
          : purchasedAt
            ? new Date(purchasedAt)
            : null,
      history: historyEvents.length ? { create: historyEvents } : undefined,
    },
    include: assetDetailInclude,
  });

  await persistCustomFieldValues(id, customFields, fieldsResult.definitions);

  for (const event of historyEvents) {
    await logActivity({
      entityType: "ASSET",
      entityId: id,
      actorId: session.user.id,
      action: `ASSET_${event.eventType}`,
    });
  }

  if (
    "ownerId" in parsed.data &&
    parsed.data.ownerId &&
    parsed.data.ownerId !== existing.ownerId &&
    parsed.data.ownerId !== session.user.id
  ) {
    await notify({
      userId: parsed.data.ownerId,
      message: `"${asset.name}" was checked out to you`,
      entityType: "ASSET",
      entityId: id,
    });
  }

  return NextResponse.json({ asset });
}
