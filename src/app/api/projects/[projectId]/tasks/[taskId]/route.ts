import { NextRequest } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// 任务更新请求验证
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const updateTaskSchema = z.object({
  title: z.string().min(1, '任务标题不能为空').optional(),
  description: z.string().optional(),
  status: z
    .enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'])
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedHours: z.number().min(0).optional(),
  completedAt: z.string().datetime().optional().nullable(),
  sprintId: z.string().optional().nullable(),
  parentTaskId: z.string().optional().nullable()
});

// 获取单个任务详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; taskId: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId, taskId } = await params;

  // 检查用户是否有查看项目的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'project.view',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden('您没有权限查看此项目');
  }

  try {
    // 查询任务详情
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
        projectId
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        sprint: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        parentTask: {
          select: {
            id: true,
            title: true
          }
        },
        subtasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true
          }
        },
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
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        attachments: true,
        _count: {
          select: {
            subtasks: true,
            comments: true,
            attachments: true
          }
        }
      }
    });

    if (!task) {
      return apiNotFound('任务不存在');
    }

    return apiResponse(task);
  } catch (error) {
    return apiError(
      'SERVER_ERROR',
      '获取任务详情失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 更新任务
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; taskId: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId, taskId } = await params;

  // 检查任务是否存在
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
      projectId
    }
  });

  if (!task) {
    return apiNotFound('任务不存在');
  }

  // 检查用户是否有更新任务的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'task.update',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden('您没有权限更新此任务');
  }

  try {
    const body = await request.json();

    // 验证请求数据
    const validated = updateTaskSchema.parse(body);

    // 更新日期格式
    const updateData: any = { ...validated };

    // 如果提供了dueDate，转换为日期对象
    if (validated.dueDate) {
      updateData.dueDate = new Date(validated.dueDate);
    }

    // 如果提供了completedAt，转换为日期对象
    if (validated.completedAt) {
      updateData.completedAt = new Date(validated.completedAt);
    }

    // 如果状态变为DONE且未设置completedAt，自动设置完成时间
    if (validated.status === 'DONE' && !validated.completedAt) {
      updateData.completedAt = new Date();
    }

    // 如果状态变为非DONE且有completedAt，清除完成时间
    if (validated.status && validated.status !== 'DONE') {
      updateData.completedAt = null;
    }

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

      // 防止循环引用
      if (parentTask.id === taskId) {
        return apiError(
          'INVALID_PARAMETERS',
          '任务不能将自己设为父任务',
          null,
          400
        );
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

    // 更新任务
    const updatedTask = await prisma.task.update({
      where: {
        id: taskId
      },
      data: updateData
    });

    return apiResponse(updatedTask);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(
        'INVALID_PARAMETERS',
        '请求参数无效',
        error.format(),
        400
      );
    }
    return apiError(
      'SERVER_ERROR',
      '更新任务失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 删除任务
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; taskId: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId, taskId } = await params;

  // 检查任务是否存在
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
      projectId
    }
  });

  if (!task) {
    return apiNotFound('任务不存在');
  }

  // 检查用户是否有删除任务的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'task.delete',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden('您没有权限删除此任务');
  }

  try {
    // 检查是否有子任务
    const subtasks = await prisma.task.count({
      where: {
        parentTaskId: taskId
      }
    });

    if (subtasks > 0) {
      return apiError(
        'DELETION_BLOCKED',
        '无法删除含有子任务的任务，请先删除子任务',
        null,
        400
      );
    }

    // 删除任务相关数据
    await prisma.$transaction([
      // 删除任务的评论
      prisma.comment.deleteMany({
        where: { taskId }
      }),
      // 删除任务的附件
      prisma.attachment.deleteMany({
        where: { taskId }
      }),
      // 删除任务的分配
      prisma.taskAssignment.deleteMany({
        where: { taskId }
      }),
      // 删除任务标签关联
      prisma.taskTag.deleteMany({
        where: { taskId }
      }),
      // 删除任务本身
      prisma.task.delete({
        where: { id: taskId }
      })
    ]);

    return apiResponse({ success: true }, null, 200);
  } catch (error) {
    return apiError(
      'SERVER_ERROR',
      '删除任务失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
