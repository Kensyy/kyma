import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  requireSession,
  requireWriteSession,
} from "@/lib/api-auth";
import { createIntegrationSourceSchema } from "@/lib/validations/integration";

export async function GET() {
  const session = await requireSession();
  if ("error" in session) return session.error;
  const forbidden = requireAdmin(session.user);
  if (forbidden) return forbidden;

  const sources = await prisma.integrationSource.findMany({
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ sources });
}

export async function POST(request: NextRequest) {
  const session = await requireWriteSession();
  if ("error" in session) return session.error;
  const forbidden = requireAdmin(session.user);
  if (forbidden) return forbidden;

  const body = await request.json();
  const parsed = createIntegrationSourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.integrationSource.findUnique({
    where: { name: parsed.data.name },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A source with that name already exists" },
      { status: 400 },
    );
  }

  const source = await prisma.integrationSource.create({
    data: { name: parsed.data.name },
  });

  return NextResponse.json({ source }, { status: 201 });
}
