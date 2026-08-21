"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AssetTypeModel } from "@/generated/prisma/models";
import { apiFetch } from "@/lib/api-client";
import type { AssetDetail, AssetListItem } from "@/lib/types/asset";
import type { CustomFieldValueEntry } from "@/hooks/use-tickets";
import type {
  CreateAssetInput,
  UpdateAssetInput,
} from "@/lib/validations/asset";

export type AssetFilters = {
  status?: string;
  type?: string;
  owner?: string;
  q?: string;
};

function queryString(filters: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useAssetTypes() {
  return useQuery({
    queryKey: ["assetTypes"],
    queryFn: () =>
      apiFetch<{ assetTypes: AssetTypeModel[] }>("/api/asset-types"),
    staleTime: 5 * 60_000,
  });
}

export function useAssets(
  filters: AssetFilters,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["assets", filters],
    queryFn: () =>
      apiFetch<{ assets: AssetListItem[] }>(
        `/api/assets${queryString(filters)}`,
      ),
    enabled: options?.enabled ?? true,
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: ["assets", id],
    queryFn: () =>
      apiFetch<{ asset: AssetDetail; customFields: CustomFieldValueEntry[] }>(
        `/api/assets/${id}`,
      ),
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAssetInput) =>
      apiFetch<{ asset: AssetListItem }>("/api/assets", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useUpdateAsset(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAssetInput) =>
      apiFetch<{ asset: AssetDetail }>(`/api/assets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}
