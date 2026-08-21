import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ComingSoon } from "@/components/coming-soon";
import { ActivityLog } from "@/components/activity-log";

export default async function AdminActivityPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (role !== "ADMIN") {
    return <ComingSoon title="Admins only" milestone="—" />;
  }

  return <ActivityLog />;
}
