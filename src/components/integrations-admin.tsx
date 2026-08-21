"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateIntegrationSource,
  useCreateWebhookSubscription,
  useDeleteIntegrationSource,
  useDeleteWebhookSubscription,
  useIntegrationSources,
  useUpdateIntegrationSource,
  useUpdateWebhookSubscription,
  useWebhookSubscriptions,
} from "@/hooks/use-integrations";
import type { CreateWebhookSubscriptionInput } from "@/lib/validations/integration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WEBHOOK_EVENTS = [
  "TICKET_CREATED",
  "TICKET_STATUS_CHANGED",
  "TICKET_ASSIGNED",
] as const;
const EVENT_LABEL: Record<(typeof WEBHOOK_EVENTS)[number], string> = {
  TICKET_CREATED: "Ticket created",
  TICKET_STATUS_CHANGED: "Ticket status changed",
  TICKET_ASSIGNED: "Ticket assigned",
};

function SourceRow({
  id,
  name,
  apiKey,
  active,
  origin,
  onDelete,
}: {
  id: string;
  name: string;
  apiKey: string;
  active: boolean;
  origin: string;
  onDelete: () => void;
}) {
  const update = useUpdateIntegrationSource(id);
  return (
    <div className="flex flex-col gap-1.5 rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="min-w-0 truncate text-sm font-semibold">{name}</span>
        <div className="flex items-center gap-3">
          <ActiveToggle active={active} onToggle={(v) => update.mutate(v)} />
          <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
      <code className="bg-muted overflow-x-auto rounded px-2 py-1.5 text-xs">
        POST {origin}/api/integrations/inbound/{apiKey}
      </code>
      {!active && (
        <p className="text-muted-foreground text-xs">
          Disabled — incoming requests are rejected until re-enabled.
        </p>
      )}
    </div>
  );
}

function SourcesSection() {
  const { data, isLoading } = useIntegrationSources();
  const createSource = useCreateIntegrationSource();
  const deleteSource = useDeleteIntegrationSource();
  const [name, setName] = useState("");
  // window isn't available during SSR — the sources list itself only
  // renders once the query resolves (well past hydration), so reading it
  // directly at render time is safe here without an effect.
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createSource.mutateAsync({ name });
      toast.success("Source created");
      setName("");
    } catch {
      toast.error("Could not create the source.");
    }
  }

  async function handleDelete(id: string, sourceName: string) {
    if (
      !window.confirm(`Delete "${sourceName}"? Its webhook URL stops working.`)
    )
      return;
    try {
      await deleteSource.mutateAsync(id);
      toast.success("Source deleted");
    } catch {
      toast.error("Could not delete the source.");
    }
  }

  return (
    <>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base font-bold">Inbound sources</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm">
            Give each external system (TeamDynamix, a firewall/SIEM alert feed,
            ...) its own webhook URL. A POST to that URL with{" "}
            <code className="bg-muted rounded px-1 py-0.5 text-xs">
              {"{ title, description, priority?, externalRef? }"}
            </code>{" "}
            creates a ticket here — no per-vendor code, so anything that can
            send a webhook can feed Kyma.
          </p>
          {isLoading && <Skeleton className="h-16" />}
          {data && data.sources.length === 0 && (
            <p className="text-muted-foreground text-sm">No sources yet.</p>
          )}
          {data?.sources.map((source) => (
            <SourceRow
              key={source.id}
              id={source.id}
              name={source.name}
              apiKey={source.apiKey}
              active={source.active}
              origin={origin}
              onDelete={() => handleDelete(source.id, source.name)}
            />
          ))}
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base font-bold">Add a source</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleCreate}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="source-name">Name</Label>
              <Input
                id="source-name"
                placeholder="TeamDynamix"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={createSource.isPending}>
                {createSource.isPending ? "Adding…" : "Add source"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

// Shared by both sections — pausing is the common action (Section 5.5:
// most admins toggle a source off rather than reconfigure a webhook URL),
// so both sources and subscriptions get the same on/off control.
function ActiveToggle({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: (active: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox
        checked={active}
        onCheckedChange={(checked) => onToggle(checked === true)}
      />
      Active
    </label>
  );
}

function SubscriptionRow({
  id,
  url,
  event,
  active,
  onDelete,
}: {
  id: string;
  url: string;
  event: (typeof WEBHOOK_EVENTS)[number];
  active: boolean;
  onDelete: () => void;
}) {
  const update = useUpdateWebhookSubscription(id);
  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{url}</div>
        <div className="text-muted-foreground text-xs">
          {EVENT_LABEL[event]}
        </div>
      </div>
      <ActiveToggle active={active} onToggle={(v) => update.mutate(v)} />
      <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
        Delete
      </Button>
    </div>
  );
}

function WebhooksSection() {
  const { data, isLoading } = useWebhookSubscriptions();
  const createSubscription = useCreateWebhookSubscription();
  const deleteSubscription = useDeleteWebhookSubscription();
  const [url, setUrl] = useState("");
  const [event, setEvent] =
    useState<CreateWebhookSubscriptionInput["event"]>("TICKET_CREATED");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createSubscription.mutateAsync({ url, event });
      toast.success("Webhook added");
      setUrl("");
    } catch {
      setError("Must be a valid URL.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this webhook?")) return;
    try {
      await deleteSubscription.mutateAsync(id);
      toast.success("Webhook deleted");
    } catch {
      toast.error("Could not delete the webhook.");
    }
  }

  return (
    <>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base font-bold">
            Outbound webhooks
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm">
            Kyma POSTs a JSON payload to this URL whenever the chosen event
            happens — best-effort delivery, no retries. Point it at Slack, a
            paging tool, or TeamDynamix&apos;s own inbound webhook.
          </p>
          {isLoading && <Skeleton className="h-16" />}
          {data && data.subscriptions.length === 0 && (
            <p className="text-muted-foreground text-sm">No webhooks yet.</p>
          )}
          {data?.subscriptions.map((sub) => (
            <SubscriptionRow
              key={sub.id}
              id={sub.id}
              url={sub.url}
              event={sub.event}
              active={sub.active}
              onDelete={() => handleDelete(sub.id)}
            />
          ))}
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base font-bold">Add a webhook</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleCreate}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="webhook-url">URL</Label>
              <Input
                id="webhook-url"
                placeholder="https://hooks.example.com/kyma"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label>Event</Label>
              <Select
                value={event}
                onValueChange={(v) =>
                  setEvent(v as CreateWebhookSubscriptionInput["event"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEBHOOK_EVENTS.map((e) => (
                    <SelectItem key={e} value={e}>
                      {EVENT_LABEL[e]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={createSubscription.isPending}>
                {createSubscription.isPending ? "Adding…" : "Add webhook"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

export function IntegrationsAdmin() {
  return (
    <div className="flex flex-col gap-6 p-7">
      <div>
        <h1 className="font-heading text-xl font-semibold">Integrations</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Kyma as the place tickets converge from other tools, instead of one
          more tool to check separately.
        </p>
      </div>

      <SourcesSection />
      <WebhooksSection />
    </div>
  );
}
