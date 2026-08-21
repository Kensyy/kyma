import type { Prisma } from "@/generated/prisma/client";

export const customEntityDefinitionWithFieldsInclude = {
  fields: { orderBy: { order: "asc" as const } },
} satisfies Prisma.CustomEntityDefinitionInclude;

export type CustomEntityDefinitionWithFields =
  Prisma.CustomEntityDefinitionGetPayload<{
    include: typeof customEntityDefinitionWithFieldsInclude;
  }>;

export const customEntityRecordListInclude = {
  createdBy: { select: { id: true, name: true } },
  values: true,
} satisfies Prisma.CustomEntityRecordInclude;

export type CustomEntityRecordListItem = Prisma.CustomEntityRecordGetPayload<{
  include: typeof customEntityRecordListInclude;
}>;

// What GET /api/custom-entities/[slug]/records actually returns — the base
// record plus its own display label and, for any RELATION fields, the
// resolved human label for each raw id (Section 5.4).
export type CustomEntityRecordWithLabels = CustomEntityRecordListItem & {
  label: string | null;
  resolvedValues: Record<string, string | null>;
};
