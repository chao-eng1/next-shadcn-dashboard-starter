# 项目管理模块 - 权限控制设计

本文档详细描述项目管理模块的权限控制设计，包括权限模型、角色定义、权限检查机制和权限管理界面。

## 目录

1. [权限模型概述](#权限模型概述)
2. [角色与权限矩阵](#角色与权限矩阵)
3. [项目级权限](#项目级权限)
4. [资源级权限](#资源级权限)
5. [权限检查机制](#权限检查机制)
6. [权限数据结构](#权限数据结构)
7. [权限管理界面](#权限管理界面)
8. [权限迁移与初始化](#权限迁移与初始化)
9. [安全最佳实践](#安全最佳实践)

## 权限模型概述

项目管理模块采用基于角色的访问控制(RBAC)模型，结合资源级权限控制。权限模型包含以下几个关键部分：

1. **系统角色**: 决定用户在整个系统中的权限
2. **项目角色**: 决定用户在特定项目中的权限
3. **资源权限**: 针对特定资源(项目、任务、成员等)的操作权限
4. **权限继承**: 高级角色继承低级角色的所有权限

权限检查遵循"默认拒绝"原则，即除非明确授予权限，否则禁止所有操作。

## 角色与权限矩阵

### 系统角色

系统角色决定用户在整个系统层面的权限：

| 角色          | 描述                         | 权限范围                               |
| ------------- | ---------------------------- | -------------------------------------- |
| 管理员(Admin) | 系统管理员，拥有所有权限     | 所有系统功能，包括用户管理、角色管理等 |
| 用户(User)    | 普通用户，可以创建和参与项目 | 创建项目、参与被邀请的项目             |
| 访客(Guest)   | 有限访问权限的临时用户       | 只能查看被明确授权的项目               |

### 项目角色

项目角色决定用户在特定项目中的权限：

| 角色           | 描述                               | 权限范围                     |
| -------------- | ---------------------------------- | ---------------------------- |
| 所有者(Owner)  | 项目创建者，拥有项目的完全控制权   | 项目的所有操作，包括删除项目 |
| 管理员(Admin)  | 项目管理员，可以管理项目但不能删除 | 管理项目设置、成员、任务等   |
| 成员(Member)   | 项目普通成员，可以执行日常任务     | 创建和管理任务、添加评论等   |
| 观察者(Viewer) | 只读权限，可以查看但不能修改       | 查看项目、任务、评论等       |

## 项目级权限

项目级权限控制用户对项目整体的访问和操作：

| 权限代码               | 描述         | 默认授予角色                 |
| ---------------------- | ------------ | ---------------------------- |
| project.view           | 查看项目详情 | 所有者, 管理员, 成员, 观察者 |
| project.create         | 创建新项目   | 系统角色: 管理员, 用户       |
| project.update         | 编辑项目信息 | 所有者, 管理员               |
| project.delete         | 删除项目     | 所有者                       |
| project.member.manage  | 管理项目成员 | 所有者, 管理员               |
| project.setting.manage | 管理项目设置 | 所有者, 管理员               |

## 资源级权限

资源级权限控制用户对项目内特定资源的访问和操作：

### 任务权限

| 权限代码           | 描述           | 默认授予角色                 |
| ------------------ | -------------- | ---------------------------- |
| task.view          | 查看任务详情   | 所有者, 管理员, 成员, 观察者 |
| task.create        | 创建新任务     | 所有者, 管理员, 成员         |
| task.update        | 编辑任务信息   | 所有者, 管理员, 成员         |
| task.delete        | 删除任务       | 所有者, 管理员               |
| task.assign        | 分配任务给成员 | 所有者, 管理员, 成员         |
| task.status.update | 更新任务状态   | 所有者, 管理员, 成员         |

### 迭代权限

| 权限代码            | 描述             | 默认授予角色                 |
| ------------------- | ---------------- | ---------------------------- |
| sprint.view         | 查看迭代详情     | 所有者, 管理员, 成员, 观察者 |
| sprint.create       | 创建新迭代       | 所有者, 管理员               |
| sprint.update       | 编辑迭代信息     | 所有者, 管理员               |
| sprint.delete       | 删除迭代         | 所有者, 管理员               |
| sprint.manage_tasks | 管理迭代中的任务 | 所有者, 管理员, 成员         |

### 评论权限

| 权限代码       | 描述           | 默认授予角色                 |
| -------------- | -------------- | ---------------------------- |
| comment.view   | 查看评论       | 所有者, 管理员, 成员, 观察者 |
| comment.create | 添加评论       | 所有者, 管理员, 成员         |
| comment.update | 编辑自己的评论 | 所有者, 管理员, 成员         |
| comment.delete | 删除评论       | 所有者, 管理员, 评论作者     |

### 附件权限

| 权限代码          | 描述     | 默认授予角色                 |
| ----------------- | -------- | ---------------------------- |
| attachment.view   | 查看附件 | 所有者, 管理员, 成员, 观察者 |
| attachment.upload | 上传附件 | 所有者, 管理员, 成员         |
| attachment.delete | 删除附件 | 所有者, 管理员, 上传者       |

## 权限检查机制

权限检查在多个层次进行，确保全面的安全控制：

### 1. 中间件层权限检查

在路由中间件中进行初步权限检查，确保用户有权访问请求的路由：

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';

export default withAuth(
  async function middleware(request) {
    // 项目管理模块路由权限检查
    if (request.nextUrl.pathname.startsWith('/dashboard/projects')) {
      const projectMatch =
        request.nextUrl.pathname.match(/\/projects\/([^\/]+)/);
      const projectId = projectMatch ? projectMatch[1] : null;

      // 项目列表查看权限
      if (
        request.nextUrl.pathname === '/dashboard/projects' &&
        !request.auth.hasPermission('project.view')
      ) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // 项目创建权限
      if (
        request.nextUrl.pathname === '/dashboard/projects/new' &&
        !request.auth.hasPermission('project.create')
      ) {
        return NextResponse.redirect(
          new URL('/dashboard/projects', request.url)
        );
      }

      // 项目特定操作权限
      if (projectId && projectId !== 'new') {
        // 项目成员检查
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
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
);
```

### 2. API层权限检查

在API请求处理函数中进行详细的权限检查：

```typescript
// 权限检查工具函数
async function checkProjectPermission(
  projectId: string,
  permission: string,
  userId: string
): Promise<boolean> {
  // 获取用户在项目中的角色
  const projectMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: { userId, projectId }
    },
    include: {
      project: {
        select: {
          ownerId: true
        }
      }
    }
  });

  // 项目所有者拥有所有权限
  if (projectMember?.project.ownerId === userId) {
    return true;
  }

  // 检查用户角色是否有指定权限
  if (!projectMember) return false;

  const rolePermissions = await getRolePermissions(projectMember.role);
  return rolePermissions.includes(permission);
}

// API请求处理中使用
export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return apiUnauthorized();

  const projectId = params.projectId;

  // 检查更新项目的权限
  const hasPermission = await checkProjectPermission(
    projectId,
    'project.update',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden("You don't have permission to update this project");
  }

  // 继续处理请求...
}
```

### 3. 组件层权限检查

在前端组件中根据用户权限控制UI元素的显示：

```tsx
// 使用自定义钩子检查权限
import { useProjectPermissions } from '@/hooks/use-project-permissions';

function TaskActions({ projectId, task }) {
  const { hasPermission } = useProjectPermissions(projectId);

  return (
    <div className='task-actions'>
      {hasPermission('task.update') && (
        <Button onClick={handleEditTask}>编辑</Button>
      )}

      {hasPermission('task.delete') && (
        <Button variant='destructive' onClick={handleDeleteTask}>
          删除
        </Button>
      )}

      {hasPermission('task.status.update') && (
        <StatusSelector task={task} onChange={handleStatusChange} />
      )}
    </div>
  );
}
```

## 权限数据结构

权限在数据库中的存储模型：

### 1. 项目成员角色表

```prisma
model ProjectMember {
  id           String           @id @default(cuid())
  userId       String
  projectId    String
  role         ProjectMemberRole @default(MEMBER)
  joinedAt     DateTime         @default(now())
  user         User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  project      Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignments  TaskAssignment[]
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  @@unique([userId, projectId])
  @@map("project_members")
}

enum ProjectMemberRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}
```

### 2. 角色权限定义

角色权限定义存储在配置文件中，便于维护和更新：

```typescript
// /features/project-management/config/role-permissions.ts

export type ProjectPermission =
  | 'project.view'
  | 'project.create'
  | 'project.update'
  | 'project.delete'
  | 'project.member.manage'
  | 'project.setting.manage'
  | 'task.view'
  | 'task.create'
  | 'task.update'
  | 'task.delete'
  | 'task.assign'
  | 'task.status.update'
  | 'sprint.view'
  | 'sprint.create'
  | 'sprint.update'
  | 'sprint.delete'
  | 'sprint.manage_tasks'
  | 'comment.view'
  | 'comment.create'
  | 'comment.update'
  | 'comment.delete'
  | 'attachment.view'
  | 'attachment.upload'
  | 'attachment.delete';

export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

// 角色权限映射表
export const ROLE_PERMISSIONS: Record<ProjectRole, ProjectPermission[]> = {
  OWNER: [
    'project.view',
    'project.update',
    'project.delete',
    'project.member.manage',
    'project.setting.manage',
    'task.view',
    'task.create',
    'task.update',
    'task.delete',
    'task.assign',
    'task.status.update',
    'sprint.view',
    'sprint.create',
    'sprint.update',
    'sprint.delete',
    'sprint.manage_tasks',
    'comment.view',
    'comment.create',
    'comment.update',
    'comment.delete',
    'attachment.view',
    'attachment.upload',
    'attachment.delete'
  ],
  ADMIN: [
    'project.view',
    'project.update',
    'project.member.manage',
    'project.setting.manage',
    'task.view',
    'task.create',
    'task.update',
    'task.delete',
    'task.assign',
    'task.status.update',
    'sprint.view',
    'sprint.create',
    'sprint.update',
    'sprint.delete',
    'sprint.manage_tasks',
    'comment.view',
    'comment.create',
    'comment.update',
    'comment.delete',
    'attachment.view',
    'attachment.upload',
    'attachment.delete'
  ],
  MEMBER: [
    'project.view',
    'task.view',
    'task.create',
    'task.update',
    'task.assign',
    'task.status.update',
    'sprint.view',
    'sprint.manage_tasks',
    'comment.view',
    'comment.create',
    'comment.update',
    'attachment.view',
    'attachment.upload'
  ],
  VIEWER: [
    'project.view',
    'task.view',
    'sprint.view',
    'comment.view',
    'attachment.view'
  ]
};

// 系统级权限
export const SYSTEM_PERMISSIONS: Record<string, ProjectPermission[]> = {
  ADMIN: [
    'project.create'
    // 所有其他权限...
  ],
  USER: ['project.create'],
  GUEST: []
};

// 检查用户是否有特定权限
export function hasRolePermission(
  role: ProjectRole,
  permission: ProjectPermission
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}
```

## 权限管理界面

项目管理模块提供权限管理界面，允许项目所有者和管理员管理成员权限：

### 1. 项目成员管理页面

项目成员管理页面允许添加、删除成员并更改其角色：

```tsx
// /app/dashboard/projects/[projectId]/settings/members/page.tsx

import { ProjectMembersList } from '@/features/project-management/components/project/project-members-list';
import { AddMemberForm } from '@/features/project-management/components/project/add-member-form';
import { getProjectById } from '@/features/project-management/actions/project-actions';
import { checkProjectPermission } from '@/features/project-management/utils/project-auth';
import { redirect } from 'next/navigation';

export default async function ProjectMembersPage({
  params
}: {
  params: { projectId: string };
}) {
  const projectId = params.projectId;

  // 检查权限
  const hasPermission = await checkProjectPermission(
    projectId,
    'project.member.manage'
  );

  if (!hasPermission) {
    redirect(`/dashboard/projects/${projectId}`);
  }

  const project = await getProjectById(projectId);

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold'>项目成员管理</h1>

      <div className='bg-card rounded-lg p-6 shadow-sm'>
        <h2 className='mb-4 text-xl font-semibold'>添加成员</h2>
        <AddMemberForm projectId={projectId} />
      </div>

      <div className='bg-card rounded-lg p-6 shadow-sm'>
        <h2 className='mb-4 text-xl font-semibold'>成员列表</h2>
        <ProjectMembersList projectId={projectId} />
      </div>
    </div>
  );
}
```

### 2. 角色选择组件

用于更改成员角色的下拉选择组件：

```tsx
// /features/project-management/components/project/role-selector.tsx

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { updateMemberRole } from '@/features/project-management/actions/member-actions';
import { toast } from '@/components/ui/use-toast';

interface RoleSelectorProps {
  projectId: string;
  memberId: string;
  currentRole: string;
  isOwner: boolean;
  onRoleChange?: (role: string) => void;
}

export function RoleSelector({
  projectId,
  memberId,
  currentRole,
  isOwner,
  onRoleChange
}: RoleSelectorProps) {
  const [role, setRole] = useState(currentRole);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleChange = async (newRole: string) => {
    if (newRole === role) return;

    setRole(newRole);
    setIsSubmitting(true);

    try {
      await updateMemberRole(projectId, memberId, newRole);
      toast({
        title: '角色已更新',
        description: '成员角色已成功更新。'
      });
      onRoleChange?.(newRole);
    } catch (error) {
      toast({
        title: '更新失败',
        description: '无法更新成员角色，请重试。',
        variant: 'destructive'
      });
      setRole(currentRole);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Select
      value={role}
      onValueChange={handleRoleChange}
      disabled={isOwner || isSubmitting}
    >
      <SelectTrigger className='w-32'>
        <SelectValue placeholder='选择角色' />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='ADMIN'>管理员</SelectItem>
        <SelectItem value='MEMBER'>成员</SelectItem>
        <SelectItem value='VIEWER'>观察者</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

### 3. 权限策略显示

显示不同角色权限矩阵的信息组件：

```tsx
// /features/project-management/components/project/permission-matrix.tsx

import {
  ROLE_PERMISSIONS,
  ProjectRole,
  ProjectPermission
} from '@/features/project-management/config/role-permissions';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, XIcon } from 'lucide-react';

interface PermissionMatrixProps {
  showRoles?: ProjectRole[];
}

export function PermissionMatrix({
  showRoles = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']
}: PermissionMatrixProps) {
  // 对权限进行分组
  const permissionGroups = {
    Project: [
      'project.view',
      'project.update',
      'project.delete',
      'project.member.manage',
      'project.setting.manage'
    ],
    Task: [
      'task.view',
      'task.create',
      'task.update',
      'task.delete',
      'task.assign',
      'task.status.update'
    ],
    Sprint: [
      'sprint.view',
      'sprint.create',
      'sprint.update',
      'sprint.delete',
      'sprint.manage_tasks'
    ],
    Comment: [
      'comment.view',
      'comment.create',
      'comment.update',
      'comment.delete'
    ],
    Attachment: ['attachment.view', 'attachment.upload', 'attachment.delete']
  };

  const roleLabels: Record<ProjectRole, string> = {
    OWNER: '所有者',
    ADMIN: '管理员',
    MEMBER: '成员',
    VIEWER: '观察者'
  };

  const permissionLabels: Record<ProjectPermission, string> = {
    'project.view': '查看项目',
    'project.create': '创建项目',
    'project.update': '编辑项目',
    'project.delete': '删除项目',
    'project.member.manage': '管理成员',
    'project.setting.manage': '管理设置',
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

  return (
    <div className='space-y-8'>
      {Object.entries(permissionGroups).map(([groupName, permissions]) => (
        <div key={groupName} className='space-y-4'>
          <h3 className='text-lg font-semibold'>{groupName} 权限</h3>

          <div className='overflow-x-auto'>
            <table className='w-full border-collapse'>
              <thead>
                <tr className='bg-muted'>
                  <th className='border p-2 text-left'>权限</th>
                  {showRoles.map((role) => (
                    <th key={role} className='border p-2 text-center'>
                      {roleLabels[role]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map((permission) => (
                  <tr key={permission} className='hover:bg-muted/50 border-b'>
                    <td className='border p-2'>
                      {permissionLabels[permission as ProjectPermission]}
                    </td>
                    {showRoles.map((role) => (
                      <td key={role} className='border p-2 text-center'>
                        {ROLE_PERMISSIONS[role].includes(
                          permission as ProjectPermission
                        ) ? (
                          <CheckIcon className='mx-auto h-5 w-5 text-green-500' />
                        ) : (
                          <XIcon className='mx-auto h-5 w-5 text-red-500' />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## 权限迁移与初始化

项目管理模块需要在安装时初始化必要的权限数据：

### 1. 系统权限初始化

添加项目管理相关的系统权限：

```typescript
// /prisma/seed/permissions.ts

async function seedProjectManagementPermissions() {
  // 创建基础项目权限
  const projectPermissions = [
    {
      name: 'project.view',
      description: '查看项目'
    },
    {
      name: 'project.create',
      description: '创建项目'
    },
    {
      name: 'project.update',
      description: '编辑项目'
    },
    {
      name: 'project.delete',
      description: '删除项目'
    },
    {
      name: 'project.member.manage',
      description: '管理项目成员'
    }
    // 添加所有其他项目管理相关权限...
  ];

  // 批量创建权限
  for (const permission of projectPermissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: permission,
      create: permission
    });
  }

  // 为管理员角色分配所有项目管理权限
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' }
  });

  if (adminRole) {
    for (const permission of projectPermissions) {
      const permissionRecord = await prisma.permission.findUnique({
        where: { name: permission.name }
      });

      if (permissionRecord) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: adminRole.id,
              permissionId: permissionRecord.id
            }
          },
          update: {},
          create: {
            roleId: adminRole.id,
            permissionId: permissionRecord.id
          }
        });
      }
    }
  }

  // 为普通用户角色分配基本项目权限
  const userRole = await prisma.role.findUnique({
    where: { name: 'user' }
  });

  if (userRole) {
    const basicUserPermissions = ['project.view', 'project.create'];

    for (const permissionName of basicUserPermissions) {
      const permissionRecord = await prisma.permission.findUnique({
        where: { name: permissionName }
      });

      if (permissionRecord) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: userRole.id,
              permissionId: permissionRecord.id
            }
          },
          update: {},
          create: {
            roleId: userRole.id,
            permissionId: permissionRecord.id
          }
        });
      }
    }
  }
}
```

### 2. API路由权限修复

提供API路由来修复权限配置：

```typescript
// /app/api/system-management/permissions/fix-project-permissions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { apiResponse, apiUnauthorized, apiError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  // 检查用户是否为管理员
  const isAdmin = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      role: {
        name: 'admin'
      }
    }
  });

  if (!isAdmin) {
    return apiError(
      'PERMISSION_DENIED',
      'Only administrators can fix permissions',
      null,
      403
    );
  }

  try {
    // 调用权限初始化函数
    await seedProjectManagementPermissions();

    return apiResponse({
      success: true,
      message: 'Project management permissions have been fixed successfully'
    });
  } catch (error) {
    return apiError(
      'SERVER_ERROR',
      'Failed to fix project management permissions',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
```

## 安全最佳实践

实施以下安全最佳实践保护权限系统：

### 1. 最小权限原则

- 默认情况下，授予用户最小的必要权限
- 明确的权限授予，而不是隐含的权限
- 权限随着责任的增加而增加

### 2. 多层次验证

- 中间件层的初步验证
- API层的详细权限检查
- 组件层的条件渲染

### 3. 权限检查缓存

为提高性能，缓存常用的权限检查结果：

```typescript
// 带缓存的权限检查
const permissionCache = new Map<string, boolean>();

async function checkProjectPermissionWithCache(
  projectId: string,
  permission: string,
  userId: string
): Promise<boolean> {
  const cacheKey = `${projectId}:${permission}:${userId}`;

  // 检查缓存
  if (permissionCache.has(cacheKey)) {
    return permissionCache.get(cacheKey)!;
  }

  // 执行实际权限检查
  const result = await checkProjectPermission(projectId, permission, userId);

  // 缓存结果（短期缓存）
  permissionCache.set(cacheKey, result);
  setTimeout(
    () => {
      permissionCache.delete(cacheKey);
    },
    5 * 60 * 1000
  ); // 5分钟后过期

  return result;
}
```

### 4. 活动审计

记录关键权限更改操作，便于审计和问题排查：

```typescript
// 权限更改审计日志
async function logPermissionChange(
  userId: string,
  action: string,
  details: Record<string, any>
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      module: 'permissions',
      details: JSON.stringify(details),
      ipAddress: getRequestIP(),
      userAgent: getRequestUserAgent()
    }
  });
}

