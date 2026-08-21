"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateSlaPolicy,
  useDeleteSlaPolicy,
  useSlaPolicies,
} from "@/hooks/use-sla-policies";
import { useCategories } from "@/hooks/use-tickets";
import type { CreateSlaPolicyInput } from "@/lib/validations/sla-policy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const PRIORITY_LABEL: Record<(typeof PRIORITIES)[number], string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};
// Mirrors DEFAULT_SLA_HOURS_BY_PRIORITY in sla.ts — shown so the admin can
// see current effective behavior for a priority that has no policy row yet.
const DEFAULT_HOURS: Record<(typeof PRIORITIES)[number], number> = {
  URGENT: 4,
  HIGH: 24,
  MEDIUM: 72,
  LOW: 120,
};

export function SlaPoliciesAdmin() {
  const { data, isLoading } = useSlaPolicies();
  const { data: categoryData } = useCategories("TICKET");
  const createPolicy = useCreateSlaPolicy();
  const deletePolicy = useDeleteSlaPolicy();

  const [priority, setPriority] =
    useState<CreateSlaPolicyInput["priority"]>("URGENT");
  const [categoryId, setCategoryId] = useState("any");
  const [hours, setHours] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const hoursNum = Number(hours);
    if (!hoursNum || hoursNum < 1) {
      setError("Enter a number of hours.");
      return;
    }
    try {
      await createPolicy.mutateAsync({
        priority,
        categoryId: categoryId === "any" ? undefined : categoryId,
        hours: hoursNum,
      });
      toast.success("Policy added");
      setHours("");
      setCategoryId("any");
    } catch {
      setError("A policy for this priority and category already exists.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this SLA policy?")) return;
    try {
      await deletePolicy.mutateAsync(id);
      toast.success("Policy deleted");
    } catch {
      toast.error("Could not delete the policy.");
    }
  }

  return (
    <div className="flex flex-col gap-6 p-7">
      <div>
        <h1 className="font-heading text-xl font-semibold">SLA policies</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          How many hours a ticket has to be resolved by, based on priority and
          (optionally) category. A category-specific policy overrides the
          priority-only one for that category.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base font-bold">Defaults</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-3 text-sm">
            Used for any priority/category combination with no policy configured
            below.
          </p>
          <div className="flex flex-wrap gap-4">
            {PRIORITIES.map((p) => (
              <div key={p} className="text-sm">
                <span className="font-semibold">{PRIORITY_LABEL[p]}</span>{" "}
                <span className="text-muted-foreground">
                  {DEFAULT_HOURS[p]}h
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base font-bold">
            Configured policies
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {isLoading && <Skeleton className="h-16" />}
          {data && data.policies.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No policies yet — every ticket uses the defaults above.
            </p>
          )}
          {data?.policies.map((policy) => (
            <div
              key={policy.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="text-sm">
                <span className="font-semibold">
                  {PRIORITY_LABEL[policy.priority]}
                </span>{" "}
                <span className="text-muted-foreground">
                  · {policy.category?.label ?? "Any category"} · {policy.hours}h
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(policy.id)}
              >
                Delete
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base font-bold">Add a policy</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleCreate}>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) =>
                    setPriority(v as CreateSlaPolicyInput["priority"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_LABEL[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any category</SelectItem>
                    {categoryData?.categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sla-hours">Resolution window (hours)</Label>
              <Input
                id="sla-hours"
                type="number"
                min={1}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="4"
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={createPolicy.isPending}>
                {createPolicy.isPending ? "Adding…" : "Add policy"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
