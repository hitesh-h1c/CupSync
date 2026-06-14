import type { NextAuthConfig } from "next-auth";
import { ROLE_HOME, type Role } from "@/lib/roles";

/**
 * Edge-safe Auth.js config.
 *
 * Holds only what the middleware needs (pages + callbacks). The Credentials
 * provider lives in `auth.ts` because it imports Mongoose/bcrypt, which cannot
 * run in the edge runtime. Keeping them apart lets middleware verify the JWT
 * without dragging Node-only code into the edge bundle.
 */
export const authConfig = {
  // Vercel sets this automatically; required when self-hosting / on localhost.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    // Persist identity + scoping claims onto the JWT at sign-in.
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.vendorId = user.vendorId ?? null;
        token.officeId = user.officeId ?? null;
        token.active = user.active;
      }
      return token;
    },
    // Expose those claims on the session object read by the app.
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as Role;
        session.user.vendorId = (token.vendorId as string | null) ?? null;
        session.user.officeId = (token.officeId as string | null) ?? null;
        session.user.active = token.active as boolean;
      }
      return session;
    },
  },
  providers: [], // populated in auth.ts
} satisfies NextAuthConfig;

export { ROLE_HOME };
