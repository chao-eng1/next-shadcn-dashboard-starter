# 项目管理模块 - API实现指南

本文档提供项目管理模块API的实现指南，包括路由文件结构、处理函数示例和最佳实践。

## 目录

1. [API路由文件结构](#api路由文件结构)
2. [基础工具函数](#基础工具函数)
3. [API实现示例](#api实现示例)
4. [错误处理](#错误处理)
5. [验证和授权](#验证和授权)
6. [测试策略](#测试策略)
7. [实现计划](#实现计划)

## API路由文件结构

项目管理模块的API路由文件结构如下：

```
/app/api/projects
  /route.ts                            # 项目列表: GET(列表), POST(创建)
  /[projectId]
    /route.ts                          # 项目详情: GET, PATCH, DELETE
    /tasks
      /route.ts                        # 项目任务: GET(列表), POST(创建)
      /[taskId]
        /route.ts                      # 任务详情: GET, PATCH, DELETE
        /comments
          /route.ts                    # 任务评论: GET(列表), POST(创建)
          /[commentId]
            /route.ts                  # 评论操作: PATCH, DELETE
    /sprints
      /route.ts                        # 迭代列表: GET(列表), POST(创建)
      /[sprintId]
        /route.ts                      # 迭代详情: GET, PATCH, DELETE
    /members
      /route.ts                        # 成员列表: GET(列表), POST(添加)
      /[memberId]
        /route.ts                      # 成员操作: PATCH, DELETE
    /attachments
      /route.ts                        # 项目附件: GET(列表), POST(上传)
      /[attachmentId]
        /route.ts                      # 附件操作: GET, DELETE
    /tags
      /route.ts                        # 标签列表: GET(列表), POST(创建)
      /[tagId]
        /route.ts                      # 标签操作: PATCH, DELETE
```

## 基础工具函数

为确保API的一致性和代码复用，创建以下基础工具函数:

### API响应格式化

```typescript
// /lib/api-response.ts

import { NextResponse } from 'next/server';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: Record<string, any>;
};

export function apiResponse<T>(
  data: T,
  meta?: Record<string, any>,
  status = 200
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data
  };

  if (meta) {
    response.meta = meta;
  }

  return NextResponse.json(response, { status });
}

export function apiError(
  code: string,
  message: string,
  details?: any,
  status = 400
): NextResponse {
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code,
      message
    }
  };

  if (details) {
    response.error.details = details;
  }

  return NextResponse.json(response, { status });
}

export function apiNotFound(resource = 'Resource'): NextResponse {
  return apiError('RESOURCE_NOT_FOUND', `${resource} not found`, null, 404);
}

export function apiUnauthorized(message = 'Unauthorized'): NextResponse {
  return apiError('UNAUTHORIZED', message, null, 401);
}

export function apiForbidden(message = 'Forbidden'): NextResponse {
  return apiError('PERMISSION_DENIED', message, null, 403);
}

export function apiValidationError(
  details: Record<string, string[]>
): NextResponse {
  return apiError('VALIDATION_ERROR', 'Validation failed', details, 422);
}
```

### 验证和授权工具

```typescript
// /features/project-management/utils/project-auth.ts

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ProjectMemberRole } from '@prisma/client';

// 检查用户是否为项目成员
export async function isProjectMember(
  projectId: string,
  userId?: string
): Promise<boolean> {
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return false;
    userId = user.id;
  }

  const projectMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    }
  });

  return !!projectMember;
}

// 检查用户是否为项目所有者或管理员
export async function isProjectAdmin(
  projectId: string,
  userId?: string
): Promise<boolean> {
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return false;
    userId = user.id;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (project?.ownerId === userId) return true;

  const projectMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    }
  });

  return projectMember?.role === 'ADMIN' || projectMember?.role === 'OWNER';
}

// 检查用户对任务的访问权限
export async function canAccessTask(
  taskId: string,
  userId?: string
): Promise<boolean> {
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return false;
    userId = user.id;
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true }
  });

  if (!task) return false;

  return isProjectMember(task.projectId, userId);
}

// 检查用户对项目资源的操作权限
export async function hasProjectPermission(
  projectId: string,
  requiredRoles: ProjectMemberRole[] = ['OWNER', 'ADMIN', 'MEMBER'],
  userId?: string
): Promise<boolean> {
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return false;
    userId = user.id;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  // 项目所有者拥有全部权限
  if (project?.ownerId === userId) return true;

  const projectMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    }
  });

  if (!projectMember) return false;

  return requiredRoles.includes(projectMember.role as ProjectMemberRole);
}
```

## API实现示例

以下是几个关键API端点的实现示例:

### 项目列表和创建

```typescript
// /app/api/projects/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  apiResponse,
  apiError,
  apiUnauthorized,
  apiValidationError
} from '@/lib/api-response';
import { z } from 'zod';

// 获取项目列表
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  // 解析查询参数
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const role = searchParams.get('role');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'updatedAt';
  const order = searchParams.get('order') || 'desc';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const skip = (page - 1) * limit;

  // 构建查询条件
  const where: any = {
    OR: [
      // 用户拥有的项目
      { ownerId: user.id },
      // 用户是成员的项目
      { members: { some: { userId: user.id } } }
    ]
  };

  // 状态过滤
  if (status) {
    where.status = status;
  }

  // 角色过滤
  if (role) {
    // 修改查询条件以匹配特定角色
    where.OR = [
      // 如果是OWNER角色，检查ownerId
      ...(role === 'OWNER' ? [{ ownerId: user.id }] : []),
      // 对于其他角色，检查成员关系
      ...(role !== 'OWNER'
        ? [{ members: { some: { userId: user.id, role } } }]
        : [])
    ];
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
      orderBy: { [sort]: order },
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

  // 验证请求体
  const projectSchema = z.object({
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

  try {
    const body = await request.json();
    const validatedData = projectSchema.parse(body);

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
      return apiValidationError(error.flatten().fieldErrors);
    }

    return apiError(
      'SERVER_ERROR',
      'Failed to create project',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
```

### 项目详情、更新和删除

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
  apiForbidden,
  apiValidationError
} from '@/lib/api-response';
import {
  isProjectMember,
  isProjectAdmin
} from '@/features/project-management/utils/project-auth';
import { z } from 'zod';

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

  // 检查用户是否为项目成员
  const isMember = await isProjectMember(projectId, user.id);

  if (!isMember) {
    return apiForbidden("You don't have access to this project");
  }

  // 获取项目详情
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      _count: {
        select: {
          members: true,
          tasks: true
        }
      }
    }
  });

  if (!project) {
    return apiNotFound('Project');
  }

  // 计算项目进度
  const taskStats = await prisma.task.groupBy({
    by: ['status'],
    where: { projectId },
    _count: { _all: true }
  });

  const taskStatusCounts = {
    total: 0,
    completed: 0,
    inProgress: 0,
    todo: 0,
    blocked: 0
  };

  taskStats.forEach((stat) => {
    const count = stat._count._all;
    taskStatusCounts.total += count;

    if (stat.status === 'DONE') {
      taskStatusCounts.completed += count;
    } else if (stat.status === 'IN_PROGRESS') {
      taskStatusCounts.inProgress += count;
    } else if (stat.status === 'TODO') {
      taskStatusCounts.todo += count;
    } else if (stat.status === 'BLOCKED') {
      taskStatusCounts.blocked += count;
    }
  });

  const progress =
    taskStatusCounts.total > 0
      ? Math.round((taskStatusCounts.completed / taskStatusCounts.total) * 100)
      : 0;

  // 格式化项目数据
  const formattedProject = {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    visibility: project.visibility,
    startDate: project.startDate,
    endDate: project.endDate,
    ownerId: project.ownerId,
    progress,
    memberCount: project._count.members,
    taskStats: taskStatusCounts,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  };

  return apiResponse(formattedProject);
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

  // 检查用户是否为项目管理员
  const isAdmin = await isProjectAdmin(projectId, user.id);

  if (!isAdmin) {
    return apiForbidden("You don't have permission to update this project");
  }

  // 验证请求体
  const updateSchema = z.object({
    name: z
      .string()
      .min(1, '项目名称不能为空')
      .max(100, '项目名称不能超过100个字符')
      .optional(),
    description: z.string().optional(),
    startDate: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
    endDate: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
    status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
    visibility: z.enum(['PRIVATE', 'TEAM', 'PUBLIC']).optional()
  });

  try {
    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    // 更新项目
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: validatedData
    });

    return apiResponse(updatedProject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiValidationError(error.flatten().fieldErrors);
    }

    // 处理项目不存在的情况
    if (error.code === 'P2025') {
      return apiNotFound('Project');
    }

    return apiError(
      'SERVER_ERROR',
      'Failed to update project',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
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

  // 检查项目是否存在
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    return apiNotFound('Project');
  }

  // 只有项目所有者可以删除项目
  if (project.ownerId !== user.id) {
    return apiForbidden('Only the project owner can delete the project');
  }

  try {
    // 删除项目（级联删除关联数据）
    await prisma.project.delete({
      where: { id: projectId }
    });

    return apiResponse(null);
  } catch (error) {
    return apiError(
      'SERVER_ERROR',
      'Failed to delete project',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
```

### 看板任务列表

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
import { isProjectMember } from '@/features/project-management/utils/project-auth';

// 获取看板任务数据
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
    return apiForbidden("You don't have access to this project");
  }

  // 检查项目是否存在
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    return apiNotFound('Project');
  }

  // 解析查询参数
  const { searchParams } = new URL(request.url);
  const sprintId = searchParams.get('sprintId');
  const assigneeId = searchParams.get('assigneeId');
  const tagId = searchParams.get('tagId');
  const search = searchParams.get('search');

  // 构建查询条件
  const where: any = { projectId };

  // 迭代过滤
  if (sprintId) {
    where.sprintId = sprintId;
  }

  // 负责人过滤
  if (assigneeId) {
    where.assignments = {
      some: {
        member: {
          userId: assigneeId
        }
      }
    };
  }

  // 标签过滤
  if (tagId) {
    where.tags = {
      some: {
        tagId
      }
    };
  }

  // 搜索过滤
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  // 只获取顶级任务（非子任务）
  where.parentTaskId = null;

  // 获取任务
  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignments: {
        include: {
          member: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              }
            }
          }
        }
      },
      tags: {
        include: {
          tag: true
        }
      },
      _count: {
        select: {
          subtasks: true
        }
      }
    }
  });

  // 计算每个任务的子任务完成情况
  const tasksWithSubtaskStats = await Promise.all(
    tasks.map(async (task) => {
      const subtaskStats = await prisma.task.groupBy({
        by: ['status'],
        where: { parentTaskId: task.id },
        _count: { _all: true }
      });

      const subtaskTotal = task._count.subtasks;
      const subtaskCompleted = subtaskStats
        .filter((stat) => stat.status === 'DONE')
        .reduce((sum, stat) => sum + stat._count._all, 0);

      // 格式化分配人员
      const assignees = task.assignments.map((assignment) => ({
        id: assignment.member.user.id,
        name: assignment.member.user.name,
        image: assignment.member.user.image
      }));

      // 格式化标签
      const tags = task.tags.map((tag) => ({
        id: tag.tag.id,
        name: tag.tag.name,
        color: tag.tag.color
      }));

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assignees,
        tags,
        subtaskStats:
          subtaskTotal > 0
            ? {
                total: subtaskTotal,
                completed: subtaskCompleted
              }
            : undefined
      };
    })
  );

  // 按状态分组任务
  const statusColumns = {
    TODO: [],
    IN_PROGRESS: [],
    REVIEW: [],
    DONE: [],
    BLOCKED: []
  };

  tasksWithSubtaskStats.forEach((task) => {
    const status = task.status as keyof typeof statusColumns;
    statusColumns[status].push(task);
  });

  // 构建看板数据
  const kanbanData = Object.entries(statusColumns).map(([status, tasks]) => ({
    id: status,
    title: getStatusTitle(status),
    tasks
  }));

  return apiResponse(kanbanData);
}

// 辅助函数：获取状态显示名称
function getStatusTitle(status: string): string {
  const statusMap: Record<string, string> = {
    TODO: '待处理',
    IN_PROGRESS: '进行中',
    REVIEW: '审核中',
    DONE: '已完成',
    BLOCKED: '已阻塞'
  };

  return statusMap[status] || status;
}
```

## 错误处理

API实现中应采用统一的错误处理机制，确保返回一致的错误格式。

### 异常捕获

在每个处理函数中使用try-catch捕获异常：

```typescript
try {
  // 业务逻辑
  return apiResponse(data);
} catch (error) {
  // 处理特定类型的错误
  if (error instanceof z.ZodError) {
    return apiValidationError(error.flatten().fieldErrors);
  }

  // 处理Prisma错误
  if (error.code === 'P2025') {
    return apiNotFound('Resource');
  }

  // 处理其他错误
  return apiError(
    'SERVER_ERROR',
    'An unexpected error occurred',
    process.env.NODE_ENV === 'development' ? error : undefined,
    500
  );
}
```

### 全局错误处理

对于未捕获的异常，实现全局错误处理中间件：

```typescript
// 实现全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // 可以添加额外的错误报告逻辑，如发送到Sentry
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // 可以添加额外的错误报告逻辑，如发送到Sentry
});
```

## 验证和授权

### 输入验证

使用Zod库验证请求数据：

```typescript
// 定义验证模式
const createTaskSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符'),
  description: z.string().optional(),
  status: z
    .enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'])
    .default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  estimatedHours: z.number().min(0).optional(),
  parentTaskId: z.string().optional(),
  sprintId: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional()
});

// 验证请求数据
const body = await request.json();
const validatedData = createTaskSchema.parse(body);
```

### 权限校验

在处理请求前检查用户权限：

1. **基本身份验证**：检查用户是否已登录
2. **项目成员检查**：验证用户是否为项目成员
3. **角色权限检查**：验证用户是否具有所需权限

```typescript
// 权限校验流程
const user = await getCurrentUser();
if (!user) {
  return apiUnauthorized();
}

// 项目成员检查
const isMember = await isProjectMember(projectId, user.id);
if (!isMember) {
  return apiForbidden("You don't have access to this project");
}

// 管理员权限检查（用于修改操作）
if (isModifyOperation) {
  const isAdmin = await isProjectAdmin(projectId, user.id);
  if (!isAdmin) {
    return apiForbidden("You don't have permission to perform this action");
  }
}
```

## 测试策略

### 单元测试

对关键功能进行单元测试：

```typescript
// /tests/api/projects.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/projects/route';
import { prisma } from '@/lib/prisma';
import { mockCurrentUser } from '../mocks/auth';

describe('Projects API', () => {
  beforeEach(async () => {
    // 设置测试数据
    await prisma.project.create({
      data: {
        id: 'test-project',
        name: 'Test Project',
        ownerId: 'test-user'
      }
    });

    // 模拟当前用户
    mockCurrentUser({
      id: 'test-user',
      name: 'Test User'
    });
  });

  afterEach(async () => {
    // 清理测试数据
    await prisma.project.deleteMany();
  });

  it('should return projects for authenticated user', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      url: '/api/projects'
    });

    await GET(req);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
    expect(data.data[0].name).toBe('Test Project');
  });

  it('should create a new project', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      url: '/api/projects',
      body: {
        name: 'New Project',
        description: 'Project description'
      }
    });

    await POST(req);

    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('New Project');

    // 验证数据库中是否创建了项目
    const createdProject = await prisma.project.findFirst({
      where: { name: 'New Project' }
    });
    expect(createdProject).not.toBeNull();
  });
});
```

### 集成测试

测试API端点间的交互：

```typescript
// /tests/integration/project-task.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { POST as createProject } from '@/app/api/projects/route';
import { POST as createTask } from '@/app/api/projects/[projectId]/tasks/route';
import { prisma } from '@/lib/prisma';
import { mockCurrentUser } from '../mocks/auth';

describe('Project and Task Integration', () => {
  let projectId: string;

  beforeAll(async () => {
    // 模拟当前用户
    mockCurrentUser({
      id: 'test-user',
      name: 'Test User'
    });

    // 创建测试项目
    const { req, res } = createMocks({
      method: 'POST',
      url: '/api/projects',
      body: {
        name: 'Integration Test Project'
      }
    });

    await createProject(req);
    const data = JSON.parse(res._getData());
    projectId = data.data.id;
  });

  afterAll(async () => {
    // 清理测试数据
    await prisma.project.deleteMany();
  });

  it('should create a task in the project', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      url: `/api/projects/${projectId}/tasks`,
      body: {
        title: 'Test Task',
        status: 'TODO',
        priority: 'HIGH'
      },
      params: {
        projectId
      }
    });

    await createTask(req);

    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('Test Task');
    expect(data.data.projectId).toBe(projectId);

    // 验证任务是否正确关联到项目
    const task = await prisma.task.findFirst({
      where: { title: 'Test Task' }
    });
    expect(task).not.toBeNull();
    expect(task?.projectId).toBe(projectId);
  });
});
```

## 实现计划

API实现将按照以下计划进行：

1. **基础设施**

   - 实现API响应工具函数
   - 实现权限验证工具
   - 实现错误处理机制

2. **核心功能**

   - 项目管理API (增删改查)
   - 任务管理API (增删改查)
   - 看板API (获取和更新)

3. **附加功能**

   - 迭代管理API
   - 成员管理API
   - 评论和附件API
   - 标签管理API

4. **优化和测试**
   - 编写单元测试
   - 进行集成测试
   - 性能优化
   - 安全审查

实现过程中将优先确保核心功能的稳定性和性能，然后再添加附加功能。
