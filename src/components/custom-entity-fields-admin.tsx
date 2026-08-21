"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import {
  createCustomEntityFieldDefinitionSchema,
  type CreateCustomEntityFieldDefinitionInput,
} from "@/lib/validations/custom-entity";
import {
  useCreateCustomEntityField,
  useCustomEntityDefinition,
  useCustomEntityDefinitions,
  useDeleteCustomEntityField,
  useUpdateCustomEntityDefinition,
} from "@/hooks/use-custom-entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FIELD_TYPES = [
  "TEXT",
  "NUMBER",
  "SELECT",
  "DATE",
  "BOOLEAN",
  "RELATION",
] as const;
const RELATION_TARGETS = ["TICKET", "ASSET", "USER", "CUSTOM_ENTITY"] as const;
const RELATION_TARGET_LABEL: Record<(typeof RELATION_TARGETS)[number], string> =
  {
    TICKET: "Ticket",
    ASSET: "Asset",
    USER: "User",
    CUSTOM_ENTITY: "Another table…",
  };

// Same reorder-by-swapping-`order` pattern as CustomFieldsAdmin.
function ReorderButtons({
  onMoveUp,
  onMoveDown,
  disableUp,
  disableDown,
}: {
  onMoveUp: () => void;
  onMoveDown: () => void;
  disableUp: boolean;
  disableDown: boolean;
}) {
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onMoveUp}
        disabled={disableUp}
        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
        aria-label="Move up"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 12 5-5 5 5" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={disableDown}
        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
        aria-label="Move down"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 8 5 5 5-5" />
        </svg>
      </button>
    </div>
  );
}

