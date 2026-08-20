import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const [ticketStatuses, assetStatuses, categories, assetTypes] =
    await Promise.all([
      prisma.status.count({ where: { entityType: "TICKET" } }),
      prisma.status.count({ where: { entityType: "ASSET" } }),
      prisma.category.count({ where: { entityType: "TICKET" } }),
      prisma.assetType.count(),
    ]);

  const tiles = [
    { label: "Ticket statuses", value: ticketStatuses },
    { label: "Asset statuses", value: assetStatuses },
    { label: "Ticket categories", value: categories },
    { label: "Asset types", value: assetTypes },
  ];

  return (
    <div className="flex flex-col gap-6 p-7">
      <div>
        <h1 className="font-heading text-xl font-semibold">
          Welcome back, {session?.user.name}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Configurable widget layouts land in a later milestone — for now, head
          to Tickets or Assets to get to work.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardHeader>
              <CardTitle className="text-muted-foreground text-sm font-semibold">
                {tile.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-3xl font-semibold">
                {tile.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
