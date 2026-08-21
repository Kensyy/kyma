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

  return (
    <AppShell role={role} userName={session.user.name}>
      {children}
    </AppShell>
  );
}
