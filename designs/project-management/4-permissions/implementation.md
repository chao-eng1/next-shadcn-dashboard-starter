# 项目管理模块 - 权限控制实现指南

本文档提供项目管理模块权限控制的实现指南，包括代码结构、关键组件和集成策略。

## 目录

1. [权限检查工具](#权限检查工具)
2. [权限检查中间件](#权限检查中间件)
3. [API请求权限验证](#api请求权限验证)
4. [前端权限控制](#前端权限控制)
5. [权限数据库迁移](#权限数据库迁移)
6. [测试策略](#测试策略)
7. [部署与维护](#部署与维护)

## 权限检查工具

权限检查工具函数用于验证用户是否具有执行特定操作的权限。

### 项目角色权限工具

```typescript
// /features/project-management/utils/project-permissions.ts

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  ROLE_PERMISSIONS,
  ProjectRole,
  ProjectPermission
} from '../config/role-permissions';

// 缓存实现
const permissionCache = new Map<string, boolean>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

function getCacheKey(
  userId: string,
  projectId: string,
  permission: string
): string {
  return `${userId}:${projectId}:${permission}`;
}

function setCache(key: string, value: boolean): void {
  permissionCache.set(key, value);
  setTimeout(() => {
    permissionCache.delete(key);
  }, CACHE_TTL);
}

// 检查用户是否为项目所有者
export async function isProjectOwner(
  projectId: string,
  userId?: string
): Promise<boolean> {
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return false;
    userId = user.id;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true }
  });

  return project?.ownerId === userId;
}

// 获取用户在项目中的角色
export async function getUserProjectRole(
  projectId: string,
  userId?: string
): Promise<ProjectRole | null> {
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return null;
    userId = user.id;
  }

  // 检查是否为项目所有者
  const isOwner = await isProjectOwner(projectId, userId);
  if (isOwner) return 'OWNER';

  // 获取项目成员角色
  const projectMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    }
  });

  return (projectMember?.role as ProjectRole) || null;
}

// 检查用户是否有项目特定权限
export async function hasProjectPermission(
  projectId: string,
  permission: ProjectPermission,
  userId?: string
): Promise<boolean> {
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return false;
    userId = user.id;
  }

  // 检查缓存
  const cacheKey = getCacheKey(userId, projectId, permission);
  if (permissionCache.has(cacheKey)) {
    return permissionCache.get(cacheKey)!;
  }

  // 获取用户角色
  const role = await getUserProjectRole(projectId, userId);
  if (!role) {
    setCache(cacheKey, false);
    return false;
  }

  // 检查角色是否有此权限
  const hasPermission = ROLE_PERMISSIONS[role].includes(permission);
  setCache(cacheKey, hasPermission);
  return hasPermission;
}

// 检查用户是否为项目成员（任何角色）
export async function isProjectMember(
  projectId: string,
  userId?: string
): Promise<boolean> {
  return (await getUserProjectRole(projectId, userId)) !== null;
}

// 检查用户是否为项目管理员
export async function isProjectAdmin(
  projectId: string,
  userId?: string
): Promise<boolean> {
  const role = await getUserProjectRole(projectId, userId);
  return role === 'OWNER' || role === 'ADMIN';
}

// 检查用户对任务的权限
export async function hasTaskPermission(
  taskId: string,
  permission: ProjectPermission,
  userId?: string
): Promise<boolean> {
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return false;
    userId = user.id;
  }

  // 获取任务所属项目
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true }
  });

  if (!task) return false;

  // 检查项目权限
  return hasProjectPermission(task.projectId, permission, userId);
}

// 批量获取项目权限（用于前端）
export async function getProjectPermissions(
  projectId: string,
  userId?: string
): Promise<Record<ProjectPermission, boolean>> {
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) {
      // 返回所有权限为false
      return Object.values(ProjectPermission).reduce(
        (acc, permission) => {
          acc[permission] = false;
          return acc;
        },
        {} as Record<ProjectPermission, boolean>
      );
    }
    userId = user.id;
  }

  const role = await getUserProjectRole(projectId, userId);
  if (!role) {
    // 返回所有权限为false
    return Object.values(ProjectPermission).reduce(
      (acc, permission) => {
        acc[permission] = false;
        return acc;
      },
      {} as Record<ProjectPermission, boolean>
    );
  }

  // 返回角色权限映射
  return Object.values(ProjectPermission).reduce(
    (acc, permission) => {
      acc[permission] = ROLE_PERMISSIONS[role].includes(permission);
      return acc;
    },
    {} as Record<ProjectPermission, boolean>
  );
}

// 检查并清除用户权限缓存
export function clearUserPermissionCache(
  userId: string,
  projectId?: string
): void {
  // 如果提供了projectId，只清除该项目的缓存
  if (projectId) {
    for (const key of permissionCache.keys()) {
      if (key.startsWith(`${userId}:${projectId}:`)) {
        permissionCache.delete(key);
      }
    }
  } else {
    // 清除该用户的所有缓存
    for (const key of permissionCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        permissionCache.delete(key);
      }
    }
  }
}
```

### 系统级权限工具

```typescript
// /lib/permissions.ts

import { prisma } from './prisma';
import { getCurrentUser } from './auth';

// 检查用户是否有系统权限
export async function hasSystemPermission(
  permissionName: string,
  userId?: string
): Promise<boolean> {
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return false;
    userId = user.id;
  }

  // 获取用户角色
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  });

  // 检查角色是否有此权限
  for (const userRole of userRoles) {
    const hasPermission = userRole.role.permissions.some(
      (rp) => rp.permission.name === permissionName
    );

    if (hasPermission) return true;
  }

  return false;
}

// 获取用户是否为管理员
export async function isSystemAdmin(userId?: string): Promise<boolean> {
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return false;
    userId = user.id;
  }

  const adminRole = await prisma.userRole.findFirst({
    where: {
      userId,
      role: {
        name: 'admin'
      }
    }
  });

  return !!adminRole;
}

// 检查项目管理权限（系统级）
export async function canManageProjects(userId?: string): Promise<boolean> {
  return hasSystemPermission('project.create', userId);
}
```

## 权限检查中间件

在路由中间件中实现初步权限检查，防止未授权访问。

### 项目管理中间件

```typescript
// /middleware-plugins/project-management.ts
import { NextRequest, NextResponse } from 'next/server';
import { hasSystemPermission } from '@/lib/permissions';

export async function projectManagementMiddleware(
  request: NextRequest
): Promise<NextResponse | undefined> {
  // 项目路由
  if (request.nextUrl.pathname.startsWith('/dashboard/projects')) {
    // 项目列表路由 - 需要 project.view 权限
    if (request.nextUrl.pathname === '/dashboard/projects') {
      const hasPermission = await hasSystemPermission('project.view');
      if (!hasPermission) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // 新建项目路由 - 需要 project.create 权限
    if (request.nextUrl.pathname === '/dashboard/projects/new') {
      const hasPermission = await hasSystemPermission('project.create');
      if (!hasPermission) {
        return NextResponse.redirect(
          new URL('/dashboard/projects', request.url)
        );
      }
    }

    // 项目详情路由 - 需要项目成员身份
    const projectMatch = request.nextUrl.pathname.match(/\/projects\/([^\/]+)/);
    const projectId = projectMatch ? projectMatch[1] : null;

    if (projectId && projectId !== 'new') {
      try {
        // 通过API验证用户是否为项目成员
        const memberCheck = await fetch(
          `${request.url}/api/projects/${projectId}/members/check`,
          {
            headers: {
              Cookie: request.headers.get('cookie') || ''
            }
          }
        );

        if (!memberCheck.ok) {
          return NextResponse.redirect(
            new URL('/dashboard/projects', request.url)
          );
        }
      } catch (error) {
        // 如果API调用失败，默认拒绝访问
        return NextResponse.redirect(
          new URL('/dashboard/projects', request.url)
        );
      }
    }
  }

  // 继续处理请求
  return undefined;
}
```

### 中间件集成

将项目管理中间件集成到主中间件中：

```typescript
// /middleware.ts
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { projectManagementMiddleware } from './middleware-plugins/project-management';

export default withAuth(
  async function middleware(request) {
    // 如果用户未认证，withAuth 已经处理重定向

    // 项目管理中间件
    const projectResponse = await projectManagementMiddleware(request);
    if (projectResponse) return projectResponse;

    // 其他中间件...

    // 允许请求继续
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
);
```

## API请求权限验证

在API处理函数中实现详细的权限检查。

### 项目API权限检查

```typescript
// /app/api/projects/[projectId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  apiResponse,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiForbidden
} from '@/lib/api-response';
import { hasProjectPermission } from '@/features/project-management/utils/project-permissions';

// 获取项目详情
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const projectId = params.projectId;

  // 检查用户是否有查看项目的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'project.view',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden("You don't have permission to view this project");
  }

  // 继续处理请求...
}

// 更新项目
export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const projectId = params.projectId;

  // 检查用户是否有更新项目的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'project.update',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden("You don't have permission to update this project");
  }

  // 继续处理请求...
}

// 删除项目
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const projectId = params.projectId;

  // 检查用户是否有删除项目的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'project.delete',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden("You don't have permission to delete this project");
  }

  // 继续处理请求...
}
```

### 任务API权限检查

```typescript
// /app/api/projects/[projectId]/tasks/[taskId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  apiResponse,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiForbidden
} from '@/lib/api-response';
import { hasTaskPermission } from '@/features/project-management/utils/project-permissions';

// 获取任务详情
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; taskId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { taskId } = params;

  // 检查用户是否有查看任务的权限
  const hasPermission = await hasTaskPermission(taskId, 'task.view', user.id);

  if (!hasPermission) {
    return apiForbidden("You don't have permission to view this task");
  }

  // 继续处理请求...
}

// 更新任务
export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string; taskId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { taskId } = params;

  // 检查用户是否有更新任务的权限
  const hasPermission = await hasTaskPermission(taskId, 'task.update', user.id);

  if (!hasPermission) {
    return apiForbidden("You don't have permission to update this task");
  }

  // 继续处理请求...
}

// 删除任务
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; taskId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { taskId } = params;

  // 检查用户是否有删除任务的权限
  const hasPermission = await hasTaskPermission(taskId, 'task.delete', user.id);

  if (!hasPermission) {
    return apiForbidden("You don't have permission to delete this task");
  }

  // 继续处理请求...
}
```

### 成员权限检查

```typescript
// /app/api/projects/[projectId]/members/check/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  apiResponse,
  apiUnauthorized,
  apiNotFound,
  apiForbidden
} from '@/lib/api-response';
import { isProjectMember } from '@/features/project-management/utils/project-permissions';

// 检查用户是否为项目成员的API端点
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const projectId = params.projectId;

  // 检查用户是否为项目成员
  const isMember = await isProjectMember(projectId, user.id);

  if (!isMember) {
    return apiForbidden('You are not a member of this project');
  }

  return apiResponse({ isMember: true });
}
```

## 前端权限控制

在前端组件中根据用户权限控制UI元素的显示。

### 项目权限钩子

```typescript
// /features/project-management/hooks/use-project-permissions.ts

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { ProjectPermission } from '../config/role-permissions';

// 客户端权限缓存
const permissionCache = new Map<string, Record<string, boolean>>();

export function useProjectPermissions(projectId: string) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // 获取权限数据
  const fetchPermissions = useCallback(async () => {
    if (!user || !projectId) {
      setPermissions({});
      setLoading(false);
      return;
    }

    // 检查缓存
    const cacheKey = `${user.id}:${projectId}`;
    if (permissionCache.has(cacheKey)) {
      setPermissions(permissionCache.get(cacheKey) || {});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/permissions`);

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          // 缓存权限数据
          permissionCache.set(cacheKey, data.data);
          setPermissions(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch project permissions:', error);
    } finally {
      setLoading(false);
    }
  }, [user, projectId]);

  // 权限检查函数
  const hasPermission = useCallback(
    (permission: ProjectPermission): boolean => {
      return !!permissions[permission];
    },
    [permissions]
  );

  // 清除权限缓存
  const clearPermissionCache = useCallback(() => {
    if (user && projectId) {
      const cacheKey = `${user.id}:${projectId}`;
      permissionCache.delete(cacheKey);
      fetchPermissions();
    }
  }, [user, projectId, fetchPermissions]);

  // 加载权限数据
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    hasPermission,
    loading,
    refreshPermissions: fetchPermissions,
    clearPermissionCache
  };
}
```

### 权限API端点

```typescript
// /app/api/projects/[projectId]/permissions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  apiResponse,
  apiUnauthorized,
  apiNotFound,
  apiForbidden
} from '@/lib/api-response';
import { getProjectPermissions } from '@/features/project-management/utils/project-permissions';

// 获取用户在项目中的权限
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const projectId = params.projectId;

  // 获取用户在项目中的所有权限
  const permissions = await getProjectPermissions(projectId, user.id);

  return apiResponse(permissions);
}
```

### 使用权限控制组件

```tsx
// /features/project-management/components/project/project-actions.tsx

