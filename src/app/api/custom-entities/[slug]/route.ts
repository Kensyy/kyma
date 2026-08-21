import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/api-auth";
import { updateCustomEntityDefinitionSchema } from "@/lib/validations/custom-entity";
import { customEntityDefinitionWithFieldsInclude } from "@/lib/types/custom-entity";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const { slug } = await params;
  const definition = await prisma.customEntityDefinition.findUnique({
    where: { slug },
    include: customEntityDefinitionWithFieldsInclude,
  });

  if (!definition) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ definition });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await requireSession();
  if ("error" in session) return session.error;
  const forbidden = requireAdmin(session.user);
  if (forbidden) return forbidden;

  const { slug } = await params;
  const body = await request.json();
  const parsed = updateCustomEntityDefinitionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.customEntityDefinition.findUnique({
    where: { slug },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (parsed.data.displayFieldId) {
    const field = await prisma.customEntityFieldDefinition.findUnique({
      where: { id: parsed.data.displayFieldId },
    });
    if (!field || field.entityDefinitionId !== existing.id) {
      return NextResponse.json(
        { error: "Display field must belong to this table" },
        { status: 400 },
      );
    }
  }

  // Renaming doesn't reslug an existing table — the slug is its stable URL
  // (/tables/[slug]); changing it out from under bookmarks/links would be
  // more surprising than a display name that's drifted from the URL.
  const definition = await prisma.customEntityDefinition.update({
    where: { slug },
    data: parsed.data,
    include: customEntityDefinitionWithFieldsInclude,
  });

  return NextResponse.json({ definition });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await requireSession();
  if ("error" in session) return session.error;
  const forbidden = requireAdmin(session.user);
  if (forbidden) return forbidden;

  const { slug } = await params;
  const existing = await prisma.customEntityDefinition.findUnique({
    where: { slug },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // A field on another table can have a RELATION pointing at this one — a
  // self-relation is fine (it disappears along with the table itself), but
  // deleting out from under a different table would silently null out that
  // field's relationTargetEntityId, so block it with a clear error instead.
  const referencedBy = await prisma.customEntityFieldDefinition.count({
    where: {
      relationTargetEntityId: existing.id,
      entityDefinitionId: { not: existing.id },
    },
  });
  if (referencedBy > 0) {
    return NextResponse.json(
      {
        error: `${referencedBy} field(s) on other tables link to this one — remove those fields first.`,
      },
      { status: 400 },
    );
  }

  // Fields, records, and their values all cascade-delete via the schema
  // relations.
  await prisma.customEntityDefinition.delete({ where: { slug } });

  return NextResponse.json({ ok: true });
}
