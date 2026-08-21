"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SlaPolicyModel } from "@/generated/prisma/models";
import { apiFetch } from "@/lib/api-client";
import type { CreateSlaPolicyInput } from "@/lib/validations/sla-policy";

export type SlaPolicyWithCategory = SlaPolicyModel & {
  category: { id: string; label: string } | null;
};

export function useSlaPolicies() {
  return useQuery({
    queryKey: ["slaPolicies"],
    queryFn: () =>
      apiFetch<{ policies: SlaPolicyWithCategory[] }>("/api/sla-policies"),
  });
}

export function useCreateSlaPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSlaPolicyInput) =>
      apiFetch<{ policy: SlaPolicyWithCategory }>("/api/sla-policies", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["slaPolicies"] }),
  });
}

export function useDeleteSlaPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/sla-policies/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["slaPolicies"] }),
  });
}
