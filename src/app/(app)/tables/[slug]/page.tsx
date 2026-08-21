"use client";

import { use } from "react";
import Link from "next/link";
import {
  useCustomEntityDefinition,
  useCustomEntityRecords,
} from "@/hooks/use-custom-entities";
import { relativeTime } from "@/lib/relative-time";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomEntityListPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: defData } = useCustomEntityDefinition(slug);
  const { data: recordsData, isLoading } = useCustomEntityRecords(slug);

  const fields = defData?.definition.fields ?? [];
  const records = recordsData?.records ?? [];
  const gridStyle = {
    gridTemplateColumns: `repeat(${fields.length || 1}, minmax(140px, 1fr)) 140px`,
  };
  const minTableWidth = (fields.length || 1) * 140 + 140;

  function cellValue(record: (typeof records)[number], fieldId: string) {
    const def = fields.find((f) => f.id === fieldId);
    const raw =
      record.values.find((v) => v.fieldDefinitionId === fieldId)?.value ?? null;
    if (raw === null) return "—";
    if (def?.fieldType === "BOOLEAN") return raw === "true" ? "Yes" : "No";
    if (def?.fieldType === "RELATION")
      return record.resolvedValues[fieldId] ?? raw;
    return raw;
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-7 py-4.5">
        <h1 className="font-heading text-xl font-semibold">
          {defData?.definition.name ?? "…"}
        </h1>
        <Button asChild>
          <Link href={`/tables/${slug}/new`}>New record</Link>
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-7">
        <div className="overflow-x-auto rounded-lg border">
          <div style={{ minWidth: minTableWidth }}>
            <div
              className="bg-muted/60 text-muted-foreground grid px-4 py-2 text-[10.5px] font-bold tracking-wide uppercase"
              style={gridStyle}
            >
              {fields.map((f) => (
                <div key={f.id}>{f.name}</div>
              ))}
              <div>Created</div>
            </div>

            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="grid items-center border-t px-4 py-2.5"
                  style={gridStyle}
                >
                  {fields.map((f) => (
                    <Skeleton key={f.id} className="h-4 w-24" />
                  ))}
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}

            {!isLoading && records.length === 0 && (
              <div className="text-muted-foreground p-10 text-center text-sm">
                No records yet.
              </div>
            )}

            {records.map((record) => (
              <Link
                key={record.id}
                href={`/tables/${slug}/${record.id}`}
                className="hover:bg-muted/40 grid items-center border-t px-4 py-2.5 text-sm"
                style={gridStyle}
              >
                {fields.map((f) => (
                  <div key={f.id} className="truncate pr-4">
                    {cellValue(record, f.id)}
                  </div>
                ))}
                <div className="text-muted-foreground text-xs">
                  {relativeTime(record.createdAt)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
