import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

/**
 * Resolves the current session for a route handler. Returns a 401
 * NextResponse (to return directly from the handler) when there is none.
 */
export async function requireSession(): Promise<
  { user: SessionUser } | { error: NextResponse }
> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { id, name, email, role } = session.user as SessionUser;
  return { user: { id, name, email, role } };
}

export function requireAdmin(user: SessionUser): NextResponse | null {
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