// 使用示例
await logPermissionChange(adminId, 'role_changed', {
  projectId,
  memberId,
  oldRole: 'MEMBER',
  newRole: 'ADMIN'
});
```

### 5. 防止特权提升

确保用户不能提升自己的权限：

```typescript
// 防止特权提升
export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string; memberId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return apiUnauthorized();

  const { projectId, memberId } = params;
  const { role } = await request.json();

  // 获取当前成员信息
  const member = await prisma.projectMember.findUnique({
    where: { id: memberId },
    include: {
      project: {
        select: { ownerId: true }
      }
    }
  });

  if (!member) {
    return apiNotFound('Project member');
  }

  // 验证更改权限
  const hasPermission = await checkProjectPermission(
    projectId,
    'project.member.manage',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden("You don't have permission to manage project members");
  }

  // 项目所有者的角色不能被更改
  if (member.userId === member.project.ownerId) {
    return apiError(
      'INVALID_OPERATION',
      'Cannot change the role of the project owner',
      null,
      400
    );
  }

  // 用户不能更改自己的角色（防止特权提升）
  if (member.userId === user.id) {
    return apiError(
      'INVALID_OPERATION',
      'You cannot change your own role',
      null,
      400
    );
  }

  // 继续处理角色更新...
}
```

通过实施这些权限控制措施，项目管理模块将提供安全、灵活的访问控制，确保用户只能访问他们有权限的资源和执行授权的操作。
