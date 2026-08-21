import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inboundTicketSchema } from "@/lib/validations/integration";
import { computeSlaDueAt } from "@/lib/sla";
import { ticketListInclude } from "@/lib/types/ticket";
import { logActivity } from "@/lib/activity-log";
import { dispatchWebhook, getIntegrationSystemUser } from "@/lib/webhooks";

/**
 * The inbound half of Section 5.5 — no session, since the caller is an
 * external system (a TeamDynamix flow, a firewall/SIEM alert), not a
 * logged-in user. `apiKey` in the URL is the source's own secret, handed
 * out when an admin creates it at /admin/integrations — that's the only
 * auth this route has, matching the scope of a portfolio deployment rather
 * than a production-hardened webhook receiver (real HMAC signing / rate
 * limiting would be the next step, not built here).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ apiKey: string }> },
) {
  const { apiKey } = await params;
  const source = await prisma.integrationSource.findUnique({
    where: { apiKey },
  });
  if (!source) {
    return NextResponse.json({ error: "Unknown source" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = inboundTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const [status, systemUser] = await Promise.all([
    prisma.status.findFirst({
      where: { entityType: "TICKET" },
      orderBy: { order: "asc" },
    }),
    getIntegrationSystemUser(),
  ]);
  if (!status) {
    return NextResponse.json(
      { error: "No ticket status configured" },
      { status: 500 },
    );
  }

  const priority = parsed.data.priority ?? "MEDIUM";
  const ticket = await prisma.ticket.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      priority,
      statusId: status.id,
      createdById: systemUser.id,
      sourceId: source.id,
      externalRef: parsed.data.externalRef,
      slaDueAt: computeSlaDueAt(priority),
    },
    include: ticketListInclude,
  });

  await logActivity({
    entityType: "TICKET",
    entityId: ticket.id,
    actorId: systemUser.id,
    action: "TICKET_CREATED",
    metadata: { source: source.name },
  });

  await dispatchWebhook("TICKET_CREATED", {
    ticketId: ticket.id,
    title: ticket.title,
    priority: ticket.priority,
    source: source.name,
  });

  return NextResponse.json({ ticket }, { status: 201 });
}
