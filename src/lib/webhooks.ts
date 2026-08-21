import { prisma } from "@/lib/prisma";
import type { WebhookEvent } from "@/generated/prisma/enums";

// Fixed id (not @default(cuid()) — User.id has no default since Better Auth
// normally assigns it) so this is idempotent: every inbound-webhook ticket
// attributes to the same account instead of minting a new user per request.
const SYSTEM_USER_ID = "system-integrations";

/** The account inbound-webhook tickets are created under (Section 5.5). */
export async function getIntegrationSystemUser() {
  return prisma.user.upsert({
    where: { id: SYSTEM_USER_ID },
    create: {
      id: SYSTEM_USER_ID,
      name: "Integrations",
      email: "integrations@kyma.local",
      emailVerified: true,
      role: "STAFF",
    },
    update: {},
  });
}

/**
 * Fires every active subscription for `event` — best-effort only (Section
 * 10): failures are swallowed so a down or slow subscriber never blocks the
 * request that triggered it. No retry queue, since that needs
 * infrastructure this deployment doesn't have.
 */
export async function dispatchWebhook(
  event: WebhookEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  const subscriptions = await prisma.webhookSubscription.findMany({
    where: { event, active: true },
  });
  if (subscriptions.length === 0) return;

  await Promise.all(
    subscriptions.map((sub) =>
      fetch(sub.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, ...payload }),
        signal: AbortSignal.timeout(5000),
      }).catch(() => {
        // Best-effort — see the doc comment above.
      }),
    ),
  );
}
