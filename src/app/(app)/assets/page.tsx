"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAssets } from "@/hooks/use-assets";
import { useStatuses } from "@/hooks/use-tickets";
import { StatusBadge } from "@/components/status-badge";
import { AssetTypeBadge } from "@/components/asset-type-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function AssetsPage() {
  const { data: statusData } = useStatuses("ASSET");
  const [statusId, setStatusId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");

  const filters = useMemo(
    () => ({ status: statusId, q: search || undefined }),
    [statusId, search],
  );
  const { data, isLoading } = useAssets(filters);
  const assets = data?.assets ?? [];

  const { data: allData } = useAssets({});
  const countFor = (id: string | undefined) =>
    id
      ? (allData?.assets.filter((a) => a.statusId === id).length ?? 0)
      : (allData?.assets.length ?? 0);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b px-7 py-4.5">
        <h1 className="font-heading text-xl font-semibold">Assets</h1>
        <div className="flex items-center gap-2.5">
          <Input
            placeholder="Search assets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-60"
          />
          <Button asChild>
            <Link href="/assets/new">New asset</Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-5.5 overflow-x-auto border-b px-7">
        <button
          onClick={() => setStatusId(undefined)}
          className={cn(
            "text-muted-foreground border-b-2 border-transparent py-3 text-sm font-semibold whitespace-nowrap",
            !statusId && "border-primary text-primary",
          )}
        >
          All assets{" "}
          <span className="text-muted-foreground">{countFor(undefined)}</span>
        </button>
        {statusData?.statuses.map((s) => (
          <button
            key={s.id}
            onClick={() => setStatusId(s.id)}
            className={cn(
              "text-muted-foreground border-b-2 border-transparent py-3 text-sm font-semibold whitespace-nowrap",
              statusId === s.id && "border-primary text-primary",
            )}
          >
            {s.label}{" "}
            <span className="text-muted-foreground">{countFor(s.id)}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-7">
        <div className="overflow-hidden rounded-lg border">
          <div className="bg-muted/60 text-muted-foreground grid grid-cols-[36px_1fr_120px_150px_170px_130px_100px] px-4 py-2 text-[10.5px] font-bold tracking-wide uppercase">
            <div></div>
            <div>Name</div>
            <div>Type</div>
            <div>Owner</div>
            <div>Location</div>
            <div>Status</div>
            <div>Serial</div>
          </div>

          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[36px_1fr_120px_150px_170px_130px_100px] items-center border-t px-4 py-2.5"
              >
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}

          {!isLoading && assets.length === 0 && (
            <div className="text-muted-foreground p-10 text-center text-sm">
              No assets match this view.
            </div>
          )}

          {assets.map((asset) => (
            <Link
              key={asset.id}
              href={`/assets/${asset.id}`}
              className="hover:bg-muted/40 grid grid-cols-[36px_1fr_120px_150px_170px_130px_100px] items-center border-t px-4 py-2.5 text-sm"
            >
              <div>
                <AssetTypeBadge label={asset.type.label} />
              </div>
              <div className="truncate pr-4 font-medium">{asset.name}</div>
              <div className="text-muted-foreground truncate">
                {asset.type.label}
              </div>
              <div>
                {asset.owner ? (
                  <span className="truncate">{asset.owner.name}</span>
                ) : (
                  <span className="text-muted-foreground italic">
                    Unassigned
                  </span>
                )}
              </div>
              <div className="text-muted-foreground truncate">
                {asset.location ?? "—"}
              </div>
              <div>
                <StatusBadge
                  label={asset.status.label}
                  color={asset.status.color}
                />
              </div>
              <div className="text-muted-foreground truncate font-mono text-xs">
                {asset.serialNumber ?? "—"}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
