import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { verifyPassword } from "@/lib/password";
import type { Role } from "@/lib/roles";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        await dbConnect();
        // passwordHash has select:false, so request it explicitly.
        const user = await User.findOne({ email }).select("+passwordHash").lean();
        if (!user || !user.active) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role as Role,
          vendorId: user.vendor ? user.vendor.toString() : null,
          officeId: user.office ? user.office.toString() : null,
          active: user.active,
        };
      },
    }),
  ],
});
