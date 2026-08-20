import type { CustomFieldDefinitionModel } from "@/generated/prisma/models";
import { fieldOptions } from "@/lib/custom-fields";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DynamicFieldInput({
  definition,
  value,
  onChange,
}: {
  definition: CustomFieldDefinitionModel;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  switch (definition.fieldType) {
    case "TEXT":
      return (
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
        />
      );
    case "NUMBER":
      return (
        <Input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
        />
      );
    case "DATE":
      return (
        <Input
          type="date"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
        />
      );
    case "BOOLEAN":
      return (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={value === "true"}
            onCheckedChange={(checked) =>
              onChange(checked === true ? "true" : "false")
            }
          />
          Yes
        </label>
      );
    case "SELECT": {
      const options = fieldOptions(definition.options);
      return (
        <Select value={value ?? ""} onValueChange={(v) => onChange(v || null)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    default:
      return null;
  }
}