import { Button } from '@/components/ui/button';
import { useProjectPermissions } from '../../hooks/use-project-permissions';
import { Pencil, Trash, UserPlus, Settings, Plus } from 'lucide-react';

interface ProjectActionsProps {
  projectId: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddMember?: () => void;
  onSettings?: () => void;
  onAddTask?: () => void;
}

export function ProjectActions({
  projectId,
  onEdit,
  onDelete,
  onAddMember,
  onSettings,
  onAddTask
}: ProjectActionsProps) {
  const { hasPermission, loading } = useProjectPermissions(projectId);

  if (loading) {
    return (
      <div className='flex animate-pulse gap-2'>
        <div className='bg-muted h-8 w-8 rounded'></div>
        <div className='bg-muted h-8 w-8 rounded'></div>
        <div className='bg-muted h-8 w-8 rounded'></div>
      </div>
    );
  }

  return (
    <div className='flex gap-2'>
      {hasPermission('task.create') && (
        <Button size='sm' onClick={onAddTask}>
          <Plus className='mr-1 h-4 w-4' />
          添加任务
        </Button>
      )}

      {hasPermission('project.update') && (
        <Button size='icon' variant='outline' onClick={onEdit} title='编辑项目'>
          <Pencil className='h-4 w-4' />
        </Button>
      )}

      {hasPermission('project.member.manage') && (
        <Button
          size='icon'
          variant='outline'
          onClick={onAddMember}
          title='管理成员'
        >
          <UserPlus className='h-4 w-4' />
        </Button>
      )}

      {hasPermission('project.setting.manage') && (
        <Button
          size='icon'
          variant='outline'
          onClick={onSettings}
          title='项目设置'
        >
          <Settings className='h-4 w-4' />
        </Button>
      )}

      {hasPermission('project.delete') && (
        <Button
          size='icon'
          variant='destructive'
          onClick={onDelete}
          title='删除项目'
        >
          <Trash className='h-4 w-4' />
        </Button>
      )}
    </div>
  );
}
```

### 权限校验包装器

```tsx
// /features/project-management/components/permission-guard.tsx

