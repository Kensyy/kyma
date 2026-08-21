import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function POST() {
  const session = await requireSession();
  if ("error" in session) return session.error;

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
