"use client";

import { fieldOptions } from "@/lib/custom-fields";
import { formatTicketNumber } from "@/lib/ticket-number";
import {
  useAssignableUsers,
  useTicketPrefix,
  useTickets,
} from "@/hooks/use-tickets";
import { useAssets } from "@/hooks/use-assets";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Structural, not the exact Prisma model — this renders both Ticket/Asset
// custom fields (CustomFieldDefinitionModel, no relationTarget) and custom
// entity table fields (CustomEntityFieldDefinitionModel, Section 5.4).
type FieldDefinitionLike = {
  id: string;
  fieldType: string;
  options: unknown;
  relationTarget?: string | null;
};

function TicketRelationSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const { data } = useTickets({});
  const { data: prefixData } = useTicketPrefix();
  const prefix = prefixData?.ticketPrefix ?? "KYM";
  return (
    <Select value={value ?? ""} onValueChange={(v) => onChange(v || null)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a ticket…" />
      </SelectTrigger>
      <SelectContent>
        {data?.tickets.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {formatTicketNumber(prefix, t.ticketNumber)} — {t.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AssetRelationSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const { data } = useAssets({});
  return (
    <Select value={value ?? ""} onValueChange={(v) => onChange(v || null)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select an asset…" />
      </SelectTrigger>
      <SelectContent>
        {data?.assets.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            {a.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function UserRelationSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const { data } = useAssignableUsers();
  return (
    <Select value={value ?? ""} onValueChange={(v) => onChange(v || null)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a user…" />
      </SelectTrigger>
      <SelectContent>
        {data?.users.map((u) => (
          <SelectItem key={u.id} value={u.id}>
            {u.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function DynamicFieldInput({
  definition,
  value,
  onChange,
}: {
  definition: FieldDefinitionLike;
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
    case "RELATION":
      switch (definition.relationTarget) {
        case "TICKET":
          return <TicketRelationSelect value={value} onChange={onChange} />;
        case "ASSET":
          return <AssetRelationSelect value={value} onChange={onChange} />;
        case "USER":
          return <UserRelationSelect value={value} onChange={onChange} />;
        default:
          return null;
      }
    default:
      return null;
  }
}
