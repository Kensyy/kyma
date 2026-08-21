import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  requireSession,
  requireWriteSession,
} from "@/lib/api-auth";
import { createCustomFieldDefinitionSchema } from "@/lib/validations/custom-field";

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const entityType = request.nextUrl.searchParams.get("entityType");
  if (entityType !== "TICKET" && entityType !== "ASSET") {
    return NextResponse.json(
      { error: "entityType must be TICKET or ASSET" },
      { status: 400 },
    );
  }

  const definitions = await prisma.customFieldDefinition.findMany({
    where: { entityType },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ definitions });
}

export async function POST(request: NextRequest) {
  const session = await requireWriteSession();
  if ("error" in session) return session.error;
  const forbidden = requireAdmin(session.user);
  if (forbidden) return forbidden;

  const body = await request.json();
  const parsed = createCustomFieldDefinitionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { entityType, options, ...rest } = parsed.data;

  const last = await prisma.customFieldDefinition.findFirst({
    where: { entityType },
    orderBy: { order: "desc" },
  });

  const definition = await prisma.customFieldDefinition.create({
    data: {
      ...rest,
      entityType,
      options: options ?? undefined,
      order: (last?.order ?? 0) + 1,
    },
  });

  return NextResponse.json({ definition }, { status: 201 });
}
