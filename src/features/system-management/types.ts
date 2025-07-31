import { User, Role, Permission, Menu } from '@prisma/client';

// Extended types with relations
export type UserWithRoles = User & {
  roles: (UserRole & { role: Role })[];
};

export type RoleWithPermissions = Role & {
  permissions: (RolePermission & { permission: Permission })[];
};

export type PermissionWithRoles = Permission & {
  roles: (RolePermission & { role: Role })[];
};

export type MenuWithRelations = Menu & {
  children?: MenuWithRelations[];
  permissions?: (MenuPermission & { permission: Permission })[];
};

// Join table types
export type UserRole = {
  id: string;
  userId: string;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type RolePermission = {
  id: string;
  roleId: string;
  permissionId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type MenuPermission = {
  id: string;
  menuId: string;
  permissionId: string;
  createdAt: Date;
  updatedAt: Date;
};

// RBAC Context type
export type RBACContextType = {
  user: UserWithRoles | null;
  roles: Role[];
  permissions: Permission[];
  loading: boolean;
  hasPermission: (permissionName: string) => boolean;
  hasRole: (roleName: string) => boolean;
  refreshPermissions: () => Promise<void>;
};
