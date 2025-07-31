import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  apiResponse,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiForbidden
} from '@/lib/api-response';
import { hasProjectPermission } from '@/lib/permissions';

// 创建任务请求验证
const createTaskSchema = z.object({
  title: z.string().min(1, '任务标题不能为空'),
  description: z.string().optional(),
  status: z
    .enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'])
    .default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedHours: z.number().min(0).optional().nullable(),
  parentTaskId: z.string().optional().nullable(),
  sprintId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(), // 添加分配给的成员ID
  assignSelf: z.boolean().optional() // 添加分配给自己的选项
});

// 查询参数验证
const getTasksQuerySchema = z.object({
  status: z
    .enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'])
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  search: z.string().optional(),
  sprintId: z.string().optional(),
  parentTaskId: z.string().optional(),
  assignedToMe: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  page: z.coerce.number().min(1).default(1),
  sortBy: z
    .enum(['title', 'createdAt', 'updatedAt', 'dueDate', 'priority'])
    .default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// 获取任务列表
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
    return apiForbidden('您没有权限查看此项目');
  }

  // 解析查询参数
  const { searchParams } = new URL(request.url);

  try {
    const query = getTasksQuerySchema.parse({
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      search: searchParams.get('search') || undefined,
      sprintId: searchParams.get('sprintId') || undefined,
      parentTaskId: searchParams.get('parentTaskId') || undefined,
      assignedToMe: searchParams.get('assignedToMe') || undefined,
      limit: searchParams.get('limit') || 50,
      page: searchParams.get('page') || 1,
      sortBy: searchParams.get('sortBy') || 'updatedAt',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    });

    // 构建查询条件
    const where: any = { projectId };

    // 状态过滤
    if (query.status) {
      where.status = query.status;
    }

    // 优先级过滤
    if (query.priority) {
      where.priority = query.priority;
    }

    // 迭代过滤
    if (query.sprintId) {
      where.sprintId = query.sprintId;
    }

    // 父任务过滤（如果parentTaskId为null，则查询顶级任务）
    if (query.parentTaskId === 'null') {
      where.parentTaskId = null;
    } else if (query.parentTaskId) {
      where.parentTaskId = query.parentTaskId;
    }

    // 搜索过滤
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    // 分配给我的任务
    if (query.assignedToMe === 'true') {
      where.assignments = {
        some: {
          member: {
            userId: user.id
          }
        }
      };
    }

    // 分页和排序
    const skip = (query.page - 1) * query.limit;
    const take = query.limit;
    const orderBy = { [query.sortBy]: query.sortOrder };

    // 查询任务总数
    const total = await prisma.task.count({ where });

    // 查询任务列表
    const tasks = await prisma.task.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        assignments: {
          include: {
            member: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            subtasks: true,
            comments: true,
            attachments: true
          }
        }
      }
    });

    return apiResponse({
      tasks,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit)
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(
        'INVALID_PARAMETERS',
        '请求参数无效',
        error.format(),
        400
      );
    }

    console.error('获取任务列表失败:', error);
    return apiError(
      'SERVER_ERROR',
      '获取任务列表失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 创建任务
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const projectId = params.projectId;

  // 检查用户是否有创建任务的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'task.create',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden('您没有权限在此项目中创建任务');
  }

  try {
    const body = await request.json();

    // 验证请求数据
    const validated = createTaskSchema.parse(body);

    // 如果指定了父任务，检查它是否存在且属于当前项目
    if (validated.parentTaskId) {
      const parentTask = await prisma.task.findUnique({
        where: { id: validated.parentTaskId }
      });

      if (!parentTask) {
        return apiNotFound('父任务不存在');
      }

      if (parentTask.projectId !== projectId) {
        return apiForbidden('父任务不属于当前项目');
      }
    }

    // 如果指定了迭代，检查它是否存在且属于当前项目
    if (validated.sprintId) {
      const sprint = await prisma.sprint.findUnique({
        where: { id: validated.sprintId }
      });

      if (!sprint) {
        return apiNotFound('迭代不存在');
      }

      if (sprint.projectId !== projectId) {
        return apiForbidden('迭代不属于当前项目');
      }
    }

    // 创建任务
    const task = await prisma.task.create({
      data: {
        title: validated.title,
        description: validated.description,
        status: validated.status,
        priority: validated.priority,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        estimatedHours: validated.estimatedHours,
        parentTaskId: validated.parentTaskId,
        sprintId: validated.sprintId,
        projectId
      }
    });

    // 获取用户在项目中的成员记录
    const projectMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId
        }
      }
    });

    // 从请求中获取分配信息
    const assigneeId = body.assigneeId;
    const assignSelf = body.assignSelf;

    // 如果指定了分配的成员ID，则验证并分配
    if (assigneeId) {
      // 检查成员是否存在并属于此项目
      const memberToAssign = await prisma.projectMember.findUnique({
        where: {
          id: assigneeId,
          projectId
        }
      });

      if (!memberToAssign) {
        return apiNotFound('项目成员不存在或不属于此项目');
      }

      // 创建任务分配
      await prisma.taskAssignment.create({
        data: {
          taskId: task.id,
          memberId: assigneeId
        }
      });
    }
    // 如果选择分配给自己，则获取当前用户在项目中的成员ID并分配
    else if (assignSelf && projectMember) {
      await prisma.taskAssignment.create({
        data: {
          taskId: task.id,
          memberId: projectMember.id
        }
      });
    }

    return apiResponse(task, null, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(
        'INVALID_PARAMETERS',
        '请求参数无效',
        error.format(),
        400
      );
    }

    console.error('创建任务失败:', error);
    return apiError(
      'SERVER_ERROR',
      '创建任务失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
