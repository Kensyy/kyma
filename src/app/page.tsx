import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  // End Users have no org-wide dashboard (Section 5.4-adjacent self-service
  // scoping) — land them straight on their own ticket list instead.
  const role = (session.user as { role?: string }).role;
  redirect(role === "END_USER" ? "/tickets" : "/dashboard");
}
