import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const session = await requireSession();
  if ("error" in session) return session.error;
  const forbidden = requireAdmin(session.user);
  if (forbidden) return forbidden;

  const entityType = request.nextUrl.searchParams.get("entityType");
  const where: Prisma.ActivityLogWhereInput = {};
  if (entityType === "TICKET" || entityType === "ASSET") {
    where.entityType = entityType;
  }

  const entries = await prisma.activityLog.findMany({
    where,
    include: { actor: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ entries });
}
