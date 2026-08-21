import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWriteSession } from "@/lib/api-auth";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireWriteSession();
  if ("error" in session) return session.error;

  const { id } = await params;
  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const notification = await prisma.notification.update({
    where: { id },
    data: { read: true },
  });

  return NextResponse.json({ notification });
}
