import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireWriteSession } from "@/lib/api-auth";
import { updateCustomFieldDefinitionSchema } from "@/lib/validations/custom-field";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireWriteSession();
  if ("error" in session) return session.error;
  const forbidden = requireAdmin(session.user);
  if (forbidden) return forbidden;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateCustomFieldDefinitionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.customFieldDefinition.findUnique({
    where: { id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { options, ...rest } = parsed.data;

  const definition = await prisma.customFieldDefinition.update({
    where: { id },
    data: { ...rest, options: options ?? undefined },
  });

  return NextResponse.json({ definition });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireWriteSession();
  if ("error" in session) return session.error;
  const forbidden = requireAdmin(session.user);
  if (forbidden) return forbidden;

  const { id } = await params;
  const existing = await prisma.customFieldDefinition.findUnique({
    where: { id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // CustomFieldValue rows for this definition cascade-delete (schema
  // relation), so removing a definition cleans up its stored values too.
  await prisma.customFieldDefinition.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
