import type { Prisma } from "@/generated/prisma/client";

export const assetListInclude = {
  type: true,
  status: true,
  owner: { select: { id: true, name: true } },
} satisfies Prisma.AssetInclude;

export type AssetListItem = Prisma.AssetGetPayload<{
  include: typeof assetListInclude;
}>;

export const assetDetailInclude = {
  type: true,
  status: true,
  branch: true,
  owner: { select: { id: true, name: true } },
  history: {
    include: { user: { select: { id: true, name: true } } },
    orderBy: { timestamp: "desc" as const },
  },
} satisfies Prisma.AssetInclude;

export type AssetDetail = Prisma.AssetGetPayload<{
  include: typeof assetDetailInclude;
}>;
