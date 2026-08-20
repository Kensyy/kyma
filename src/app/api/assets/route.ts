import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { createAssetSchema } from "@/lib/validations/asset";
import { assetListInclude } from "@/lib/types/asset";
import {
  persistCustomFieldValues,
  validateCustomFields,
} from "@/lib/custom-field-sync";

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const params = request.nextUrl.searchParams;
  const statusId = params.get("status");
  const typeId = params.get("type");
  const owner = params.get("owner");
  const q = params.get("q");

  const where: Prisma.AssetWhereInput = {};
  if (statusId) where.statusId = statusId;
  if (typeId) where.typeId = typeId;
  if (owner === "me") where.ownerId = session.user.id;
  else if (owner === "unassigned") where.ownerId = null;
  else if (owner) where.ownerId = owner;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { serialNumber: { contains: q, mode: "insensitive" } },
    ];
  }

  const assets = await prisma.asset.findMany({
    where,
    include: assetListInclude,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ assets });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const body = await request.json();
  const parsed = createAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { typeId, statusId, purchasedAt, customFields, ...rest } = parsed.data;

  const [type, status] = await Promise.all([
    prisma.assetType.findUnique({ where: { id: typeId } }),
    prisma.status.findUnique({ where: { id: statusId } }),
  ]);
  if (!type) {
    return NextResponse.json({ error: "Invalid asset type" }, { status: 400 });
  }
  if (!status || status.entityType !== "ASSET") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const fieldsResult = await validateCustomFields("ASSET", customFields, {
    requireAllRequired: true,
  });
  if (!fieldsResult.ok) {
    return NextResponse.json(
      { error: { customFields: fieldsResult.errors } },
      { status: 400 },
    );
  }

  const asset = await prisma.asset.create({
    data: {
      ...rest,
      typeId,
      statusId,
      purchasedAt: purchasedAt ? new Date(purchasedAt) : undefined,
      history: {
        create: { eventType: "CREATED", userId: session.user.id },
      },
    },
    include: assetListInclude,
  });

  await persistCustomFieldValues(
    asset.id,
    customFields,
    fieldsResult.definitions,
  );

  return NextResponse.json({ asset }, { status: 201 });
}
