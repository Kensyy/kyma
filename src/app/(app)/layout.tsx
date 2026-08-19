import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";

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
    <div className="bg-background flex min-h-screen w-full">
      <SidebarNav role={role} userName={session.user.name} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
