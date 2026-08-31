import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Dashboard } from "@/components/dashboard";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return <Dashboard userName={session?.user.name ?? ""} />;
}
