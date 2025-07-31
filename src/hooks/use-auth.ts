import { create } from 'zustand';
import { getApiUrl } from '@/lib/utils';

// Define types based on Prisma schema
interface Permission {
  id: string;
  name: string;
  description?: string | null;
}

interface Role {
  id: string;
  name: string;
  description?: string | null;
  permissions: RolePermission[];
}

interface RolePermission {
  id: string;
  permissionId: string;
  permission: Permission;
}

interface UserRole {
  id: string;
  roleId: string;
  role: Role;
}

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string | null;
  roles?: UserRole[];
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  setUser: (user) => {
    console.log('Setting user in auth store:', user?.email);
    set({ user });
  },
  setLoading: (isLoading) => set({ isLoading }),
  logout: async () => {
    try {
      await fetch(getApiUrl('/api/auth/logout'), { method: 'POST' });
      set({ user: null });
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  },

  hasPermission: (permission: string) => {
    const { user } = get();
    if (!user || !user.roles) return false;

    return user.roles.some((userRole) =>
      userRole.role.permissions.some(
        (rolePermission) => rolePermission.permission.name === permission
      )
    );
  },

  hasRole: (roleName: string) => {
    const { user } = get();
    if (!user || !user.roles) return false;

    return user.roles.some((userRole) => userRole.role.name === roleName);
  }
}));
