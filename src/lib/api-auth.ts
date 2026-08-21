import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isDemo: boolean;
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

  const { id, name, email, role, isDemo } = session.user as SessionUser;
  return { user: { id, name, email, role, isDemo: isDemo ?? false } };
}

/**
 * Same as requireSession(), but also rejects the seeded public-demo account
 * (Section 10) — call this instead of requireSession() in every mutating
 * (POST/PATCH/DELETE) handler so a recruiter clicking through the live demo
 * can't actually change the shared seed data. `code: "DEMO_READ_ONLY"` lets
 * api-client.ts recognize this specific case and surface one clear toast
 * regardless of what each call site's own catch block does with the error.
 */
export async function requireWriteSession(): Promise<
  { user: SessionUser } | { error: NextResponse }
> {
  const result = await requireSession();
  if ("error" in result) return result;

  if (result.user.isDemo) {
    return {
      error: NextResponse.json(
        {
          error: "This is a read-only demo account — changes aren't saved.",
          code: "DEMO_READ_ONLY",
        },
        { status: 403 },
      ),
    };
  }

  return result;
}

export function requireAdmin(user: SessionUser): NextResponse | null {
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
