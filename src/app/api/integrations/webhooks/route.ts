import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/api-auth";
import { createWebhookSubscriptionSchema } from "@/lib/validations/integration";

export async function GET() {
  const session = await requireSession();
  if ("error" in session) return session.error;
  const forbidden = requireAdmin(session.user);
  if (forbidden) return forbidden;

  const subscriptions = await prisma.webhookSubscription.findMany({
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ subscriptions });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if ("error" in session) return session.error;
  const forbidden = requireAdmin(session.user);
  if (forbidden) return forbidden;

  const body = await request.json();
  const parsed = createWebhookSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const subscription = await prisma.webhookSubscription.create({
    data: parsed.data,
  });

  return NextResponse.json({ subscription }, { status: 201 });
}
