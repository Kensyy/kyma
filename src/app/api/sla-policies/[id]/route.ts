import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/api-auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  if ("error" in session) return session.error;
  const forbidden = requireAdmin(session.user);
  if (forbidden) return forbidden;

  const { id } = await params;
  const existing = await prisma.slaPolicy.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Deleting a policy doesn't touch tickets already given a due date under
  // it — only future creates/re-triages fall back to the next-best match.
  await prisma.slaPolicy.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
