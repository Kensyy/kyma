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
