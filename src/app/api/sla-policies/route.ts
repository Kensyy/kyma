import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  requireSession,
  requireWriteSession,
} from "@/lib/api-auth";
import { createSlaPolicySchema } from "@/lib/validations/sla-policy";

export async function GET() {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const policies = await prisma.slaPolicy.findMany({
    include: { category: { select: { id: true, label: true } } },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ policies });
}

export async function POST(request: NextRequest) {
  const session = await requireWriteSession();
  if ("error" in session) return session.error;
  const forbidden = requireAdmin(session.user);
  if (forbidden) return forbidden;

  const body = await request.json();
  const parsed = createSlaPolicySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { priority, categoryId, hours } = parsed.data;

  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category || category.entityType !== "TICKET") {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
  }

  // The @@unique([priority, categoryId]) constraint only catches this for a
  // real categoryId — Postgres treats every NULL as distinct, so two
  // priority-only (categoryId: null) rows wouldn't collide at the DB level.
  // Checking explicitly covers both cases with one friendly error either way.
  const existing = await prisma.slaPolicy.findFirst({
    where: { priority, categoryId: categoryId ?? null },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A policy for this priority and category already exists" },
      { status: 400 },
    );
  }

  const policy = await prisma.slaPolicy.create({
    data: { priority, categoryId, hours },
    include: { category: { select: { id: true, label: true } } },
  });

  return NextResponse.json({ policy }, { status: 201 });
}
