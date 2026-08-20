"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CustomEntityFieldDefinitionModel } from "@/generated/prisma/models";
import { apiFetch } from "@/lib/api-client";
import type {
  CustomEntityDefinitionWithFields,
  CustomEntityRecordListItem,
} from "@/lib/types/custom-entity";
import type {
  CreateCustomEntityDefinitionInput,
  CreateCustomEntityFieldDefinitionInput,
  CreateCustomEntityRecordInput,
  UpdateCustomEntityDefinitionInput,
  UpdateCustomEntityFieldDefinitionInput,
  UpdateCustomEntityRecordInput,
} from "@/lib/validations/custom-entity";

export type CustomEntityFieldValueEntry = {
  definition: CustomEntityFieldDefinitionModel;
  value: string | null;
};

export function useCustomEntityDefinitions() {
  return useQuery({
    queryKey: ["customEntities"],
    queryFn: () =>
      apiFetch<{ definitions: CustomEntityDefinitionWithFields[] }>(
        "/api/custom-entities",
      ),
    staleTime: 60_000,
  });
}

export function useCustomEntityDefinition(slug: string) {
  return useQuery({
    queryKey: ["customEntities", slug],
    queryFn: () =>
      apiFetch<{ definition: CustomEntityDefinitionWithFields }>(
        `/api/custom-entities/${slug}`,
      ),
    enabled: !!slug,
  });
}

export function useCreateCustomEntityDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomEntityDefinitionInput) =>
      apiFetch<{ definition: CustomEntityDefinitionWithFields }>(
        "/api/custom-entities",
        { method: "POST", body: JSON.stringify(input) },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["customEntities"] }),
  });
}

export function useUpdateCustomEntityDefinition(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCustomEntityDefinitionInput) =>
      apiFetch<{ definition: CustomEntityDefinitionWithFields }>(
        `/api/custom-entities/${slug}`,
        { method: "PATCH", body: JSON.stringify(input) },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["customEntities"] }),
  });
}

export function useDeleteCustomEntityDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) =>
      apiFetch(`/api/custom-entities/${slug}`, { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["customEntities"] }),
  });
}

export function useCreateCustomEntityField(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomEntityFieldDefinitionInput) =>
      apiFetch<{ field: CustomEntityFieldDefinitionModel }>(
        `/api/custom-entities/${slug}/fields`,
        { method: "POST", body: JSON.stringify(input) },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["customEntities"] }),
  });
}

export function useUpdateCustomEntityField(slug: string, fieldId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCustomEntityFieldDefinitionInput) =>
      apiFetch<{ field: CustomEntityFieldDefinitionModel }>(
        `/api/custom-entities/${slug}/fields/${fieldId}`,
        { method: "PATCH", body: JSON.stringify(input) },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["customEntities"] }),
  });
}

export function useDeleteCustomEntityField(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fieldId: string) =>
      apiFetch(`/api/custom-entities/${slug}/fields/${fieldId}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["customEntities"] }),
  });
}

export function useCustomEntityRecords(slug: string) {
  return useQuery({
    queryKey: ["customEntityRecords", slug],
    queryFn: () =>
      apiFetch<{ records: CustomEntityRecordListItem[] }>(
        `/api/custom-entities/${slug}/records`,
      ),
    enabled: !!slug,
  });
}

export function useCustomEntityRecord(slug: string, id: string) {
  return useQuery({
    queryKey: ["customEntityRecords", slug, id],
    queryFn: () =>
      apiFetch<{
        record: CustomEntityRecordListItem;
        definition: CustomEntityDefinitionWithFields;
        fields: CustomEntityFieldValueEntry[];
      }>(`/api/custom-entities/${slug}/records/${id}`),
    enabled: !!slug && !!id,
  });
}

export function useCreateCustomEntityRecord(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomEntityRecordInput) =>
      apiFetch<{ record: CustomEntityRecordListItem }>(
        `/api/custom-entities/${slug}/records`,
        { method: "POST", body: JSON.stringify(input) },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["customEntityRecords", slug],
      }),
  });
}

export function useUpdateCustomEntityRecord(slug: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCustomEntityRecordInput) =>
      apiFetch<{ record: CustomEntityRecordListItem }>(
        `/api/custom-entities/${slug}/records/${id}`,
        { method: "PATCH", body: JSON.stringify(input) },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["customEntityRecords", slug],
      }),
  });
}

export function useDeleteCustomEntityRecord(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/custom-entities/${slug}/records/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["customEntityRecords", slug],
      }),
  });
}
