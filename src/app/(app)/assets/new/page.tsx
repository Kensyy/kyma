"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  createAssetSchema,
  type CreateAssetInput,
} from "@/lib/validations/asset";
import { useAssetTypes, useCreateAsset } from "@/hooks/use-assets";
import { useStatuses } from "@/hooks/use-tickets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewAssetPage() {
  const router = useRouter();
  const { data: typeData } = useAssetTypes();
  const { data: statusData } = useStatuses("ASSET");
  const createAsset = useCreateAsset();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CreateAssetInput>({
    resolver: zodResolver(createAssetSchema),
  });

  const defaultStatus = statusData?.statuses.find((s) => s.order === 1);
  useEffect(() => {
    if (defaultStatus && !getValues("statusId")) {
      setValue("statusId", defaultStatus.id);
    }
  }, [defaultStatus, setValue, getValues]);

  async function onSubmit(values: CreateAssetInput) {
    try {
      const { asset } = await createAsset.mutateAsync(values);
      toast.success("Asset created");
      router.push(`/assets/${asset.id}`);
    } catch {
      toast.error("Could not create the asset.");
    }
  }

  return (
    <div className="flex flex-1 flex-col p-7">
      <Card className="mx-auto w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-lg">New asset</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name / model</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-destructive text-sm">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Type</Label>
                <Controller
                  control={control}
                  name="typeId"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent>
                        {typeData?.assetTypes.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.typeId && (
                  <p className="text-destructive text-sm">
                    {errors.typeId.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="serialNumber">Serial number</Label>
                <Input id="serialNumber" {...register("serialNumber")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="HQ · Desk 12"
                  {...register("location")}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="purchasedAt">Purchased</Label>
                <Input
                  id="purchasedAt"
                  type="date"
                  {...register("purchasedAt")}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/assets")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createAsset.isPending}>
                {createAsset.isPending ? "Creating…" : "Create asset"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
