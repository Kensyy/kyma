import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ComingSoon } from "@/components/coming-soon";
import { CustomFieldsAdmin } from "@/components/custom-fields-admin";

export default async function AdminCustomFieldsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (role !== "ADMIN") {
    return <ComingSoon title="Admins only" milestone="—" />;
  }

  return <CustomFieldsAdmin />;
}