import { ReactNode } from 'react';
import { useProjectPermissions } from '../hooks/use-project-permissions';
import { ProjectPermission } from '../config/role-permissions';

interface PermissionGuardProps {
  projectId: string;
  permission: ProjectPermission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({
  projectId,
  permission,
  children,
  fallback = null
}: PermissionGuardProps) {
  const { hasPermission, loading } = useProjectPermissions(projectId);

  if (loading) {
    return null;
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

### 服务器组件权限检查

```tsx
// /app/dashboard/projects/[projectId]/settings/page.tsx

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { hasProjectPermission } from '@/features/project-management/utils/project-permissions';
import { ProjectSettings } from '@/features/project-management/components/project/project-settings';

export default async function ProjectSettingsPage({
  params
}: {
  params: { projectId: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  const projectId = params.projectId;

  // 检查用户是否有管理项目设置的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'project.setting.manage',
    user.id
  );

  if (!hasPermission) {
    redirect(`/dashboard/projects/${projectId}`);
  }

  return (
    <div className='container space-y-6 py-6'>
      <h1 className='text-3xl font-bold tracking-tight'>项目设置</h1>

      <ProjectSettings projectId={projectId} />
    </div>
  );
}
```

## 权限数据库迁移

添加权限数据到数据库的迁移脚本。

### 权限种子数据

```typescript
// /prisma/seed/project-permissions.ts

import { PrismaClient } from '@prisma/client';
import { ProjectPermission } from '@/features/project-management/config/role-permissions';

const prisma = new PrismaClient();

export async function seedProjectPermissions() {
  // 创建项目管理权限
  const permissionDescriptions: Record<ProjectPermission, string> = {
    'project.view': '查看项目',
    'project.create': '创建项目',
    'project.update': '编辑项目',
    'project.delete': '删除项目',
    'project.member.manage': '管理项目成员',
    'project.setting.manage': '管理项目设置',
    'task.view': '查看任务',
    'task.create': '创建任务',
    'task.update': '编辑任务',
    'task.delete': '删除任务',
    'task.assign': '分配任务',
    'task.status.update': '更新任务状态',
    'sprint.view': '查看迭代',
    'sprint.create': '创建迭代',
    'sprint.update': '编辑迭代',
    'sprint.delete': '删除迭代',
    'sprint.manage_tasks': '管理迭代任务',
    'comment.view': '查看评论',
    'comment.create': '添加评论',
    'comment.update': '编辑评论',
    'comment.delete': '删除评论',
    'attachment.view': '查看附件',
    'attachment.upload': '上传附件',
    'attachment.delete': '删除附件'
  };

  console.log('Creating project management permissions...');

  // 批量创建权限
  for (const [name, description] of Object.entries(permissionDescriptions)) {
    await prisma.permission.upsert({
      where: { name },
      update: { description },
      create: { name, description }
    });

    console.log(`Created permission: ${name}`);
  }

  console.log('Assigning permissions to admin role...');

  // 为管理员角色分配所有项目管理权限
  const adminRole = await prisma.role.findFirst({
    where: { name: 'admin' }
  });

  if (adminRole) {
    for (const name of Object.keys(permissionDescriptions)) {
      const permission = await prisma.permission.findUnique({
        where: { name }
      });

      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: adminRole.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        });

        console.log(`Assigned permission ${name} to admin role`);
      }
    }
  }

  console.log('Assigning basic permissions to user role...');

  // 为普通用户角色分配基本项目权限
  const userRole = await prisma.role.findFirst({
    where: { name: 'user' }
  });

  if (userRole) {
    // 普通用户只需要项目创建权限，其他权限通过项目角色控制
    const basicPermissions = ['project.create', 'project.view'];

    for (const name of basicPermissions) {
      const permission = await prisma.permission.findUnique({
        where: { name }
      });

      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: userRole.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            roleId: userRole.id,
            permissionId: permission.id
          }
        });

        console.log(`Assigned permission ${name} to user role`);
      }
    }
  }

  console.log('Project permissions seed completed');
}
```

### 迁移执行

将权限种子数据集成到主种子脚本中：

```typescript
// /prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import { seedUsers } from './seed/users';
import { seedRoles } from './seed/roles';
import { seedPermissions } from './seed/permissions';
import { seedProjectPermissions } from './seed/project-permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 基础数据填充
  await seedRoles();
  await seedPermissions();
  await seedUsers();

  // 项目管理模块数据
  await seedProjectPermissions();

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## 测试策略

针对权限系统的测试策略。

### 单元测试

测试权限检查工具函数：

```typescript
// /tests/unit/project-permissions.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isProjectOwner,
  getUserProjectRole,
  hasProjectPermission,
  isProjectMember,
  isProjectAdmin
} from '@/features/project-management/utils/project-permissions';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 模拟prisma和getCurrentUser
vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findUnique: vi.fn()
    },
    projectMember: {
      findUnique: vi.fn()
    }
  }
}));

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn()
}));

