import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

// Assignable users — Staff and Admin only (End User isn't a staff-facing
// assignee per the v1 scope decision in CLAUDE.md Section 10).
export async function GET() {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const users = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "STAFF"] } },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ users });
}
