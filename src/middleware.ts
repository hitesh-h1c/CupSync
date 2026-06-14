import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { ROLE_HOME, ROLES, type Role } from "@/lib/roles";

// Edge-safe auth instance (no DB/bcrypt) — just reads the JWT.
const { auth } = NextAuth(authConfig);

/** Route prefix → roles allowed to access it. */
const ROUTE_GUARDS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/admin", roles: [ROLES.SUPER_ADMIN] },
  { prefix: "/vendor", roles: [ROLES.VENDOR] },
  { prefix: "/employee", roles: [ROLES.EMPLOYEE] },
  { prefix: "/office", roles: [ROLES.OFFICE] },
];

const PUBLIC_PATHS = ["/", "/login", "/signup"];

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const role = session?.user?.role as Role | undefined;
  const path = nextUrl.pathname;

  const guard = ROUTE_GUARDS.find((g) => path.startsWith(g.prefix));

  // Unauthenticated user hitting a guarded route → send to login.
  if (guard && !session) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  // Authenticated but wrong role → bounce to their own home.
  if (guard && role && !guard.roles.includes(role)) {
    return NextResponse.redirect(new URL(ROLE_HOME[role], nextUrl));
  }

  // Already signed in and visiting login/signup → go to role home.
  if (session && role && (path === "/login" || path === "/signup")) {
    return NextResponse.redirect(new URL(ROLE_HOME[role], nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Run on everything except Next internals, the auth API, and static assets.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

export { PUBLIC_PATHS };
