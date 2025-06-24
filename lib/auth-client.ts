import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { ac, hrManager, adminRole } from "@/lib/permissions";

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac,
      roles: {
        admin: adminRole,
        "hr-manager": hrManager,
      },
    }),
  ],
});

export const { signIn, signUp, useSession } = authClient;