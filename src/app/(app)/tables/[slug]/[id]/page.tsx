"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { relativeTime } from "@/lib/relative-time";
import {
  useCustomEntityRecord,
  useDeleteCustomEntityRecord,
  useUpdateCustomEntityRecord,
} from "@/hooks/use-custom-entities";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { DynamicFieldInput } from "@/components/dynamic-field-input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomEntityRecordDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useCustomEntityRecord(slug, id);
  const updateRecord = useUpdateCustomEntityRecord(slug, id);
  const deleteRecord = useDeleteCustomEntityRecord(slug);

  // Same debounced-draft pattern as the ticket/asset detail pages.
  const [drafts, setDrafts] = useState<Record<string, string | null>>({});
  const debouncedUpdate = useDebouncedCallback(
    (fieldId: string, value: string | null) => {
      updateRecord.mutateAsync({ fields: { [fieldId]: value } }).catch(() => {
        toast.error("Could not update the record.");
      });
    },
    600,
  );

  async function handleDelete() {
    if (!window.confirm("Delete this record?")) return;
    try {
      await deleteRecord.mutateAsync(id);
      toast.success("Record deleted");
      router.push(`/tables/${slug}`);
    } catch {
      toast.error("Could not delete the record.");
    }
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-7">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const { record, definition, fields } = data;

  return (
    <div className="flex flex-1 overflow-auto p-7">
      <div className="mx-auto w-full max-w-xl">
        <div className="text-muted-foreground mb-5 flex items-center gap-2 text-sm">
          <Link href={`/tables/${slug}`} className="hover:text-foreground">
            {definition.name}
          </Link>
          <span>/</span>
          <span className="font-mono">{record.id.slice(0, 8)}</span>
        </div>

        <h1 className="font-heading text-xl font-semibold">
          {definition.name} record
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Created by {record.createdBy.name} · {relativeTime(record.createdAt)}
        </p>

        <div className="mt-6 flex flex-col gap-4 border-t pt-5">
          {fields.length === 0 && (
            <p className="text-muted-foreground text-sm">
              This table has no fields yet.
            </p>
          )}
          {fields.map((entry) => (
            <div key={entry.definition.id} className="flex flex-col gap-1.5">
              <span className="text-muted-foreground text-[11px] font-semibold">
                {entry.definition.name}
                {entry.definition.required && (
                  <span className="text-destructive"> *</span>
                )}
              </span>
              <DynamicFieldInput
                definition={entry.definition}
                value={drafts[entry.definition.id] ?? entry.value}
                onChange={(value) => {
                  setDrafts((prev) => ({
                    ...prev,
                    [entry.definition.id]: value,
                  }));
                  debouncedUpdate(entry.definition.id, value);
                }}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 border-t pt-5">
          <Button variant="outline" onClick={handleDelete}>
            Delete record
          </Button>
        </div>
      </div>
    </div>
  );
}
