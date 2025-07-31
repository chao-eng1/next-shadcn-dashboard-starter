# 项目管理模块 - 实现指南

本文档提供项目管理模块的详细实现指南，包括实现步骤、最佳实践和注意事项。

## 目录

1. [实现概述](#实现概述)
2. [数据库实现](#数据库实现)
3. [API实现](#api实现)
4. [前端实现](#前端实现)
5. [权限实现](#权限实现)
6. [集成策略](#集成策略)
7. [测试策略](#测试策略)
8. [部署指南](#部署指南)
9. [维护与扩展](#维护与扩展)

## 实现概述

项目管理模块的实现遵循增量开发方法，按照以下顺序实现各个功能：

1. 数据模型和数据库迁移
2. 核心API端点
3. 基础页面结构
4. 项目管理功能
5. 任务管理功能
6. 看板功能
7. 迭代管理
8. 团队协作功能
9. 权限控制
10. 报表和分析

在实现过程中，每个功能点都应包含：

- 数据库模型
- API端点
- 前端组件
- 单元测试
- 集成测试

## 数据库实现

### 数据库迁移步骤

1. **创建Prisma模型扩展**

在`prisma/schema.prisma`中添加项目管理相关的模型：

```prisma
// 项目实体
model Project {
  id             String           @id @default(cuid())
  name           String
  description    String?
  startDate      DateTime?
  endDate        DateTime?
  status         ProjectStatus    @default(ACTIVE)
  visibility     ProjectVisibility @default(PRIVATE)
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  ownerId        String
  owner          User             @relation("OwnedProjects", fields: [ownerId], references: [id])
  members        ProjectMember[]
  tasks          Task[]
  sprints        Sprint[]
  attachments    Attachment[]

  @@map("projects")
}

// 添加其他模型...
```

2. **生成迁移文件**

```bash
npx prisma migrate dev --name add_project_management
```

3. **应用迁移**

```bash
npx prisma migrate deploy
```

4. **更新Prisma客户端**

```bash
npx prisma generate
```

### 数据关系管理

确保正确设置模型之间的关系，特别注意：

1. **用户和项目**：一对多关系（一个用户可拥有多个项目）
2. **项目和成员**：多对多关系（通过ProjectMember表）
3. **项目和任务**：一对多关系（一个项目包含多个任务）
4. **任务和子任务**：自引用关系（一个任务可有多个子任务）
5. **任务和分配**：多对多关系（通过TaskAssignment表）

### 索引优化

为提高查询性能，添加以下索引：

```prisma
// 用户项目索引
@@index([ownerId])

// 项目任务索引
@@index([projectId])

// 任务状态索引
@@index([status, projectId])

// 任务分配索引
@@index([memberId])
```

## API实现

### API结构实现

1. **创建API路由文件**

按照以下结构创建API路由文件：

```
/app/api/projects
  /route.ts                            # 项目列表和创建
  /[projectId]
    /route.ts                          # 项目详情、更新和删除
    /tasks
      /route.ts                        # 项目任务列表和创建
      /kanban
        /route.ts                      # 看板视图数据
      /[taskId]
        /route.ts                      # 任务详情、更新和删除
        /comments
          /route.ts                    # 评论列表和创建
          /[commentId]
            /route.ts                  # 评论更新和删除
    # 其他路由...
```

2. **实现API辅助函数**

创建API响应格式化工具：

```typescript
// /lib/api-response.ts

import { NextResponse } from 'next/server';

export function apiResponse<T>(
  data: T,
  meta?: Record<string, any>,
  status = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      meta
    },
    { status }
  );
}

export function apiError(
  code: string,
  message: string,
  details?: any,
  status = 400
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details
      }
    },
    { status }
  );
}

// 添加其他辅助函数...
```

3. **实现基本请求验证**

使用Zod进行请求验证：

```typescript
// /features/project-management/schemas/project-schemas.ts

import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, '项目名称不能为空')
    .max(100, '项目名称不能超过100个字符'),
  description: z.string().optional(),
  startDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  endDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  status: z
    .enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'])
    .default('ACTIVE'),
  visibility: z.enum(['PRIVATE', 'TEAM', 'PUBLIC']).default('PRIVATE')
});

// 添加其他验证模式...
```

### API端点实现

1. **项目列表API**

```typescript
// /app/api/projects/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { apiResponse, apiError, apiUnauthorized } from '@/lib/api-response';
import { createProjectSchema } from '@/features/project-management/schemas/project-schemas';

// 获取项目列表
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  // 解析查询参数
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const skip = (page - 1) * limit;

  // 构建查询条件
  const where: any = {
    OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }]
  };

  // 状态过滤
  if (status) {
    where.status = status;
  }

  // 搜索过滤
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  // 执行查询
  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            members: true,
            tasks: true
          }
        }
      }
    }),
    prisma.project.count({ where })
  ]);

  // 格式化项目数据
  const formattedProjects = await Promise.all(
    projects.map(async (project) => {
      // 计算项目进度
      const taskStats = await prisma.task.groupBy({
        by: ['status'],
        where: { projectId: project.id },
        _count: { _all: true }
      });

      const totalTasks = taskStats.reduce(
        (sum, stat) => sum + stat._count._all,
        0
      );
      const completedTasks =
        taskStats.find((stat) => stat.status === 'DONE')?._count._all || 0;
      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        visibility: project.visibility,
        startDate: project.startDate,
        endDate: project.endDate,
        progress,
        memberCount: project._count.members,
        taskStats: {
          total: totalTasks,
          completed: completedTasks
        },
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      };
    })
  );

  // 返回分页结果
  return apiResponse(formattedProjects, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  });
}

// 创建项目
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  try {
    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    // 创建项目
    const project = await prisma.project.create({
      data: {
        ...validatedData,
        ownerId: user.id
      }
    });

    return apiResponse(project, null, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(
        'VALIDATION_ERROR',
        '请求数据验证失败',
        error.flatten().fieldErrors,
        422
      );
    }

    return apiError(
      'SERVER_ERROR',
      '创建项目失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
```

2. **项目详情API**

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
import { updateProjectSchema } from '@/features/project-management/schemas/project-schemas';
import { hasProjectPermission } from '@/features/project-management/utils/project-permissions';

// 实现GET, PATCH, DELETE方法...
```

3. **看板API**

```typescript
// /app/api/projects/[projectId]/tasks/kanban/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  apiResponse,
  apiUnauthorized,
  apiNotFound,
  apiForbidden
} from '@/lib/api-response';
import { hasProjectPermission } from '@/features/project-management/utils/project-permissions';

// 实现GET方法...
```

## 前端实现

### 页面实现

1. **项目列表页**

```tsx
// /app/dashboard/projects/page.tsx

import { Metadata } from 'next';
import { ProjectList } from '@/features/project-management/components/project/project-list';
import { ProjectFilter } from '@/features/project-management/components/project/project-filter';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { hasSystemPermission } from '@/lib/permissions';

export const metadata: Metadata = {
  title: '项目管理',
  description: '管理您的项目和任务'
};

export default async function ProjectsPage() {
  // 检查创建项目权限
  const canCreateProject = await hasSystemPermission('project.create');

  return (
    <div className='container space-y-6 py-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold tracking-tight'>项目管理</h1>
        {canCreateProject && (
          <Button asChild>
            <Link href='/dashboard/projects/new'>
              <PlusIcon className='mr-2 h-4 w-4' />
              新建项目
            </Link>
          </Button>
        )}
      </div>

      <ProjectFilter />

      <ProjectList />
    </div>
  );
}
```

2. **看板页面**

```tsx
// /app/dashboard/projects/[projectId]/kanban/page.tsx

import { Metadata } from 'next';
import { KanbanView } from '@/features/project-management/components/kanban/kanban-view';
import { getProjectById } from '@/features/project-management/actions/project-actions';
import { hasProjectPermission } from '@/features/project-management/utils/project-permissions';
import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

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
    title: `${project.name} - 看板`,
    description: `${project.name} 项目的任务看板视图`
  };
}

export default async function KanbanPage({
  params
}: {
  params: { projectId: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  const projectId = params.projectId;

  // 检查用户是否有查看项目的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'project.view',
    user.id
  );

  if (!hasPermission) {
    redirect('/dashboard/projects');
  }

  const project = await getProjectById(projectId);

  if (!project) {
    notFound();
  }

  return (
    <div className='container space-y-6 py-6'>
      <h1 className='text-3xl font-bold tracking-tight'>任务看板</h1>

      <KanbanView projectId={projectId} />
    </div>
  );
}
```

### 组件实现

1. **项目列表组件**

```tsx
// /features/project-management/components/project/project-list.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProjectCard } from './project-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';

export function ProjectList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // 构建查询参数
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1', 10);

  // 获取项目列表
  const fetchProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      // 构建查询字符串
      const queryParams = new URLSearchParams();
      if (status) queryParams.set('status', status);
      if (search) queryParams.set('search', search);
      queryParams.set('page', page.toString());
      queryParams.set('limit', '10');

      const response = await fetch(`/api/projects?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error('获取项目列表失败');
      }

      const data = await response.json();

      if (data.success) {
        setProjects(data.data);
        setMeta(data.meta);
      } else {
        setError(data.error?.message || '获取项目列表失败');
      }
    } catch (error) {
      setError('获取项目列表失败');
      console.error('获取项目列表错误:', error);
    } finally {
      setLoading(false);
    }
  };

  // 监听查询参数变化
  useEffect(() => {
    fetchProjects();
  }, [status, search, page]);

  // 处理页面切换
  const handlePageChange = (newPage: number) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('page', newPage.toString());
    router.push(`/dashboard/projects?${current.toString()}`);
  };

  // 处理项目点击
  const handleProjectClick = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}`);
  };

  // 加载中状态
  if (loading) {
    return (
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className='h-[200px] rounded-lg' />
        ))}
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className='bg-destructive/10 border-destructive rounded-lg border p-6'>
        <p className='text-destructive'>错误: {error}</p>
        <Button variant='outline' onClick={fetchProjects} className='mt-2'>
          重试
        </Button>
      </div>
    );
  }

  // 空状态
  if (projects.length === 0) {
    return (
      <div className='bg-muted/50 border-border rounded-lg border p-6 text-center'>
        <p className='mb-2'>暂无项目</p>
        <Button
          variant='default'
          onClick={() => router.push('/dashboard/projects/new')}
        >
          创建新项目
        </Button>
      </div>
    );
  }

  // 正常状态
  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={() => handleProjectClick(project.id)}
          />
        ))}
      </div>

      {meta.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(1, meta.page - 1))}
                disabled={meta.page === 1}
              />
            </PaginationItem>

            {/* 页码生成逻辑 */}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  handlePageChange(Math.min(meta.totalPages, meta.page + 1))
                }
                disabled={meta.page === meta.totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
```

2. **看板视图组件**

```tsx
// /features/project-management/components/kanban/kanban-view.tsx

'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  closestCorners
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { KanbanColumn } from './kanban-column';
import { TaskCard } from '../task/task-card';
import { KanbanFilter } from './kanban-filter';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProjectPermissions } from '../../hooks/use-project-permissions';

