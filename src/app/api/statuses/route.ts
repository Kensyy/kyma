import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

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

  const statuses = await prisma.status.findMany({
    where: { entityType },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ statuses });
}
