"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  useCreateCustomEntityDefinition,
  useCustomEntityDefinitions,
  useDeleteCustomEntityDefinition,
} from "@/hooks/use-custom-entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CustomEntitiesAdmin() {
  const { data, isLoading } = useCustomEntityDefinitions();
  const createDef = useCreateCustomEntityDefinition();
  const deleteDef = useDeleteCustomEntityDefinition();

  const [name, setName] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createDef.mutateAsync({ name });
      toast.success("Table created");
      setName("");
    } catch {
      toast.error("Could not create the table.");
    }
  }

  async function handleDelete(slug: string, tableName: string) {
    if (
      !window.confirm(
        `Delete the "${tableName}" table? This removes every record in it.`,
      )
    )
      return;
    try {
      await deleteDef.mutateAsync(slug);
      toast.success("Table deleted");
    } catch {
      toast.error("Could not delete the table.");
    }
  }

  return (
    <div className="flex flex-col gap-6 p-7">
      <div>
        <h1 className="font-heading text-xl font-semibold">Custom tables</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Add a table, then give it typed fields — a list, detail, and create
          view for it appear automatically, no code changes needed.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base font-bold">Existing tables</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {isLoading && <Skeleton className="h-16" />}
          {data && data.definitions.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No custom tables yet.
            </p>
          )}
          {data?.definitions.map((def) => (
            <div
              key={def.id}
              className="flex items-center gap-3 rounded-md border p-3"
            >
              <div className="flex-1">
                <div className="text-sm font-semibold">{def.name}</div>
                <div className="text-muted-foreground text-xs">
                  {def.fields.length}{" "}
                  {def.fields.length === 1 ? "field" : "fields"} · /tables/
                  {def.slug}
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/custom-entities/${def.slug}`}>
                  Manage fields
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(def.slug, def.name)}
              >
                Delete
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base font-bold">Add a table</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleCreate}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="table-name">Name</Label>
              <Input
                id="table-name"
                placeholder="Maintenance"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={createDef.isPending}>
                {createDef.isPending ? "Adding…" : "Add table"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
