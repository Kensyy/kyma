import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { updateAssetSchema } from "@/lib/validations/asset";
import { assetDetailInclude } from "@/lib/types/asset";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const { id } = await params;
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: assetDetailInclude,
  });

  if (!asset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ asset });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
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

  const { typeId, statusId, purchasedAt, ...rest } = parsed.data;

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

  return NextResponse.json({ asset });
}
