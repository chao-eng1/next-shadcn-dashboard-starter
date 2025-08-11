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

// 迭代更新请求验证
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const updateSprintSchema = z.object({
  name: z.string().min(1, '迭代名称不能为空').optional(),
  description: z.string().optional(),
  status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  goal: z.string().optional()
});

// 获取单个迭代详情
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; sprintId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId, sprintId } = await params;

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
    // 获取迭代详情
    const sprint = await prisma.sprint.findUnique({
      where: {
        id: sprintId,
        projectId
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
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
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            tasks: true
          }
        }
      }
    });

    if (!sprint) {
      return apiNotFound('迭代不存在');
    }

    return apiResponse(sprint);
  } catch (error) {
    return apiError(
      'SERVER_ERROR',
      '获取迭代详情失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 更新迭代
export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string; sprintId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId, sprintId } = await params;

  // 检查迭代是否存在
  const sprint = await prisma.sprint.findUnique({
    where: {
      id: sprintId,
      projectId
    }
  });

  if (!sprint) {
    return apiNotFound('迭代不存在');
  }

  // 检查用户是否有更新迭代的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'sprint.update',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden('您没有权限更新此迭代');
  }

  try {
    const body = await request.json();

    // 验证请求数据
    const validated = updateSprintSchema.parse(body);

    // 如果将迭代设为活动状态，检查是否已有活动迭代
    if (validated.status === 'ACTIVE' && sprint.status !== 'ACTIVE') {
      const activeSprintExists = await prisma.sprint.findFirst({
        where: {
          projectId,
          status: 'ACTIVE',
          id: { not: sprintId }
        }
      });

      if (activeSprintExists) {
        return apiError(
          'ACTIVE_SPRINT_EXISTS',
          '项目中已存在活动迭代，请先完成或取消现有活动迭代',
          null,
          400
        );
      }
    }

    // 更新日期格式
    const updateData: any = { ...validated };

    // 如果提供了startDate，转换为日期对象
    if (validated.startDate) {
      updateData.startDate = new Date(validated.startDate);
    }

    // 如果提供了endDate，转换为日期对象
    if (validated.endDate) {
      updateData.endDate = new Date(validated.endDate);
    }

    // 更新迭代
    const updatedSprint = await prisma.sprint.update({
      where: {
        id: sprintId
      },
      data: updateData
    });

    return apiResponse(updatedSprint);
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
      '更新迭代失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 删除迭代
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; sprintId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId, sprintId } = await params;

  // 检查迭代是否存在
  const sprint = await prisma.sprint.findUnique({
    where: {
      id: sprintId,
      projectId
    }
  });

  if (!sprint) {
    return apiNotFound('迭代不存在');
  }

  // 检查用户是否有删除迭代的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'sprint.delete',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden('您没有权限删除此迭代');
  }

  try {
    // 检查迭代是否关联了任务
    const tasksCount = await prisma.task.count({
      where: {
        sprintId
      }
    });

    if (tasksCount > 0) {
      return apiError(
        'SPRINT_HAS_TASKS',
        '此迭代包含任务，无法删除。请先将任务移出迭代或删除任务。',
        null,
        400
      );
    }

    // 删除迭代
    await prisma.sprint.delete({
      where: { id: sprintId }
    });

    return apiResponse({ success: true }, null, 200);
  } catch (error) {
    return apiError(
      'SERVER_ERROR',
      '删除迭代失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
