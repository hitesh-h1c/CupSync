import type { Role } from "@/lib/roles";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  /** Shape returned by `authorize` and carried into callbacks as `user`. */
  interface User {
    role: Role;
    vendorId?: string | null;
    officeId?: string | null;
    active: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      vendorId: string | null;
      officeId: string | null;
      active: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    vendorId?: string | null;
    officeId?: string | null;
    active: boolean;
  }
}
