"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import {
  useCreateCustomEntityRecord,
  useCustomEntityDefinition,
} from "@/hooks/use-custom-entities";
import { DynamicFieldInput } from "@/components/dynamic-field-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewCustomEntityRecordPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { data, isLoading } = useCustomEntityDefinition(slug);
  const createRecord = useCreateCustomEntityRecord(slug);

  const [values, setValues] = useState<Record<string, string | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      const { record } = await createRecord.mutateAsync({ fields: values });
      toast.success("Record created");
      router.push(`/tables/${slug}/${record.id}`);
    } catch (error) {
      const fieldErrs =
        error instanceof ApiError &&
        error.body &&
        typeof error.body === "object" &&
        "fields" in error.body
          ? (error.body.fields as Record<string, string>)
          : null;
      if (fieldErrs) {
        setErrors(fieldErrs);
        toast.error("Check the highlighted fields.");
      } else {
        toast.error("Could not create the record.");
      }
    }
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-1 flex-col p-7">
        <Skeleton className="mx-auto h-64 w-full max-w-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-7">
      <Card className="mx-auto w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-lg">
            New {data.definition.name.toLowerCase()} record
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {data.definition.fields.map((def) => (
              <div key={def.id} className="flex flex-col gap-2">
                <Label>
                  {def.name}
                  {def.required && <span className="text-destructive"> *</span>}
                </Label>
                <DynamicFieldInput
                  definition={def}
                  value={values[def.id] ?? null}
                  onChange={(value) =>
                    setValues((prev) => ({ ...prev, [def.id]: value }))
                  }
                />
                {errors[def.id] && (
                  <p className="text-destructive text-sm">{errors[def.id]}</p>
                )}
              </div>
            ))}

            {data.definition.fields.length === 0 && (
              <p className="text-muted-foreground text-sm">
                This table has no fields yet — add some from Admin → Custom
                tables.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/tables/${slug}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createRecord.isPending}>
                {createRecord.isPending ? "Creating…" : "Create"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
