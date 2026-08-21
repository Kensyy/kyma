"use client";

import { use, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { formatTicketNumber } from "@/lib/ticket-number";
import { relativeTime } from "@/lib/relative-time";
import { isSlaOverdue } from "@/lib/sla";
import {
  useAddComment,
  useAssignableUsers,
  useCategories,
  useStatuses,
  useTicket,
  useUpdateTicket,
} from "@/hooks/use-tickets";
import { useAssets } from "@/hooks/use-assets";
import { StatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { UserAvatar } from "@/components/user-avatar";
import { DynamicFieldInput } from "@/components/dynamic-field-input";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading } = useTicket(id);
  const { data: statusData } = useStatuses("TICKET");
  const { data: categoryData } = useCategories("TICKET");
  const { data: userData } = useAssignableUsers();
  const { data: assetData } = useAssets({});
  const updateTicket = useUpdateTicket(id);
  const addComment = useAddComment(id);

  const [reply, setReply] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  // Custom field edits (free-text/number typing) autosave debounced, unlike
  // the fixed Select-driven properties below which save instantly since
  // they only fire once per pick. Drafts hold the in-progress typed value
  // so the input stays responsive while the save is still debounced/in
  // flight, rather than visually reverting until the next refetch lands.
  const [customFieldDrafts, setCustomFieldDrafts] = useState<
    Record<string, string | null>
  >({});
  const debouncedCustomFieldUpdate = useDebouncedCallback(
    (fieldId: string, value: string | null) => {
      updateTicket
        .mutateAsync({ customFields: { [fieldId]: value } })
        .catch(() => {
          toast.error("Could not update the ticket.");
        });
    },
    600,
  );

  if (isLoading || !data) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-7">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const { ticket, ticketPrefix, customFields } = data;
  const overdue = isSlaOverdue(
    ticket.slaDueAt ? new Date(ticket.slaDueAt) : null,
    ticket.status.isTerminal,
  );

  async function handleUpdate(
    patch: Parameters<typeof updateTicket.mutateAsync>[0],
  ) {
    try {
      await updateTicket.mutateAsync(patch);
    } catch {
      toast.error("Could not update the ticket.");
    }
  }

  async function handleReply() {
    if (!reply.trim()) return;
    try {
      await addComment.mutateAsync({ body: reply, isInternal });
      setReply("");
      setIsInternal(false);
    } catch {
      toast.error("Could not post the reply.");
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-auto p-7">
        <div className="text-muted-foreground mb-5 flex items-center gap-2 text-sm">
          <Link href="/tickets" className="hover:text-foreground">
            Tickets
          </Link>
          <span>/</span>
          <span className="font-mono">
            {formatTicketNumber(ticketPrefix, ticket.ticketNumber)}
          </span>
        </div>

        <div className="mb-2 flex items-center gap-2">
          <StatusBadge
            label={ticket.status.label}
            color={ticket.status.color}
          />
          <PriorityBadge priority={ticket.priority} />
          {overdue && (
            <span className="bg-destructive/10 text-destructive inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase">
              SLA overdue
            </span>
          )}
        </div>

        <h1 className="font-heading text-xl font-semibold">{ticket.title}</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Opened by{" "}
          <strong className="text-foreground font-semibold">
            {ticket.createdBy.name}
          </strong>{" "}
          · {relativeTime(ticket.createdAt)}
        </p>

        <p className="text-muted-foreground mt-5 border-t pt-5 text-[15px] leading-relaxed whitespace-pre-line">
          {ticket.description}
        </p>

        <div className="mt-6 flex flex-col gap-4 border-t pt-5">
          <div className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
            Activity
          </div>

          {ticket.comments.length === 0 && (
            <p className="text-muted-foreground text-sm">No comments yet.</p>
          )}

          {ticket.comments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5">
              <UserAvatar
                name={comment.author.name}
                className="mt-0.5 h-7 w-7"
              />
              <div
                className={
                  comment.isInternal
                    ? "border-warning/40 bg-warning/10 flex-1 rounded-lg border p-3"
                    : "bg-card flex-1 rounded-lg border p-3"
                }
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-bold">
                    {comment.author.name}
                  </span>
                  {comment.isInternal && (
                    <span className="bg-warning rounded px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-white uppercase">
                      Internal
                    </span>
                  )}
                  <span className="text-muted-foreground text-[11.5px]">
                    {relativeTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">{comment.body}</p>
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-2.5 rounded-lg border p-3">
            <Textarea
              placeholder="Write a reply…"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={3}
            />
            <div className="flex items-center justify-between border-t pt-2.5">
              <label className="text-muted-foreground flex items-center gap-2 text-[11.5px]">
                <Checkbox
                  checked={isInternal}
                  onCheckedChange={(checked) => setIsInternal(checked === true)}
                />
                Internal note (staff only)
              </label>
              <Button
                onClick={handleReply}
                disabled={addComment.isPending || !reply.trim()}
              >
                Reply
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-72 min-w-72 overflow-auto border-l p-5.5">
        <div className="text-muted-foreground mb-3 text-xs font-bold tracking-wide uppercase">
          Properties
        </div>

        <PropertyField label="Status">
          <Select
            value={ticket.statusId}
            onValueChange={(statusId) => handleUpdate({ statusId })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusData?.statuses.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropertyField>

        <PropertyField label="Priority">
          <Select
            value={ticket.priority}
            onValueChange={(priority) =>
              handleUpdate({
                priority: priority as (typeof PRIORITIES)[number],
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropertyField>

        <PropertyField label="Assignee">
          <Select
            value={ticket.assigneeId ?? "unassigned"}
            onValueChange={(assigneeId) =>
              handleUpdate({
                assigneeId: assigneeId === "unassigned" ? null : assigneeId,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {userData?.users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropertyField>

        <PropertyField label="Category">
          <Select
            value={ticket.categoryId ?? "none"}
            onValueChange={(categoryId) =>
              handleUpdate({
                categoryId: categoryId === "none" ? null : categoryId,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {categoryData?.categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropertyField>

        <PropertyField label="Asset">
          <Select
            value={ticket.assetId ?? "none"}
            onValueChange={(assetId) =>
              handleUpdate({ assetId: assetId === "none" ? null : assetId })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {assetData?.assets.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropertyField>

        {customFields.map((entry) => (
          <PropertyField
            key={entry.definition.id}
            label={entry.definition.name}
          >
            <DynamicFieldInput
              definition={entry.definition}
              value={customFieldDrafts[entry.definition.id] ?? entry.value}
              onChange={(value) => {
                setCustomFieldDrafts((prev) => ({
                  ...prev,
                  [entry.definition.id]: value,
                }));
                debouncedCustomFieldUpdate(entry.definition.id, value);
              }}
            />
          </PropertyField>
        ))}

        <div className="text-muted-foreground flex flex-col gap-1 border-t pt-3 text-[11.5px]">
          <span>Requester: {ticket.createdBy.name}</span>
          {ticket.branch && <span>Branch: {ticket.branch.name}</span>}
          {ticket.slaDueAt && (
            <span>SLA due {relativeTime(ticket.slaDueAt)}</span>
          )}
          <span>Created {relativeTime(ticket.createdAt)}</span>
          <span>Updated {relativeTime(ticket.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function PropertyField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 border-t py-3 first:border-t-0">
      <span className="text-muted-foreground text-[11px] font-semibold">
        {label}
      </span>
      {children}
    </div>
  );
}
