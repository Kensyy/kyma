import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ComingSoon } from "@/components/coming-soon";
import { CustomEntityFieldsAdmin } from "@/components/custom-entity-fields-admin";

export default async function AdminCustomEntityFieldsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (role !== "ADMIN") {
    return <ComingSoon title="Admins only" milestone="—" />;
  }

  const { slug } = await params;
  return <CustomEntityFieldsAdmin slug={slug} />;
}
