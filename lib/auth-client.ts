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

// Add updateUser helper for PATCHing user role/name/email
export async function updateUser({
  userId,
  ...fields
}: {
  userId: string;
  name?: string;
  email?: string;
  role?: string;
}) {
  const res = await fetch(`/api/auth/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to update user");
  }
  return res.json();
}

export const { signIn, signUp, useSession, signOut } = authClient;