export function CustomEntityFieldsAdmin({ slug }: { slug: string }) {
  const { data, isLoading } = useCustomEntityDefinition(slug);
  const { data: allTables } = useCustomEntityDefinitions();
  const createField = useCreateCustomEntityField(slug);
  const deleteField = useDeleteCustomEntityField(slug);
  const updateDefinition = useUpdateCustomEntityDefinition(slug);
  const queryClient = useQueryClient();

  const [optionsText, setOptionsText] = useState("");
  const [fieldType, setFieldType] =
    useState<CreateCustomEntityFieldDefinitionInput["fieldType"]>("TEXT");
  const [relationTarget, setRelationTarget] =
    useState<CreateCustomEntityFieldDefinitionInput["relationTarget"]>();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateCustomEntityFieldDefinitionInput>({
    resolver: zodResolver(createCustomEntityFieldDefinitionSchema),
    defaultValues: { fieldType: "TEXT", required: false },
  });

  // Same reason as CustomFieldsAdmin: options is kept as a plain string in
  // local state, so RHF's tracked value needs manual syncing.
  function handleOptionsTextChange(text: string) {
    setOptionsText(text);
    setValue(
      "options",
      text
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean),
      { shouldValidate: true },
    );
  }

  async function onSubmit(values: CreateCustomEntityFieldDefinitionInput) {
    try {
      await createField.mutateAsync({
        ...values,
        options: values.fieldType === "SELECT" ? values.options : undefined,
        relationTarget:
          values.fieldType === "RELATION" ? values.relationTarget : undefined,
      });
      toast.success("Field added");
      reset({ fieldType: "TEXT", required: false, name: "" });
      setFieldType("TEXT");
      setRelationTarget(undefined);
      setOptionsText("");
    } catch {
      toast.error("Could not add the field.");
    }
  }

  async function handleDisplayFieldChange(fieldId: string) {
    try {
      await updateDefinition.mutateAsync({
        displayFieldId: fieldId === "none" ? null : fieldId,
      });
      toast.success("Display field updated");
    } catch {
      toast.error("Could not update the display field.");
    }
  }

  async function move(id: string, direction: "up" | "down") {
    if (!data) return;
    const defs = data.definition.fields;
    const index = defs.findIndex((d) => d.id === id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= defs.length) return;

    const a = defs[index];
    const b = defs[swapIndex];
    try {
      await Promise.all([
        apiFetch(`/api/custom-entities/${slug}/fields/${a.id}`, {
          method: "PATCH",
          body: JSON.stringify({ order: b.order }),
        }),
        apiFetch(`/api/custom-entities/${slug}/fields/${b.id}`, {
          method: "PATCH",
          body: JSON.stringify({ order: a.order }),
        }),
      ]);
      await queryClient.invalidateQueries({ queryKey: ["customEntities"] });
    } catch {
      toast.error("Could not reorder fields.");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (
      !window.confirm(
        `Delete the "${name}" field? This removes it from every record.`,
      )
    )
      return;
    try {
      await deleteField.mutateAsync(id);
      toast.success("Field deleted");
    } catch {
      toast.error("Could not delete the field.");
    }
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-6 p-7">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 max-w-xl" />
      </div>
    );
  }

  const { definition } = data;

  return (
    <div className="flex flex-col gap-6 p-7">
      <div>
        <Link
          href="/admin/custom-entities"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Custom tables
        </Link>
        <h1 className="font-heading mt-1 text-xl font-semibold">
          {definition.name} fields
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Fields defined here render dynamically on every /tables/
          {definition.slug} record — no code changes needed.
        </p>
      </div>

      {definition.fields.length > 0 && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-base font-bold">Display field</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm">
              Which field represents a record when it&apos;s shown elsewhere — a
              relation picker on another table, this record&apos;s own detail
              page. Defaults to {definition.fields[0].name} if unset.
            </p>
            <Select
              value={definition.displayFieldId ?? "none"}
              onValueChange={handleDisplayFieldChange}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  Default ({definition.fields[0].name})
                </SelectItem>
                {definition.fields.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base font-bold">Existing fields</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {definition.fields.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No fields yet — add one below.
            </p>
          )}
          {definition.fields.map((def, i) => (
            <div
              key={def.id}
              className="flex items-center gap-3 rounded-md border p-3"
            >
              <ReorderButtons
                onMoveUp={() => move(def.id, "up")}
                onMoveDown={() => move(def.id, "down")}
                disableUp={i === 0}
                disableDown={i === definition.fields.length - 1}
              />
              <div className="flex-1">
                <div className="text-sm font-semibold">
                  {def.name}{" "}
                  {def.required && <span className="text-destructive">*</span>}
                </div>
                <div className="text-muted-foreground text-xs">
                  {def.fieldType}
                  {def.fieldType === "SELECT" &&
                    Array.isArray(def.options) &&
                    ` · ${(def.options as string[]).join(", ")}`}
                  {def.fieldType === "RELATION" &&
                    def.relationTarget !== "CUSTOM_ENTITY" &&
                    ` · links to ${def.relationTarget?.toLowerCase()}`}
                  {def.fieldType === "RELATION" &&
                    def.relationTarget === "CUSTOM_ENTITY" &&
                    ` · links to ${
                      allTables?.definitions.find(
                        (t) => t.id === def.relationTargetEntityId,
                      )?.name ?? "another table"
                    }`}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(def.id, def.name)}
              >
                Delete
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base font-bold">Add a field</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="field-name">Name</Label>
              <Input id="field-name" {...register("name")} />
              {errors.name && (
                <p className="text-destructive text-sm">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Type</Label>
              <Controller
                control={control}
                name="fieldType"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setFieldType(
                        value as CreateCustomEntityFieldDefinitionInput["fieldType"],
                      );
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.charAt(0) + t.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {fieldType === "SELECT" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="field-options">Options (comma-separated)</Label>
                <Input
                  id="field-options"
                  value={optionsText}
                  onChange={(e) => handleOptionsTextChange(e.target.value)}
                  placeholder="Small, Medium, Large"
                />
                {errors.options && (
                  <p className="text-destructive text-sm">
                    {errors.options.message}
                  </p>
                )}
              </div>
            )}

            {fieldType === "RELATION" && (
              <div className="flex flex-col gap-2">
                <Label>Links to</Label>
                <Controller
                  control={control}
                  name="relationTarget"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setRelationTarget(
                          value as CreateCustomEntityFieldDefinitionInput["relationTarget"],
                        );
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an entity" />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATION_TARGETS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {RELATION_TARGET_LABEL[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.relationTarget && (
                  <p className="text-destructive text-sm">
                    {errors.relationTarget.message}
                  </p>
                )}
              </div>
            )}

            {fieldType === "RELATION" && relationTarget === "CUSTOM_ENTITY" && (
              <div className="flex flex-col gap-2">
                <Label>Which table</Label>
                <Controller
                  control={control}
                  name="relationTargetEntityId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a table" />
                      </SelectTrigger>
                      <SelectContent>
                        {allTables?.definitions.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.relationTargetEntityId && (
                  <p className="text-destructive text-sm">
                    {errors.relationTargetEntityId.message}
                  </p>
                )}
              </div>
            )}

            <Controller
              control={control}
              name="required"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                  Required
                </label>
              )}
            />

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={createField.isPending}>
                {createField.isPending ? "Adding…" : "Add field"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
