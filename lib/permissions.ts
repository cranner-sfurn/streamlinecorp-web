import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

export const statement = {
  ...defaultStatements,
} as const;

const ac = createAccessControl(statement);

export const hrManager = ac.newRole({
  user: ["create", "list", "set-role", "delete"],
});

export const adminRole = ac.newRole({
  ...adminAc.statements,
});

export { ac };
