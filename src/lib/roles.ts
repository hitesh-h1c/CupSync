/**
 * Platform roles. Defined once and reused across models, auth, and RBAC checks
 * so role strings never drift between layers.
 */
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  VENDOR: "vendor",
  EMPLOYEE: "employee",
  OFFICE: "office",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: Role[] = Object.values(ROLES);

/** Where each role lands after login. Used by middleware and the login flow. */
export const ROLE_HOME: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: "/admin",
  [ROLES.VENDOR]: "/vendor",
  [ROLES.EMPLOYEE]: "/employee",
  [ROLES.OFFICE]: "/office",
};
