import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireWriteSession } from "@/lib/api-auth";
import { updateCustomEntityFieldDefinitionSchema } from "@/lib/validations/custom-entity";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; fieldId: string }> },
) {
  const session = await requireWriteSession();
  if ("error" in session) return session.error;
  const forbidden = requireAdmin(session.user);
  if (forbidden) return forbidden;

  const { fieldId } = await params;
  const body = await request.json();
  const parsed = updateCustomEntityFieldDefinitionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.customEntityFieldDefinition.findUnique({
    where: { id: fieldId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { options, ...rest } = parsed.data;

  const field = await prisma.customEntityFieldDefinition.update({
    where: { id: fieldId },
    data: { ...rest, options: options ?? undefined },
  });

  return NextResponse.json({ field });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; fieldId: string }> },
) {
  const session = await requireWriteSession();
  if ("error" in session) return session.error;
  const forbidden = requireAdmin(session.user);
  if (forbidden) return forbidden;

  const { fieldId } = await params;
  const existing = await prisma.customEntityFieldDefinition.findUnique({
    where: { id: fieldId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // CustomEntityFieldValue rows cascade-delete (schema relation).
  await prisma.customEntityFieldDefinition.delete({ where: { id: fieldId } });

  return NextResponse.json({ ok: true });
}
