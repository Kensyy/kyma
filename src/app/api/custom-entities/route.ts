import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/api-auth";
import { createCustomEntityDefinitionSchema } from "@/lib/validations/custom-entity";
import { customEntityDefinitionWithFieldsInclude } from "@/lib/types/custom-entity";
import { slugify, uniqueSlug } from "@/lib/slug";

export async function GET() {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const definitions = await prisma.customEntityDefinition.findMany({
    include: customEntityDefinitionWithFieldsInclude,
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ definitions });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if ("error" in session) return session.error;
  const forbidden = requireAdmin(session.user);
  if (forbidden) return forbidden;

  const body = await request.json();
  const parsed = createCustomEntityDefinitionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const [existingSlugs, last] = await Promise.all([
    prisma.customEntityDefinition.findMany({ select: { slug: true } }),
    prisma.customEntityDefinition.findFirst({ orderBy: { order: "desc" } }),
  ]);
  const slug = uniqueSlug(
    slugify(parsed.data.name),
    new Set(existingSlugs.map((s) => s.slug)),
  );

  const definition = await prisma.customEntityDefinition.create({
    data: { name: parsed.data.name, slug, order: (last?.order ?? 0) + 1 },
    include: customEntityDefinitionWithFieldsInclude,
  });

  return NextResponse.json({ definition }, { status: 201 });
}