interface KanbanViewProps {
  projectId: string;
}

export function KanbanView({ projectId }: KanbanViewProps) {
  const [columns, setColumns] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { hasPermission } = useProjectPermissions(projectId);

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    }),
    useSensor(KeyboardSensor)
  );

  // 获取看板数据
  const fetchKanbanData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/kanban`);

      if (!response.ok) {
        throw new Error('获取看板数据失败');
      }

      const data = await response.json();

      if (data.success) {
        setColumns(data.data);
      } else {
        setError(data.error?.message || '获取看板数据失败');
      }
    } catch (error) {
      setError('获取看板数据失败');
      console.error('获取看板数据错误:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    fetchKanbanData();
  }, [projectId]);

  // 处理拖拽开始
  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveId(active.id);

    // 查找被拖拽的任务
    for (const column of columns) {
      const task = column.tasks.find((t: any) => t.id === active.id);
      if (task) {
        setActiveTask(task);
        break;
      }
    }
  };

  // 处理拖拽结束
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (!active || !over) {
      setActiveId(null);
      setActiveTask(null);
      return;
    }

    // 如果任务放到了不同的列
    if (active.id !== over.id && over.id.startsWith('column:')) {
      const taskId = active.id;
      const sourceColumnId = columns.find((col) =>
        col.tasks.some((t: any) => t.id === taskId)
      )?.id;
      const targetColumnId = over.id.replace('column:', '');

      if (
        sourceColumnId &&
        targetColumnId &&
        sourceColumnId !== targetColumnId
      ) {
        // 乐观更新UI
        setColumns((prev) => {
          // 找到源列和目标列
          const updatedColumns = [...prev];
          const sourceColIndex = updatedColumns.findIndex(
            (col) => col.id === sourceColumnId
          );
          const targetColIndex = updatedColumns.findIndex(
            (col) => col.id === targetColumnId
          );

          if (sourceColIndex !== -1 && targetColIndex !== -1) {
            // 找到任务
            const taskIndex = updatedColumns[sourceColIndex].tasks.findIndex(
              (t: any) => t.id === taskId
            );

            if (taskIndex !== -1) {
              // 移动任务到新列
              const [task] = updatedColumns[sourceColIndex].tasks.splice(
                taskIndex,
                1
              );
              task.status = targetColumnId;
              updatedColumns[targetColIndex].tasks.push(task);
            }
          }

          return updatedColumns;
        });

        // 向API发送更新请求
        try {
          const response = await fetch(
            `/api/projects/${projectId}/tasks/${taskId}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                status: targetColumnId
              })
            }
          );

          if (!response.ok) {
            // 如果更新失败，回滚UI并显示错误
            fetchKanbanData();
            setError('更新任务状态失败');
          }
        } catch (error) {
          // 如果更新失败，回滚UI并显示错误
          fetchKanbanData();
          setError('更新任务状态失败');
          console.error('更新任务状态错误:', error);
        }
      }
    }

    setActiveId(null);
    setActiveTask(null);
  };

  // 处理添加任务
  const handleAddTask = (columnId: string) => {
    // 实现添加任务的逻辑
  };

  // 加载中状态
  if (loading) {
    return (
      <div className='space-y-6'>
        <Skeleton className='h-10 w-1/3' />
        <div className='flex space-x-4 overflow-x-auto pb-6'>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              className='h-[500px] w-[280px] flex-shrink-0'
            />
          ))}
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>错误: {error}</AlertDescription>
      </Alert>
    );
  }

  // 正常状态
  return (
    <div className='space-y-6'>
      <KanbanFilter projectId={projectId} onFilterChange={fetchKanbanData} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className='flex space-x-4 overflow-x-auto pb-6'>
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={`column:${column.id}`}
              title={column.title}
              tasks={column.tasks}
              onAddTask={
                hasPermission('task.create')
                  ? () => handleAddTask(column.id)
                  : undefined
              }
            />
          ))}
        </div>

        <DragOverlay>
          {activeId && activeTask ? (
            <TaskCard
              task={activeTask}
              className='w-[280px] opacity-80 shadow-md'
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
```

## 权限实现

### 权限工具实现

1. **权限配置文件**

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
```

2. **权限工具函数**

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

// 实现其他权限检查函数...
```

### 权限钩子实现

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

  // 加载权限数据
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    hasPermission,
    loading,
    refreshPermissions: fetchPermissions
  };
}
```

### 权限组件实现

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

## 集成策略

### 导航集成

1. **添加导航项**

在现有导航中添加项目管理入口：

```tsx
// /components/layout/main-nav.tsx

// 导航项列表
const navItems = [
  // ...其他导航项
  {
    title: '项目管理',
    href: '/dashboard/projects',
    icon: <ProjectIcon className='h-5 w-5' />,
    permission: 'project.view'
  }
];
```

2. **添加仪表盘卡片**

在概览页面添加项目管理卡片：

```tsx
// /app/dashboard/overview/page.tsx

// 添加项目管理卡片
<Card className='col-span-1 lg:col-span-2'>
  <CardHeader>
    <CardTitle>我的项目</CardTitle>
  </CardHeader>
  <CardContent>
    <RecentProjects />
  </CardContent>
  <CardFooter>
    <Button asChild variant='outline' size='sm'>
      <Link href='/dashboard/projects'>查看所有项目</Link>
    </Button>
  </CardFooter>
</Card>
```

### 权限集成

在系统初始化时添加项目管理权限：

```typescript
// /prisma/seed.ts

async function seedPermissions() {
  // ...现有权限

  // 项目管理权限
  const projectPermissions = [
    { name: 'project.view', description: '查看项目' },
    { name: 'project.create', description: '创建项目' }
    // ...其他项目权限
  ];

  for (const permission of projectPermissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: permission,
      create: permission
    });
  }
}
```

## 测试策略

### 单元测试

对关键工具函数和组件进行单元测试：

```typescript
// /tests/unit/project-permissions.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isProjectOwner,
  getUserProjectRole,
  hasProjectPermission
} from '@/features/project-management/utils/project-permissions';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 模拟依赖
vi.mock('@/lib/prisma');
vi.mock('@/lib/auth');

describe('Project Permissions Utils', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('isProjectOwner', () => {
    it('should return true if user is project owner', async () => {
      // 模拟数据
      (prisma.project.findUnique as any).mockResolvedValue({
        id: 'test-project',
        ownerId: 'test-user'
      });

      const result = await isProjectOwner('test-project', 'test-user');
      expect(result).toBe(true);
    });

    // 更多测试...
  });

  // 更多测试...
});
```

### 集成测试

测试API端点和数据流：

```typescript
// /tests/integration/project-api.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/projects/route';
import { prisma } from '@/lib/prisma';
import { mockCurrentUser } from '../mocks/auth';
import { createTestProject, cleanupTestProjects } from '../utils/test-helpers';

describe('Projects API', () => {
  beforeAll(async () => {
    // 准备测试数据
    await createTestProject();
  });

  afterAll(async () => {
    // 清理测试数据
    await cleanupTestProjects();
  });

  describe('GET /api/projects', () => {
    it('should return projects for authenticated user', async () => {
      // 模拟认证用户
      mockCurrentUser({
        id: 'test-user',
        name: 'Test User'
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/projects'
      });

      await GET(req);

      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
    });

    // 更多测试...
  });

  // 更多测试...
});
```

### 端到端测试

使用Playwright测试用户流程：

```typescript
// /tests/e2e/project-management.spec.ts

import { test, expect } from '@playwright/test';
import { login, createTestProject } from './utils';

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    // 登录测试用户
    await login(page, 'test@example.com', 'password');
  });

  test('should create and view a new project', async ({ page }) => {
    // 导航到项目列表页面
    await page.goto('/dashboard/projects');

    // 点击创建新项目按钮
    await page.click('text=新建项目');

    // 填写项目表单
    await page.fill('input[name="name"]', '测试项目');
    await page.fill('textarea[name="description"]', '这是一个测试项目');

    // 提交表单
    await page.click('button[type="submit"]');

    // 验证跳转到项目详情页面
    await expect(page).toHaveURL(/\/dashboard\/projects\/[\w-]+/);

    // 验证项目信息显示正确
    await expect(page.locator('h1')).toContainText('测试项目');
    await expect(page.locator('text=这是一个测试项目')).toBeVisible();
  });

  // 更多测试...
});
```

## 部署指南

### 部署步骤

1. **数据库迁移**

```bash
npx prisma migrate deploy
```

2. **初始化权限数据**

```bash
npx prisma db seed
```

3. **构建应用**

```bash
npm run build
```

4. **启动服务**

```bash
npm run start
```

### 环境变量配置

确保配置以下环境变量：

```
# 数据库连接
DATABASE_URL=...

# 身份验证配置
CLERK_SECRET_KEY=...
CLERK_PUBLISHABLE_KEY=...

# 文件存储配置
UPLOAD_DIRECTORY=...
MAX_UPLOAD_SIZE=...
```

## 维护与扩展

### 代码组织

按照特性和功能模块组织代码，便于维护和扩展：

```
/features
  /project-management           # 项目管理模块根目录
    /components                 # UI组件
    /hooks                      # 自定义React钩子
    /utils                      # 工具函数
    /config                     # 配置文件
    /types                      # TypeScript类型定义
    /actions                    # 服务器操作
    /schemas                    # Zod验证模式
```

### 扩展指南

1. **添加新实体**:

   - 在Prisma模型中添加新实体
   - 创建迁移
   - 添加API端点
   - 实现前端组件

2. **添加新功能**:

   - 遵循现有的文件结构和命名约定
   - 集成现有的权限系统
   - 添加适当的测试
   - 更新相关文档

3. **第三方集成**:
   - 创建专门的集成文件夹
   - 实现适配器模式以便于替换
   - 确保配置可通过环境变量调整

### 性能优化

1. **查询优化**:

   - 使用适当的索引
   - 限制返回的字段
   - 实现分页和限制

2. **缓存策略**:

   - 缓存常用数据
   - 实现查询结果缓存
   - 使用客户端状态缓存

3. **批量操作**:
   - 实现批量创建、更新和删除
   - 使用事务确保数据一致性

通过遵循这些实现指南，项目管理模块将具有良好的结构、性能和可维护性，能够满足用户需求并支持未来扩展。
