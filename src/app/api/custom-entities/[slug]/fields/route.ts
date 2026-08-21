import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireWriteSession } from "@/lib/api-auth";
import { createCustomEntityFieldDefinitionSchema } from "@/lib/validations/custom-entity";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await requireWriteSession();
  if ("error" in session) return session.error;
  const forbidden = requireAdmin(session.user);
  if (forbidden) return forbidden;

  const { slug } = await params;
  const entityDefinition = await prisma.customEntityDefinition.findUnique({
    where: { slug },
  });
  if (!entityDefinition) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = createCustomEntityFieldDefinitionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { options, relationTarget, relationTargetEntityId, ...rest } =
    parsed.data;

  if (relationTarget === "CUSTOM_ENTITY" && relationTargetEntityId) {
    const target = await prisma.customEntityDefinition.findUnique({
      where: { id: relationTargetEntityId },
    });
    if (!target) {
      return NextResponse.json(
        { error: "Target table not found" },
        { status: 400 },
      );
    }
  }

  const last = await prisma.customEntityFieldDefinition.findFirst({
    where: { entityDefinitionId: entityDefinition.id },
    orderBy: { order: "desc" },
  });

  const field = await prisma.customEntityFieldDefinition.create({
    data: {
      ...rest,
      entityDefinitionId: entityDefinition.id,
      options: options ?? undefined,
      relationTarget,
      relationTargetEntityId:
        relationTarget === "CUSTOM_ENTITY" ? relationTargetEntityId : undefined,
      order: (last?.order ?? 0) + 1,
    },
  });

  return NextResponse.json({ field }, { status: 201 });
}
