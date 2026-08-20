"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  StatusModel,
  CategoryModel,
  CustomFieldDefinitionModel,
} from "@/generated/prisma/models";
import { apiFetch } from "@/lib/api-client";
import type { TicketDetail, TicketListItem } from "@/lib/types/ticket";
import type {
  CreateCommentInput,
  CreateTicketInput,
  UpdateTicketInput,
} from "@/lib/validations/ticket";

export type AssignableUser = { id: string; name: string; role: string };

export type CustomFieldValueEntry = {
  definition: CustomFieldDefinitionModel;
  value: string | null;
};

export type TicketFilters = {
  status?: string;
  priority?: string;
  category?: string;
  assignee?: string;
  q?: string;
};

function ticketsQueryString(filters: TicketFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useStatuses(entityType: "TICKET" | "ASSET") {
  return useQuery({
    queryKey: ["statuses", entityType],
    queryFn: () =>
      apiFetch<{ statuses: StatusModel[] }>(
        `/api/statuses?entityType=${entityType}`,
      ),
    staleTime: 5 * 60_000,
  });
}

export function useCategories(entityType: "TICKET" | "ASSET") {
  return useQuery({
    queryKey: ["categories", entityType],
    queryFn: () =>
      apiFetch<{ categories: CategoryModel[] }>(
        `/api/categories?entityType=${entityType}`,
      ),
    staleTime: 5 * 60_000,
  });
}

export function useAssignableUsers() {
  return useQuery({
    queryKey: ["users", "assignable"],
    queryFn: () => apiFetch<{ users: AssignableUser[] }>("/api/users"),
    staleTime: 5 * 60_000,
  });
}

export function useTicketPrefix() {
  return useQuery({
    queryKey: ["settings", "ticketPrefix"],
    queryFn: () => apiFetch<{ ticketPrefix: string }>("/api/settings"),
    staleTime: 5 * 60_000,
  });
}

export function useTickets(filters: TicketFilters) {
  return useQuery({
    queryKey: ["tickets", filters],
    queryFn: () =>
      apiFetch<{ tickets: TicketListItem[]; ticketPrefix: string }>(
        `/api/tickets${ticketsQueryString(filters)}`,
      ),
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ["tickets", id],
    queryFn: () =>
      apiFetch<{
        ticket: TicketDetail;
        ticketPrefix: string;
        customFields: CustomFieldValueEntry[];
      }>(`/api/tickets/${id}`),
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTicketInput) =>
      apiFetch<{ ticket: TicketListItem }>("/api/tickets", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

export function useUpdateTicket(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTicketInput) =>
      apiFetch<{ ticket: TicketDetail }>(`/api/tickets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

export function useAddComment(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCommentInput) =>
      apiFetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets", ticketId] });
    },
  });
}