describe('Project Permissions Utils', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('isProjectOwner', () => {
    it('should return true if user is project owner', async () => {
      // 模拟项目数据
      (prisma.project.findUnique as any).mockResolvedValue({
        id: 'project-1',
        ownerId: 'user-1'
      });

      const result = await isProjectOwner('project-1', 'user-1');
      expect(result).toBe(true);
    });

    it('should return false if user is not project owner', async () => {
      // 模拟项目数据
      (prisma.project.findUnique as any).mockResolvedValue({
        id: 'project-1',
        ownerId: 'user-2'
      });

      const result = await isProjectOwner('project-1', 'user-1');
      expect(result).toBe(false);
    });

    it('should return false if project not found', async () => {
      // 模拟项目不存在
      (prisma.project.findUnique as any).mockResolvedValue(null);

      const result = await isProjectOwner('project-1', 'user-1');
      expect(result).toBe(false);
    });

    it('should use getCurrentUser if userId not provided', async () => {
      // 模拟当前用户
      (getCurrentUser as any).mockResolvedValue({ id: 'user-1' });

      // 模拟项目数据
      (prisma.project.findUnique as any).mockResolvedValue({
        id: 'project-1',
        ownerId: 'user-1'
      });

      const result = await isProjectOwner('project-1');
      expect(result).toBe(true);
      expect(getCurrentUser).toHaveBeenCalled();
    });
  });

  // 类似地测试其他权限工具函数...
});
```

### 集成测试

测试API权限验证：

```typescript
// /tests/integration/project-api-permissions.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { GET, PATCH, DELETE } from '@/app/api/projects/[projectId]/route';
import { prisma } from '@/lib/prisma';
import { mockCurrentUser } from '../mocks/auth';
import { seedTestDatabase, clearTestDatabase } from '../utils/db-utils';

