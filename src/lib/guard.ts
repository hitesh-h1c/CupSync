import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/roles";
import type { Session } from "next-auth";

/**
 * Server-side authorization helpers. Use these in Server Components, Route
 * Handlers, and Server Actions — middleware is a first pass, but every mutation
 * and data read must re-check on the server. Never trust the client for role or
 * vendor scoping.
 */

/** Returns the session or redirects to login. For use in Server Components. */
export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

/** Returns the session if the user holds one of `roles`, else redirects. */
export async function requireRole(...roles: Role[]): Promise<Session> {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) redirect("/login");
  return session;
}

/**
 * Convenience for vendor pages/actions: guarantees a vendor session and a
 * non-null vendorId (every vendor user is created with a Vendor record).
 */
export async function requireVendor(): Promise<{
  session: Session;
  vendorId: string;
}> {
  const session = await requireRole("vendor");
  const vendorId = session.user.vendorId;
  if (!vendorId) redirect("/login");
  return { session, vendorId };
}

/** For Route Handlers / Server Actions: returns the session or null (no redirect). */
export async function getSessionOrNull(): Promise<Session | null> {
  return auth();
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/** Route-handler guard: throws AuthError (caller maps to a 401/403 response). */
export async function assertRole(...roles: Role[]): Promise<Session> {
  const session = await auth();
  if (!session?.user) throw new AuthError("Unauthenticated", 401);
  if (!roles.includes(session.user.role)) throw new AuthError("Forbidden", 403);
  return session;
}
