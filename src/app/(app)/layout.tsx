import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  const role = (session.user as { role?: string }).role ?? "STAFF";
  const isDemo = (session.user as { isDemo?: boolean }).isDemo ?? false;

  return (
    <AppShell role={role} userName={session.user.name} isDemo={isDemo}>
      {children}
    </AppShell>
  );
}
