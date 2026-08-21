import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWriteSession } from "@/lib/api-auth";

export async function POST() {
  const session = await requireWriteSession();
  if ("error" in session) return session.error;

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
