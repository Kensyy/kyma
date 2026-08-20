import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { createCustomEntityRecordSchema } from "@/lib/validations/custom-entity";
import { customEntityRecordListInclude } from "@/lib/types/custom-entity";
import {
  persistCustomEntityFieldValues,
  validateCustomEntityFields,
} from "@/lib/custom-entity-sync";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const { slug } = await params;
  const entityDefinition = await prisma.customEntityDefinition.findUnique({
    where: { slug },
  });
  if (!entityDefinition) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const records = await prisma.customEntityRecord.findMany({
    where: { entityDefinitionId: entityDefinition.id },
    include: customEntityRecordListInclude,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ records });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const { slug } = await params;
  const entityDefinition = await prisma.customEntityDefinition.findUnique({
    where: { slug },
  });
  if (!entityDefinition) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = createCustomEntityRecordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const fieldsResult = await validateCustomEntityFields(
    entityDefinition.id,
    parsed.data.fields,
    { requireAllRequired: true },
  );
  if (!fieldsResult.ok) {
    return NextResponse.json(
      { error: { fields: fieldsResult.errors } },
      { status: 400 },
    );
  }

  const record = await prisma.customEntityRecord.create({
    data: {
      entityDefinitionId: entityDefinition.id,
      createdById: session.user.id,
    },
    include: customEntityRecordListInclude,
  });

  await persistCustomEntityFieldValues(
    record.id,
    parsed.data.fields,
    fieldsResult.definitions,
  );

  return NextResponse.json({ record }, { status: 201 });
}
