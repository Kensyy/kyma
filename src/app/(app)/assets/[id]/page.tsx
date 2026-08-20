"use client";

import { use, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { relativeTime } from "@/lib/relative-time";
import { useAsset, useAssetTypes, useUpdateAsset } from "@/hooks/use-assets";
import { useAssignableUsers, useStatuses } from "@/hooks/use-tickets";
import { StatusBadge } from "@/components/status-badge";
import { AssetTypeBadge } from "@/components/asset-type-badge";
import { DynamicFieldInput } from "@/components/dynamic-field-input";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EVENT_LABEL: Record<string, string> = {
  CREATED: "Asset created",
  STATUS_CHANGED: "Status changed",
  CHECKED_OUT: "Checked out",
  CHECKED_IN: "Checked in",
};

export default function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading } = useAsset(id);
  const { data: statusData } = useStatuses("ASSET");
  const { data: typeData } = useAssetTypes();
  const { data: userData } = useAssignableUsers();
  const updateAsset = useUpdateAsset(id);

  // Same debounced-draft pattern as the ticket detail page — typing stays
  // responsive while the save is debounced/in flight.
  const [customFieldDrafts, setCustomFieldDrafts] = useState<
    Record<string, string | null>
  >({});
  const debouncedCustomFieldUpdate = useDebouncedCallback(
    (fieldId: string, value: string | null) => {
      updateAsset
        .mutateAsync({ customFields: { [fieldId]: value } })
        .catch(() => {
          toast.error("Could not update the asset.");
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

  const { asset, customFields } = data;

  async function handleUpdate(
    patch: Parameters<typeof updateAsset.mutateAsync>[0],
  ) {
    try {
      await updateAsset.mutateAsync(patch);
    } catch {
      toast.error("Could not update the asset.");
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-auto p-7">
        <div className="text-muted-foreground mb-5 flex items-center gap-2 text-sm">
          <Link href="/assets" className="hover:text-foreground">
            Assets
          </Link>
          <span>/</span>
          <span>{asset.name}</span>
        </div>

        <div className="mb-2 flex items-center gap-2">
          <AssetTypeBadge label={asset.type.label} />
          <StatusBadge label={asset.status.label} color={asset.status.color} />
        </div>

        <h1 className="font-heading text-xl font-semibold">{asset.name}</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          {asset.type.label}
          {asset.serialNumber && <> · {asset.serialNumber}</>}
        </p>

        <div className="mt-6 flex flex-col gap-4 border-t pt-5">
          <div className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
            History
          </div>

          {asset.history.length === 0 && (
            <p className="text-muted-foreground text-sm">No activity yet.</p>
          )}

          {asset.history.map((event) => (
            <div key={event.id} className="flex gap-2.5">
              <div className="bg-primary mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
              <div className="text-sm">
                <span className="font-medium">
                  {EVENT_LABEL[event.eventType] ?? event.eventType}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  by {event.user.name}
                </span>
                <div className="text-muted-foreground text-[11.5px]">
                  {relativeTime(event.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-72 min-w-72 overflow-auto border-l p-5.5">
        <div className="text-muted-foreground mb-3 text-xs font-bold tracking-wide uppercase">
          Properties
        </div>

        <PropertyField label="Status">
          <Select
            value={asset.statusId}
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

        <PropertyField label="Type">
          <Select
            value={asset.typeId}
            onValueChange={(typeId) => handleUpdate({ typeId })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeData?.assetTypes.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropertyField>

        <PropertyField label="Owner">
          <Select
            value={asset.ownerId ?? "unassigned"}
            onValueChange={(ownerId) =>
              handleUpdate({
                ownerId: ownerId === "unassigned" ? null : ownerId,
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
          {asset.location && <span>Location: {asset.location}</span>}
          {asset.branch && <span>Branch: {asset.branch.name}</span>}
          {asset.serialNumber && <span>Serial: {asset.serialNumber}</span>}
          {asset.purchasedAt && (
            <span>Purchased {relativeTime(asset.purchasedAt)}</span>
          )}
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
