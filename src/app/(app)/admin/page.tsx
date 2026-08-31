import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { ComingSoon } from "@/components/coming-soon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SETTINGS_LINKS = [
  {
    href: "/admin/custom-fields",
    title: "Custom fields",
    description:
      "Add, reorder, or retire custom fields on tickets and assets.",
  },
  {
    href: "/admin/custom-entities",
    title: "Custom tables",
    description: "Define new admin-managed tables with typed fields.",
  },
  {
    href: "/admin/activity",
    title: "Activity log",
    description: "Every create, update, and status change across the app.",
  },
  {
    href: "/admin/integrations",
    title: "Integrations",
    description: "Inbound webhooks that create tickets, and outbound event subscriptions.",
  },
  {
    href: "/admin/sla-policies",
    title: "SLA policies",
    description: "Configure SLA due-date windows per priority and category.",
  },
];

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (role !== "ADMIN") {
    return <ComingSoon title="Admins only" milestone="—" />;
  }

  return (
    <div className="flex flex-col gap-6 p-7">
      <div>
        <h1 className="font-heading text-xl font-semibold">Admin settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage the schema-driven parts of Kyma — fields, tables,
          integrations, and SLA policies.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SETTINGS_LINKS.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:border-primary/50 h-full transition-colors">
              <CardHeader>
                <CardTitle className="text-base font-bold">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
