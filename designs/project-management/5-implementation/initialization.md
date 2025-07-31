# 项目管理模块 - 初始化与集成指南

本文档提供项目管理模块的初始化配置，包括数据库初始化、admin权限配置和菜单集成。

## 目录

1. [数据库初始化](#数据库初始化)
2. [Admin账号权限赋值](#admin账号权限赋值)
3. [左侧菜单更新](#左侧菜单更新)
4. [初始化脚本](#初始化脚本)
5. [自动化部署](#自动化部署)

## 数据库初始化

### 数据迁移与种子数据

项目管理模块需要进行数据库迁移和初始化基础数据，包括权限、角色和默认配置。

#### 1. 数据库迁移文件

创建Prisma迁移文件，添加项目管理相关的表结构：

```bash
npx prisma migrate dev --name add_project_management
```

#### 2. 种子数据脚本

实现专门的种子数据脚本，用于初始化项目管理模块：

```typescript
// /prisma/seed/project-management.ts

import { PrismaClient, ProjectStatus, ProjectVisibility } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

/**
 * 为项目管理模块初始化种子数据
 */
export async function seedProjectManagement() {
  console.log('开始初始化项目管理模块数据...');

  // 初始化权限
  await seedProjectPermissions();

  // 初始化菜单
  await seedProjectMenus();

  // 创建演示项目（可选）
  if (process.env.SEED_DEMO_DATA === 'true') {
    await seedDemoProjects();
  }

  console.log('项目管理模块数据初始化完成');
}

/**
 * 初始化项目管理权限
 */
async function seedProjectPermissions() {
  console.log('正在初始化项目管理权限...');

  const permissions = [
    // 项目权限
    { name: 'project.view', description: '查看项目列表和项目详情' },
    { name: 'project.create', description: '创建新项目' },
    { name: 'project.update', description: '编辑项目信息' },
    { name: 'project.delete', description: '删除项目' },
    { name: 'project.member.manage', description: '管理项目成员' },
    { name: 'project.setting.manage', description: '管理项目设置' },

    // 任务权限
    { name: 'task.view', description: '查看任务详情' },
    { name: 'task.create', description: '创建新任务' },
    { name: 'task.update', description: '编辑任务信息' },
    { name: 'task.delete', description: '删除任务' },
    { name: 'task.assign', description: '分配任务给成员' },
    { name: 'task.status.update', description: '更新任务状态' },

    // 迭代权限
    { name: 'sprint.view', description: '查看迭代详情' },
    { name: 'sprint.create', description: '创建新迭代' },
    { name: 'sprint.update', description: '编辑迭代信息' },
    { name: 'sprint.delete', description: '删除迭代' },
    { name: 'sprint.manage_tasks', description: '管理迭代中的任务' },

    // 评论权限
    { name: 'comment.view', description: '查看评论' },
    { name: 'comment.create', description: '添加评论' },
    { name: 'comment.update', description: '编辑评论' },
    { name: 'comment.delete', description: '删除评论' },

    // 附件权限
    { name: 'attachment.view', description: '查看附件' },
    { name: 'attachment.upload', description: '上传附件' },
    { name: 'attachment.delete', description: '删除附件' },

    // 文档权限
    { name: 'document.view', description: '查看文档' },
    { name: 'document.create', description: '创建文档' },
    { name: 'document.update', description: '编辑文档' },
    { name: 'document.delete', description: '删除文档' },
    { name: 'document.manage', description: '管理文档' },
    { name: 'document.template.create', description: '创建文档模板' },
    { name: 'document.template.use', description: '使用文档模板' }
  ];

  // 批量创建权限
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: permission,
      create: permission
    });

    console.log(`创建权限: ${permission.name}`);
  }

  console.log('项目管理权限初始化完成');
}

/**
 * 初始化项目管理菜单
 */
async function seedProjectMenus() {
  console.log('正在初始化项目管理菜单...');

  // 查找或创建仪表盘根菜单
  const dashboardMenu = await prisma.menu.findFirst({
    where: { path: '/dashboard' }
  });

  if (!dashboardMenu) {
    console.log('未找到仪表盘菜单，无法添加项目管理菜单');
    return;
  }

  // 创建项目管理主菜单
  const projectsMenu = await prisma.menu.upsert({
    where: { path: '/dashboard/projects' },
    update: {
      name: '项目管理',
      icon: 'Briefcase',
      parentId: dashboardMenu.id,
      order: 2, // 在概览菜单之后
      isVisible: true
    },
    create: {
      name: '项目管理',
      path: '/dashboard/projects',
      icon: 'Briefcase',
      parentId: dashboardMenu.id,
      order: 2,
      isVisible: true
    }
  });

  console.log(`创建项目管理菜单: ${projectsMenu.name}`);

  // 获取项目管理权限
  const projectViewPermission = await prisma.permission.findUnique({
    where: { name: 'project.view' }
  });

  // 如果找到权限，将其关联到菜单
  if (projectViewPermission) {
    await prisma.menuPermission.upsert({
      where: {
        menuId_permissionId: {
          menuId: projectsMenu.id,
          permissionId: projectViewPermission.id
        }
      },
      update: {},
      create: {
        menuId: projectsMenu.id,
        permissionId: projectViewPermission.id
      }
    });

    console.log(`关联菜单权限: ${projectsMenu.name} - project.view`);
  }

  console.log('项目管理菜单初始化完成');
}

/**
 * 创建演示项目数据
 */
async function seedDemoProjects() {
  console.log('正在创建演示项目数据...');

  // 查找管理员用户
  const adminUser = await prisma.user.findFirst({
    where: {
      roles: {
        some: {
          role: {
            name: 'admin'
          }
        }
      }
    }
  });

  if (!adminUser) {
    console.log('未找到管理员用户，无法创建演示项目');
    return;
  }

  // 创建示例项目
  const demoProject = await prisma.project.create({
    data: {
      name: '示例项目',
      description: '这是一个演示项目，用于展示项目管理功能',
      status: 'ACTIVE' as ProjectStatus,
      visibility: 'TEAM' as ProjectVisibility,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90天后
      ownerId: adminUser.id
    }
  });

  console.log(`创建演示项目: ${demoProject.name}`);

  // 创建示例迭代
  const sprint = await prisma.sprint.create({
    data: {
      name: '迭代 1',
      goal: '完成核心功能开发',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14天后
      status: 'ACTIVE',
      projectId: demoProject.id
    }
  });

  console.log(`创建演示迭代: ${sprint.name}`);

  // 创建示例任务
  const taskStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
  const taskPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  for (let i = 0; i < 10; i++) {
    const status =
      taskStatuses[Math.floor(Math.random() * taskStatuses.length)];
    const priority =
      taskPriorities[Math.floor(Math.random() * taskPriorities.length)];

    const task = await prisma.task.create({
      data: {
        title: faker.lorem.sentence(4),
        description: faker.lorem.paragraphs(2),
        status: status,
        priority: priority,
        projectId: demoProject.id,
        sprintId: sprint.id,
        estimatedHours: Math.floor(Math.random() * 8) + 1,
        completedAt: status === 'DONE' ? new Date() : null
      }
    });

    console.log(`创建演示任务: ${task.title}`);

    // 为一些任务创建子任务
    if (i < 3) {
      for (let j = 0; j < 3; j++) {
        const subtask = await prisma.task.create({
          data: {
            title: `子任务 ${j + 1}: ${faker.lorem.sentence(3)}`,
            description: faker.lorem.paragraph(),
            status: status,
            priority: priority,
            projectId: demoProject.id,
            parentTaskId: task.id,
            estimatedHours: Math.floor(Math.random() * 4) + 1
          }
        });

        console.log(`创建子任务: ${subtask.title}`);
      }
    }
  }

  // 创建示例文档
  const document = await prisma.document.create({
    data: {
      title: '项目说明文档',
      content: `# 项目概述\n\n这是一个演示项目，用于展示项目管理功能。\n\n## 主要功能\n\n- 任务管理\n- 迭代规划\n- 看板视图\n- 团队协作\n- 文档管理`,
      format: 'MARKDOWN',
      status: 'PUBLISHED',
      projectId: demoProject.id,
      createdById: adminUser.id,
      updatedById: adminUser.id
    }
  });

  console.log(`创建示例文档: ${document.title}`);

  // 创建文档版本
  await prisma.documentVersion.create({
    data: {
      versionNumber: 1,
      content: document.content,
      documentId: document.id,
      createdById: adminUser.id
    }
  });

  console.log('演示数据创建完成');
}
```

#### 3. 将种子脚本集成到主种子文件

```typescript
// /prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import { seedUsers } from './seed/users';
import { seedRoles } from './seed/roles';
import { seedPermissions } from './seed/permissions';
import { seedProjectManagement } from './seed/project-management';

const prisma = new PrismaClient();

async function main() {
  console.log('开始数据库初始化...');

  // 基础数据填充
  await seedRoles();
  await seedPermissions();
  await seedUsers();

  // 项目管理模块数据
  await seedProjectManagement();

  console.log('数据库初始化完成');
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

## Admin账号权限赋值

为管理员账号分配项目管理相关的所有权限。

### 1. 管理员权限配置脚本

```typescript
// /prisma/seed/admin-permissions.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 为管理员角色分配项目管理权限
 */
export async function assignAdminProjectPermissions() {
  console.log('开始为管理员分配项目管理权限...');

  // 查找管理员角色
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' }
  });

  if (!adminRole) {
    console.log('未找到管理员角色');
    return;
  }

  // 获取所有项目管理权限
  const projectPermissions = await prisma.permission.findMany({
    where: {
      OR: [
        { name: { startsWith: 'project.' } },
        { name: { startsWith: 'task.' } },
        { name: { startsWith: 'sprint.' } },
        { name: { startsWith: 'comment.' } },
        { name: { startsWith: 'attachment.' } },
        { name: { startsWith: 'document.' } }
      ]
    }
  });

  console.log(`找到 ${projectPermissions.length} 个项目管理权限`);

  // 为管理员角色分配所有项目管理权限
  for (const permission of projectPermissions) {
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

    console.log(`为管理员分配权限: ${permission.name}`);
  }

  console.log('管理员权限分配完成');
}
```

### 2. 权限修复API端点

创建一个API端点，用于在运行时修复管理员权限：

```typescript
// /app/api/system-management/permissions/fix-project-permissions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  apiResponse,
  apiError,
  apiUnauthorized,
  apiForbidden
} from '@/lib/api-response';
import { isSystemAdmin } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  // 检查用户是否为系统管理员
  const isAdmin = await isSystemAdmin(user.id);

  if (!isAdmin) {
    return apiForbidden('只有系统管理员可以修复权限');
  }

  try {
    // 查找管理员角色
    const adminRole = await prisma.role.findUnique({
      where: { name: 'admin' }
    });

    if (!adminRole) {
      return apiError('ROLE_NOT_FOUND', '未找到管理员角色', null, 404);
    }

    // 获取所有项目管理权限
    const projectPermissions = await prisma.permission.findMany({
      where: {
        OR: [
          { name: { startsWith: 'project.' } },
          { name: { startsWith: 'task.' } },
          { name: { startsWith: 'sprint.' } },
          { name: { startsWith: 'comment.' } },
          { name: { startsWith: 'attachment.' } },
          { name: { startsWith: 'document.' } }
        ]
      }
    });

    // 为管理员角色分配所有项目管理权限
    const results = await Promise.all(
      projectPermissions.map((permission) =>
        prisma.rolePermission.upsert({
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
        })
      )
    );

    return apiResponse({
      success: true,
      message: `成功为管理员分配 ${results.length} 个项目管理权限`,
      permissionsCount: results.length
    });
  } catch (error) {
    console.error('修复项目管理权限失败:', error);
    return apiError(
      'SERVER_ERROR',
      '修复项目管理权限失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
```

### 3. 权限修复界面

创建权限修复页面，让管理员能够手动修复权限：

```tsx
// /app/system-management/permissions/fix-project-permissions/page.tsx

import { Metadata } from 'next';
import { FixProjectPermissionsForm } from '@/features/system-management/permissions/components/fix-project-permissions-form';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { isSystemAdmin } from '@/lib/permissions';

export const metadata: Metadata = {
  title: '修复项目管理权限',
  description: '为管理员角色分配项目管理相关权限'
};

export default async function FixProjectPermissionsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // 检查用户是否为系统管理员
  const isAdmin = await isSystemAdmin(user.id);

  if (!isAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className='container max-w-3xl space-y-6 py-6'>
      <h1 className='text-3xl font-bold tracking-tight'>修复项目管理权限</h1>

      <div className='bg-card rounded-lg border p-6 shadow-sm'>
        <div className='space-y-4'>
          <h2 className='text-xl font-semibold'>权限修复工具</h2>
          <p>
            此工具将为管理员角色分配所有项目管理相关权限。如果在使用项目管理功能时遇到权限问题，可以使用此工具进行修复。
          </p>

          <FixProjectPermissionsForm />
        </div>
      </div>
    </div>
  );
}
```

权限修复表单组件：

```tsx
// /features/system-management/permissions/components/fix-project-permissions-form.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CheckCircleIcon,
  XCircleIcon,
  ShieldIcon,
  Loader2Icon
} from 'lucide-react';

export function FixProjectPermissionsForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    permissionsCount?: number;
  } | null>(null);

  // 处理修复权限
  const handleFixPermissions = async () => {
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch(
        '/api/system-management/permissions/fix-project-permissions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: data.data.message,
          permissionsCount: data.data.permissionsCount
        });
      } else {
        setResult({
          success: false,
          message: data.error?.message || '修复权限失败'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: '修复权限请求失败'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='space-y-4'>
      <Button
        onClick={handleFixPermissions}
        disabled={isSubmitting}
        className='w-full md:w-auto'
      >
        {isSubmitting ? (
          <>
            <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
            正在修复权限...
          </>
        ) : (
          <>
            <ShieldIcon className='mr-2 h-4 w-4' />
            修复项目管理权限
          </>
        )}
      </Button>

      {result && (
        <Alert variant={result.success ? 'default' : 'destructive'}>
          {result.success ? (
            <CheckCircleIcon className='h-4 w-4' />
          ) : (
            <XCircleIcon className='h-4 w-4' />
          )}
          <AlertTitle>{result.success ? '修复成功' : '修复失败'}</AlertTitle>
          <AlertDescription>
            {result.message}
            {result.success && result.permissionsCount && (
              <p className='mt-2'>
                已成功分配 {result.permissionsCount} 个项目管理权限
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

## 左侧菜单更新

更新左侧导航菜单，添加项目管理相关项目。

### 1. 菜单配置更新

在菜单配置文件中添加项目管理菜单项：

```typescript
// /config/dashboard.ts

import { DashboardConfig } from '@/types';

export const dashboardConfig: DashboardConfig = {
  mainNav: [
    {
      title: '仪表盘',
      href: '/dashboard'
    },
    {
      title: '文档',
      href: '/docs'
    },
    {
      title: '支持',
      href: '/support'
    }
  ],
  sidebarNav: [
    {
      title: '概览',
      href: '/dashboard/overview',
      icon: 'dashboard',
      permission: 'dashboard.view'
    },
    {
      title: '项目管理',
      href: '/dashboard/projects',
      icon: 'briefcase',
      permission: 'project.view'
    }
    // 其他现有菜单项...
  ]
};
```

### 2. 菜单数据库同步

确保菜单数据与数据库同步：

```typescript
// /scripts/sync-menus.ts

import { PrismaClient } from '@prisma/client';
import { dashboardConfig } from '../config/dashboard';

const prisma = new PrismaClient();

/**
 * 同步配置文件中的菜单到数据库
 */
async function syncMenus() {
  console.log('开始同步菜单数据...');

  // 查找或创建仪表盘根菜单
  let dashboardMenu = await prisma.menu.findFirst({
    where: { path: '/dashboard' }
  });

  if (!dashboardMenu) {
    dashboardMenu = await prisma.menu.create({
      data: {
        name: '仪表盘',
        path: '/dashboard',
        icon: 'Layout',
        order: 1,
        isVisible: true
      }
    });
    console.log('创建仪表盘根菜单');
  }

  // 同步侧边栏菜单
  for (const [index, item] of dashboardConfig.sidebarNav.entries()) {
    const menu = await prisma.menu.upsert({
      where: { path: item.href },
      update: {
        name: item.title,
        icon: item.icon,
        parentId: dashboardMenu.id,
        order: index + 1,
        isVisible: true
      },
      create: {
        name: item.title,
        path: item.href,
        icon: item.icon,
        parentId: dashboardMenu.id,
        order: index + 1,
        isVisible: true
      }
    });

    console.log(`同步菜单: ${menu.name}`);

    // 如果有权限配置，同步菜单权限
    if (item.permission) {
      const permission = await prisma.permission.findUnique({
        where: { name: item.permission }
      });

      if (permission) {
        await prisma.menuPermission.upsert({
          where: {
            menuId_permissionId: {
              menuId: menu.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            menuId: menu.id,
            permissionId: permission.id
          }
        });

        console.log(`同步菜单权限: ${menu.name} - ${permission.name}`);
      }
    }
  }

  console.log('菜单同步完成');
}

// 执行同步
syncMenus()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 3. 项目内部导航菜单

在项目详情页实现内部导航菜单：

```tsx
// /app/dashboard/projects/[projectId]/layout.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProjectById } from '@/features/project-management/actions/project-actions';
import { ProjectHeader } from '@/features/project-management/components/project/project-header';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutDashboardIcon,
  CheckSquareIcon,
  LayoutIcon,
  SparklesIcon,
  UsersIcon,
  SettingsIcon,
  FileTextIcon
} from 'lucide-react';

export async function generateMetadata({
  params
}: {
  params: { projectId: string };
}): Promise<Metadata> {
  const project = await getProjectById(params.projectId);

  if (!project) {
    return {
      title: '项目不存在'
    };
  }

  return {
    title: project.name,
    description: project.description || `项目 ${project.name} 的详情页面`
  };
}

export default async function ProjectLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { projectId: string };
}) {
  const projectId = params.projectId;
  const project = await getProjectById(projectId);

  if (!project) {
    notFound();
  }

  // 项目导航项
  const projectTabs = [
    {
      label: '概览',
      href: `/dashboard/projects/${projectId}`,
      icon: <LayoutDashboardIcon className='h-4 w-4' />
    },
    {
      label: '任务',
      href: `/dashboard/projects/${projectId}/tasks`,
      icon: <CheckSquareIcon className='h-4 w-4' />
    },
    {
      label: '看板',
      href: `/dashboard/projects/${projectId}/kanban`,
      icon: <LayoutIcon className='h-4 w-4' />
    },
    {
      label: '迭代',
      href: `/dashboard/projects/${projectId}/sprints`,
      icon: <SparklesIcon className='h-4 w-4' />
    },
    {
      label: '文档',
      href: `/dashboard/projects/${projectId}/documents`,
      icon: <FileTextIcon className='h-4 w-4' />
    },
    {
      label: '团队',
      href: `/dashboard/projects/${projectId}/team`,
      icon: <UsersIcon className='h-4 w-4' />
    },
    {
      label: '设置',
      href: `/dashboard/projects/${projectId}/settings`,
      icon: <SettingsIcon className='h-4 w-4' />
    }
  ];

  return (
    <div className='flex min-h-screen flex-col'>
      <ProjectHeader project={project} />

      <div className='container border-b py-4'>
        <Tabs defaultValue='overview' className='w-full'>
          <TabsList className='w-full justify-start overflow-x-auto'>
            {projectTabs.map((tab) => {
              // 获取当前路径的最后一部分来确定活动选项卡
              const pathParts = tab.href.split('/');
              const value = pathParts[pathParts.length - 1] || 'overview';

              return (
                <TabsTrigger
                  key={tab.href}
                  value={value}
                  className='flex items-center'
                  asChild
                >
                  <Link href={tab.href}>
                    {tab.icon}
                    <span className='ml-2'>{tab.label}</span>
                  </Link>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      <div className='flex-1'>{children}</div>
    </div>
  );
}
```

## 初始化脚本

创建一个初始化脚本，用于快速设置项目管理模块的所有必要配置：

```typescript
// /scripts/init-project-management.ts

import { PrismaClient } from '@prisma/client';
import { seedProjectManagement } from '../prisma/seed/project-management';
import { assignAdminProjectPermissions } from '../prisma/seed/admin-permissions';

const prisma = new PrismaClient();

/**
 * 项目管理模块初始化脚本
 */
async function initProjectManagement() {
  console.log('=== 项目管理模块初始化 ===');

  try {
    // 1. 初始化项目管理模块数据
    await seedProjectManagement();

    // 2. 为管理员分配项目管理权限
    await assignAdminProjectPermissions();

    // 3. 创建演示数据（可选）
    if (process.env.SEED_DEMO_DATA === 'true') {
      console.log('创建演示数据已启用');
    }

    console.log('=== 项目管理模块初始化完成 ===');
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行初始化
initProjectManagement();
```

添加相应的NPM脚本：

```json
// package.json
{
  "scripts": {
    // 其他脚本...
    "init:project-management": "ts-node scripts/init-project-management.ts",
    "sync:menus": "ts-node scripts/sync-menus.ts"
  }
}
```

## 自动化部署

在应用部署流程中集成项目管理模块的初始化步骤：

### 1. 部署脚本

```bash
#!/bin/bash
# deploy.sh

# 运行数据库迁移
echo "运行数据库迁移..."
npx prisma migrate deploy

# 初始化项目管理模块
echo "初始化项目管理模块..."
npm run init:project-management

# 同步菜单配置
echo "同步菜单配置..."
npm run sync:menus

# 构建应用
echo "构建应用..."
npm run build

# 启动应用
echo "启动应用..."
npm run start
```

### 2. 部署钩子

如果使用CI/CD工具（如GitHub Actions），可以添加项目管理模块初始化步骤：

```yaml
# .github/workflows/deploy.yml

name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Initialize project management module
        run: npm run init:project-management
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          SEED_DEMO_DATA: ${{ secrets.SEED_DEMO_DATA }}

      - name: Sync menu configuration
        run: npm run sync:menus
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Build application
        run: npm run build

      # 其他部署步骤...
```

通过这些配置和脚本，可以确保项目管理模块在部署时正确初始化，包括数据库结构、基础数据、权限配置和菜单更新。这样可以保证系统在首次安装或升级后能够正常运行项目管理功能。
