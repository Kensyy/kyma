import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireWriteSession } from "@/lib/api-auth";
import { createCustomEntityRecordSchema } from "@/lib/validations/custom-entity";
import { customEntityRecordListInclude } from "@/lib/types/custom-entity";
import {
  persistCustomEntityFieldValues,
  validateCustomEntityFields,
} from "@/lib/custom-entity-sync";
import { resolveRelationLabel } from "@/lib/custom-entity-relations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const { slug } = await params;
  const entityDefinition = await prisma.customEntityDefinition.findUnique({
    where: { slug },
    include: { fields: { orderBy: { order: "asc" } } },
  });
  if (!entityDefinition) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const records = await prisma.customEntityRecord.findMany({
    where: { entityDefinitionId: entityDefinition.id },
    include: customEntityRecordListInclude,
    orderBy: { createdAt: "desc" },
  });

  const displayFieldId =
    entityDefinition.displayFieldId ?? entityDefinition.fields[0]?.id ?? null;
  const relationFields = entityDefinition.fields.filter(
    (f) => f.fieldType === "RELATION" && f.relationTarget,
  );

  // Resolve every RELATION field's raw id into a human label, and this
  // record's own display label (Section 5.4) — both reuse the same
  // resolver, so a table showing up as a relation target elsewhere renders
  // consistently with how it renders itself.
  const recordsWithLabels = await Promise.all(
    records.map(async (record) => {
      const [label, resolvedEntries] = await Promise.all([
        displayFieldId
          ? Promise.resolve(
              record.values.find((v) => v.fieldDefinitionId === displayFieldId)
                ?.value ?? null,
            )
          : Promise.resolve(null),
        Promise.all(
          relationFields.map(async (field) => {
            const raw = record.values.find(
              (v) => v.fieldDefinitionId === field.id,
            )?.value;
            if (!raw || !field.relationTarget) return null;
            const resolved = await resolveRelationLabel(
              field.relationTarget,
              raw,
            );
            return [field.id, resolved] as const;
          }),
        ),
      ]);

      const resolvedValues = Object.fromEntries(
        resolvedEntries.filter(
          (entry): entry is [string, string | null] => entry !== null,
        ),
      );

      return { ...record, label, resolvedValues };
    }),
  );

  return NextResponse.json({ records: recordsWithLabels });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await requireWriteSession();
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
