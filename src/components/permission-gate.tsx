'use client';

import { useRBAC } from '@/features/system-management/rbac-context';
import { ReactNode } from 'react';

interface PermissionGateProps {
  permission?: string;
  role?: string;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * A component that conditionally renders its children based on user permissions/roles
 *
 * @param permission - The permission name to check for
 * @param role - The role name to check for
 * @param fallback - Optional component to render if user doesn't have permission
 * @param children - The content to render if user has permission
 */
export function PermissionGate({
  permission,
  role,
  fallback = null,
  children
}: PermissionGateProps) {
  const { hasPermission, hasRole, loading } = useRBAC();

  // While loading, don't render anything
  if (loading) {
    return null;
  }

  // Check if the user has the required permission or role
  const hasAccess =
    (permission ? hasPermission(permission) : true) &&
    (role ? hasRole(role) : true);

  // If the user has access, render the children, otherwise render the fallback
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
