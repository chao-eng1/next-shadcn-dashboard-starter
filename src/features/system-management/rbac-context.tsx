'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { RBACContextType, UserWithRoles } from './types';
import { getApiUrl } from '@/lib/utils';

// Define types locally to avoid Prisma client import issues
interface Permission {
  id: string;
  name: string;
  description?: string | null;
}

interface Role {
  id: string;
  name: string;
  description?: string | null;
  permissions: Array<{ permission: Permission }>;
}

// Create the RBAC context
const RBACContext = createContext<RBACContextType | undefined>(undefined);

export function useRBAC() {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error('useRBAC must be used within a RBACProvider');
  }
  return context;
}

export function RBACProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithRoles | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  // Function to fetch current user with roles and permissions
  const fetchUserPermissions = async () => {
    try {
      setLoading(true);

      // Add a small delay to ensure cookie is properly set after login
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await fetch(getApiUrl('/api/auth/me'), {
        credentials: 'include', // Ensure cookies are sent
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('RBAC: User not authenticated');
        } else {
          console.error(
            'RBAC: Failed to fetch user permissions, status:',
            response.status
          );
        }
        setUser(null);
        setRoles([]);
        setPermissions([]);
        return;
      }

      const userData = await response.json();
      console.log(
        'RBAC: Fetched user data:',
        userData.user?.email,
        'with roles:',
        userData.user?.roles?.length
      );
      setUser(userData.user);

      // Extract unique roles
      const userRoles =
        userData.user?.roles?.map((userRole: any) => userRole.role) || [];
      setRoles(userRoles);
      console.log(
        'RBAC: User roles:',
        userRoles.map((r) => r.name)
      );

      // Extract unique permissions from all roles
      const userPermissions = new Set<Permission>();
      userRoles.forEach((role: any) => {
        role.permissions?.forEach((rolePermission: any) => {
          userPermissions.add(rolePermission.permission);
        });
      });

      const permissionsArray = Array.from(userPermissions);
      setPermissions(permissionsArray);
      console.log(
        'RBAC: User permissions:',
        permissionsArray.map((p) => p.name)
      );
    } catch (error) {
      console.error('RBAC: Failed to fetch user permissions:', error);
      setUser(null);
      setRoles([]);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount and when page becomes visible (handles login redirect)
  useEffect(() => {
    fetchUserPermissions();

    // Listen for page visibility changes to refetch permissions
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Small delay to ensure any cookie changes are processed
        setTimeout(fetchUserPermissions, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Refetch permissions when navigating to dashboard (handles login redirect)
  useEffect(() => {
    if (
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/system-management')
    ) {
      // Small delay to ensure any navigation-related cookie changes are processed
      const timer = setTimeout(() => {
        if (!loading) {
          fetchUserPermissions();
        }
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [pathname, loading]);

  // Check if user has a specific permission
  const hasPermission = (permissionName: string): boolean => {
    if (!user) return false;
    return permissions.some((permission) => permission.name === permissionName);
  };

  // Check if user has a specific role
  const hasRole = (roleName: string): boolean => {
    if (!user) return false;
    return roles.some((role) => role.name === roleName);
  };

  const value = {
    user,
    roles,
    permissions,
    loading,
    hasPermission,
    hasRole,
    refreshPermissions: fetchUserPermissions
  };

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
}