describe('Project API Permissions', () => {
  beforeAll(async () => {
    // 准备测试数据库
    await seedTestDatabase();
  });

  afterAll(async () => {
    // 清理测试数据库
    await clearTestDatabase();
  });

  describe('GET /api/projects/:projectId', () => {
    it('should return 401 if user not authenticated', async () => {
      // 模拟未认证用户
      mockCurrentUser(null);

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/projects/project-1',
        params: {
          projectId: 'project-1'
        }
      });

      await GET(req, { params: { projectId: 'project-1' } });

      expect(res._getStatusCode()).toBe(401);
    });

    it('should return 403 if user is not a project member', async () => {
      // 模拟认证用户
      mockCurrentUser({
        id: 'non-member-user',
        name: 'Non Member'
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/projects/project-1',
        params: {
          projectId: 'project-1'
        }
      });

      await GET(req, { params: { projectId: 'project-1' } });

      expect(res._getStatusCode()).toBe(403);
    });

    it('should return 200 if user is a project member', async () => {
      // 模拟项目成员
      mockCurrentUser({
        id: 'member-user',
        name: 'Member User'
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/projects/project-1',
        params: {
          projectId: 'project-1'
        }
      });

      await GET(req, { params: { projectId: 'project-1' } });

      expect(res._getStatusCode()).toBe(200);
    });
  });

  // 类似地测试其他API端点...
});
```

### 端到端测试

使用Playwright测试前端权限控制：

```typescript
// /tests/e2e/project-permissions.spec.ts

