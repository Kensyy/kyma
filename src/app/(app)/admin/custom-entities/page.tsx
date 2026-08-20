import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ComingSoon } from "@/components/coming-soon";
import { CustomEntitiesAdmin } from "@/components/custom-entities-admin";

export default async function AdminCustomEntitiesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (role !== "ADMIN") {
    return <ComingSoon title="Admins only" milestone="—" />;
  }

  return <CustomEntitiesAdmin />;
}
