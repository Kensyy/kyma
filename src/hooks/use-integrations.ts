"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  IntegrationSourceModel,
  WebhookSubscriptionModel,
} from "@/generated/prisma/models";
import { apiFetch } from "@/lib/api-client";
import type {
  CreateIntegrationSourceInput,
  CreateWebhookSubscriptionInput,
} from "@/lib/validations/integration";

export function useIntegrationSources() {
  return useQuery({
    queryKey: ["integrationSources"],
    queryFn: () =>
      apiFetch<{ sources: IntegrationSourceModel[] }>(
        "/api/integrations/sources",
      ),
  });
}

export function useCreateIntegrationSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIntegrationSourceInput) =>
      apiFetch<{ source: IntegrationSourceModel }>(
        "/api/integrations/sources",
        { method: "POST", body: JSON.stringify(input) },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["integrationSources"] }),
  });
}

export function useDeleteIntegrationSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/integrations/sources/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["integrationSources"] }),
  });
}

export function useWebhookSubscriptions() {
  return useQuery({
    queryKey: ["webhookSubscriptions"],
    queryFn: () =>
      apiFetch<{ subscriptions: WebhookSubscriptionModel[] }>(
        "/api/integrations/webhooks",
      ),
  });
}

export function useCreateWebhookSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWebhookSubscriptionInput) =>
      apiFetch<{ subscription: WebhookSubscriptionModel }>(
        "/api/integrations/webhooks",
        { method: "POST", body: JSON.stringify(input) },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["webhookSubscriptions"] }),
  });
}

export function useUpdateWebhookSubscription(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (active: boolean) =>
      apiFetch<{ subscription: WebhookSubscriptionModel }>(
        `/api/integrations/webhooks/${id}`,
        { method: "PATCH", body: JSON.stringify({ active }) },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["webhookSubscriptions"] }),
  });
}

export function useDeleteWebhookSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/integrations/webhooks/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["webhookSubscriptions"] }),
  });
}