import { test, expect } from '@playwright/test';
import { login, seedTestUser, setupDatabase } from './utils';

test.describe('Project Permissions', () => {
  test.beforeAll(async () => {
    await setupDatabase();
  });

  test('owner should see all project actions', async ({ page }) => {
    // 创建测试用户并登录
    const user = await seedTestUser('owner');
    await login(page, user.email, 'password');

    // 导航到项目页面
    await page.goto('/dashboard/projects/owner-project');

    // 验证所有操作按钮可见
    await expect(page.locator('button[title="编辑项目"]')).toBeVisible();
    await expect(page.locator('button[title="管理成员"]')).toBeVisible();
    await expect(page.locator('button[title="项目设置"]')).toBeVisible();
    await expect(page.locator('button[title="删除项目"]')).toBeVisible();
    await expect(page.locator('button:has-text("添加任务")')).toBeVisible();
  });

  test('member should see limited project actions', async ({ page }) => {
    // 创建测试用户并登录
    const user = await seedTestUser('member');
    await login(page, user.email, 'password');

    // 导航到项目页面
    await page.goto('/dashboard/projects/test-project');

    // 验证有限的操作按钮可见
    await expect(page.locator('button:has-text("添加任务")')).toBeVisible();

    // 验证管理操作不可见
    await expect(page.locator('button[title="编辑项目"]')).not.toBeVisible();
    await expect(page.locator('button[title="管理成员"]')).not.toBeVisible();
    await expect(page.locator('button[title="项目设置"]')).not.toBeVisible();
    await expect(page.locator('button[title="删除项目"]')).not.toBeVisible();
  });

  test('viewer should see no project actions', async ({ page }) => {
    // 创建测试用户并登录
    const user = await seedTestUser('viewer');
    await login(page, user.email, 'password');

    // 导航到项目页面
    await page.goto('/dashboard/projects/test-project');

    // 验证所有操作按钮不可见
    await expect(page.locator('button[title="编辑项目"]')).not.toBeVisible();
    await expect(page.locator('button[title="管理成员"]')).not.toBeVisible();
    await expect(page.locator('button[title="项目设置"]')).not.toBeVisible();
    await expect(page.locator('button[title="删除项目"]')).not.toBeVisible();
    await expect(page.locator('button:has-text("添加任务")')).not.toBeVisible();
  });

  // 更多权限测试...
});
```

## 部署与维护

权限系统的部署和维护策略。

### 部署检查清单

1. 数据库迁移：确保权限表和数据已正确迁移
2. 种子数据：运行权限种子脚本创建基础权限
3. 环境变量：检查所有必要的环境变量
4. 权限验证：验证关键路由的权限检查

### 维护策略

1. **定期审计**：

   - 定期检查权限配置是否最新
   - 确保角色权限符合业务需求
   - 审核权限使用日志，发现潜在问题

2. **权限更新流程**：

   - 记录权限变更需求
   - 测试环境验证变更
   - 编写迁移脚本
   - 部署变更
   - 验证变更生效

3. **故障恢复**：

   - 维护权限数据备份
   - 创建恢复脚本
   - 定义回滚流程

4. **性能监控**：
   - 监控权限检查性能
   - 优化缓存策略
   - 定期清理缓存数据

通过这些实现策略，项目管理模块的权限控制系统将提供安全、高效的访问控制，确保用户只能执行其角色允许的操作。
