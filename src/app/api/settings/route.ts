import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET() {
  const session = await requireSession();
  if ("error" in session) return session.error;

  const settings = await prisma.appSettings.findFirst();

  return NextResponse.json({ ticketPrefix: settings?.ticketPrefix ?? "KYM" });
}
