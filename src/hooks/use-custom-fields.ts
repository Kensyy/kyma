"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CustomFieldDefinitionModel } from "@/generated/prisma/models";
import { apiFetch } from "@/lib/api-client";
import type {
  CreateCustomFieldDefinitionInput,
  UpdateCustomFieldDefinitionInput,
} from "@/lib/validations/custom-field";

export function useCustomFieldDefinitions(entityType: "TICKET" | "ASSET") {
  return useQuery({
    queryKey: ["customFields", entityType],
    queryFn: () =>
      apiFetch<{ definitions: CustomFieldDefinitionModel[] }>(
        `/api/custom-fields?entityType=${entityType}`,
      ),
  });
}

export function useCreateCustomFieldDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomFieldDefinitionInput) =>
      apiFetch<{ definition: CustomFieldDefinitionModel }>(
        "/api/custom-fields",
        {
          method: "POST",
          body: JSON.stringify(input),
        },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["customFields"] }),
  });
}

export function useUpdateCustomFieldDefinition(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCustomFieldDefinitionInput) =>
      apiFetch<{ definition: CustomFieldDefinitionModel }>(
        `/api/custom-fields/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify(input),
        },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["customFields"] }),
  });
}

export function useDeleteCustomFieldDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/custom-fields/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["customFields"] }),
  });
}
