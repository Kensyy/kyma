"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import {
  createCustomFieldDefinitionSchema,
  type CreateCustomFieldDefinitionInput,
} from "@/lib/validations/custom-field";
import {
  useCreateCustomFieldDefinition,
  useCustomFieldDefinitions,
  useDeleteCustomFieldDefinition,
} from "@/hooks/use-custom-fields";
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

const FIELD_TYPES = ["TEXT", "NUMBER", "SELECT", "DATE", "BOOLEAN"] as const;

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

export function CustomFieldsAdmin() {
  const { data, isLoading } = useCustomFieldDefinitions("TICKET");
  const createDef = useCreateCustomFieldDefinition();
  const deleteDef = useDeleteCustomFieldDefinition();
  const queryClient = useQueryClient();

  const [optionsText, setOptionsText] = useState("");
  const [fieldType, setFieldType] =
    useState<CreateCustomFieldDefinitionInput["fieldType"]>("TEXT");

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateCustomFieldDefinitionInput>({
    resolver: zodResolver(createCustomFieldDefinitionSchema),
    defaultValues: { entityType: "TICKET", fieldType: "TEXT", required: false },
  });

  // `options` isn't its own registered field (the UI keeps it as a plain
  // comma-separated string in `optionsText`), so keep RHF's tracked value in
  // sync manually — otherwise the resolver always sees options as empty and
  // rejects every SELECT-type submission regardless of what was typed.
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

  async function onSubmit(values: CreateCustomFieldDefinitionInput) {
    try {
      await createDef.mutateAsync({
        ...values,
        options: values.fieldType === "SELECT" ? values.options : undefined,
      });
      toast.success("Field added");
      reset({
        entityType: "TICKET",
        fieldType: "TEXT",
        required: false,
        name: "",
      });
      setFieldType("TEXT");
      setOptionsText("");
    } catch {
      toast.error("Could not add the field.");
    }
  }

  async function move(id: string, direction: "up" | "down") {
    if (!data) return;
    const defs = data.definitions;
    const index = defs.findIndex((d) => d.id === id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= defs.length) return;

    const a = defs[index];
    const b = defs[swapIndex];
    try {
      // Swap the two definitions' stored `order` values.
      await Promise.all([
        apiFetch(`/api/custom-fields/${a.id}`, {
          method: "PATCH",
          body: JSON.stringify({ order: b.order }),
        }),
        apiFetch(`/api/custom-fields/${b.id}`, {
          method: "PATCH",
          body: JSON.stringify({ order: a.order }),
        }),
      ]);
      await queryClient.invalidateQueries({ queryKey: ["customFields"] });
    } catch {
      toast.error("Could not reorder fields.");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (
      !window.confirm(
        `Delete the "${name}" field? This removes it from every ticket.`,
      )
    )
      return;
    try {
      await deleteDef.mutateAsync(id);
      toast.success("Field deleted");
    } catch {
      toast.error("Could not delete the field.");
    }
  }

  return (
    <div className="flex flex-col gap-6 p-7">
      <div>
        <h1 className="font-heading text-xl font-semibold">
          Ticket custom fields
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Fields defined here render dynamically on every ticket — no code
          changes needed.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base font-bold">Existing fields</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {isLoading && <Skeleton className="h-24" />}
          {data && data.definitions.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No custom fields yet.
            </p>
          )}
          {data?.definitions.map((def, i) => (
            <div
              key={def.id}
              className="flex items-center gap-3 rounded-md border p-3"
            >
              <ReorderButtons
                onMoveUp={() => move(def.id, "up")}
                onMoveDown={() => move(def.id, "down")}
                disableUp={i === 0}
                disableDown={i === data.definitions.length - 1}
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
                        value as CreateCustomFieldDefinitionInput["fieldType"],
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
              <Button type="submit" disabled={createDef.isPending}>
                {createDef.isPending ? "Adding…" : "Add field"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
