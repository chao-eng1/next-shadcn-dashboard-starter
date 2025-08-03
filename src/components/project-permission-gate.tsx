'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRBAC } from '@/features/system-management/rbac-context';
import { getApiUrl } from '@/lib/utils';

interface ProjectPermissionGateProps {
  permission: string;
  projectId: string;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * A component that conditionally renders its children based on user's project-level permissions
 *
 * @param permission - The permission name to check for
 * @param projectId - The project ID to check permissions for
 * @param fallback - Optional component to render if user doesn't have permission
 * @param children - The content to render if user has permission
 */
export function ProjectPermissionGate({
  permission,
  projectId,
  fallback = null,
  children
}: ProjectPermissionGateProps) {
  const { user, loading: rbacLoading } = useRBAC();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkPermission() {
      if (!user || !projectId || rbacLoading) {
        setHasAccess(false);
        setLoading(rbacLoading);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          getApiUrl(
            `/api/projects/${projectId}/permissions/check?permission=${encodeURIComponent(permission)}`
          ),
          {
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setHasAccess(data.data?.hasPermission || false);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error('Failed to check project permission:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }

    checkPermission();
  }, [user, projectId, permission, rbacLoading]);

  // While loading, don't render anything
  if (loading) {
    return null;
  }

  // If the user has access, render the children, otherwise render the fallback
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
