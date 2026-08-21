import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireWriteSession } from "@/lib/api-auth";
import { updateCustomEntityRecordSchema } from "@/lib/validations/custom-entity";
import { customEntityRecordListInclude } from "@/lib/types/custom-entity";
import {
  persistCustomEntityFieldValues,
  validateCustomEntityFields,
} from "@/lib/custom-entity-sync";

async function loadFieldEntries(entityDefinitionId: string, recordId: string) {
  const [definitions, values] = await Promise.all([
    prisma.customEntityFieldDefinition.findMany({
      where: { entityDefinitionId },
      orderBy: { order: "asc" },
    }),
    prisma.customEntityFieldValue.findMany({ where: { recordId } }),
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
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const { slug, id } = await params;
  const entityDefinition = await prisma.customEntityDefinition.findUnique({
    where: { slug },
  });
  if (!entityDefinition) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const record = await prisma.customEntityRecord.findUnique({
    where: { id },
    include: customEntityRecordListInclude,
  });
  if (!record || record.entityDefinitionId !== entityDefinition.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fields = await loadFieldEntries(entityDefinition.id, id);

  return NextResponse.json({ record, definition: entityDefinition, fields });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const session = await requireWriteSession();
  if ("error" in session) return session.error;

  const { slug, id } = await params;
  const entityDefinition = await prisma.customEntityDefinition.findUnique({
    where: { slug },
  });
  if (!entityDefinition) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.customEntityRecord.findUnique({
    where: { id },
  });
  if (!existing || existing.entityDefinitionId !== entityDefinition.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateCustomEntityRecordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const fieldsResult = await validateCustomEntityFields(
    entityDefinition.id,
    parsed.data.fields,
  );
  if (!fieldsResult.ok) {
    return NextResponse.json(
      { error: { fields: fieldsResult.errors } },
      { status: 400 },
    );
  }

  await persistCustomEntityFieldValues(
    id,
    parsed.data.fields,
    fieldsResult.definitions,
  );

  // Empty update still bumps `updatedAt` (@updatedAt) — field values live in
  // the separate CustomEntityFieldValue table, so the record row itself has
  // nothing else to change here.
  const record = await prisma.customEntityRecord.update({
    where: { id },
    data: {},
    include: customEntityRecordListInclude,
  });

  return NextResponse.json({ record });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const session = await requireWriteSession();
  if ("error" in session) return session.error;

  const { slug, id } = await params;
  const entityDefinition = await prisma.customEntityDefinition.findUnique({
    where: { slug },
  });
  if (!entityDefinition) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.customEntityRecord.findUnique({
    where: { id },
  });
  if (!existing || existing.entityDefinitionId !== entityDefinition.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // CustomEntityFieldValue rows cascade-delete (schema relation).
  await prisma.customEntityRecord.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
