import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { admin } from "better-auth/plugins";
import { user, account, session, verification } from "@/db/schema/auth";
import { ac, hrManager, adminRole } from "@/lib/permissions";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: user,
      session: session,
      account: account,
      verification: verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin({
      ac,
      roles: {
        admin: adminRole,
        "hr-manager": hrManager,
      },
      adminRoles: ["admin"],
    }),
  ],
});
