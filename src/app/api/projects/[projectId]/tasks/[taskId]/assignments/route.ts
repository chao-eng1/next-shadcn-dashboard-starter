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

// 创建任务分配请求验证
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createTaskAssignmentSchema = z.object({
  memberId: z.string().min(1, '项目成员ID不能为空')
});

// 获取任务分配列表
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; taskId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId, taskId } = params;

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

    // 获取任务分配
    const assignments = await prisma.taskAssignment.findMany({
      where: {
        taskId
      },
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
    });

    return apiResponse(assignments);
  } catch (error) {
    return apiError(
      'SERVER_ERROR',
      '获取任务分配失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 创建任务分配
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string; taskId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId, taskId } = params;

  // 检查用户是否有任务分配权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'task.update',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden('您没有权限分配任务');
  }

  try {
    const body = await request.json();

    // 验证请求数据
    const validated = createTaskAssignmentSchema.parse(body);

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

    // 检查成员是否存在并属于此项目
    const member = await prisma.projectMember.findUnique({
      where: {
        id: validated.memberId,
        projectId
      }
    });

    if (!member) {
      return apiNotFound('项目成员不存在或不属于此项目');
    }

    // 检查是否已存在相同的分配
    const existingAssignment = await prisma.taskAssignment.findUnique({
      where: {
        taskId_memberId: {
          taskId,
          memberId: validated.memberId
        }
      }
    });

    if (existingAssignment) {
      return apiError('ALREADY_EXISTS', '该成员已被分配此任务', null, 400);
    }

    // 创建任务分配
    const assignment = await prisma.taskAssignment.create({
      data: {
        taskId,
        memberId: validated.memberId
      },
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
    });

    return apiResponse(assignment, null, 201);
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
      '创建任务分配失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 删除任务分配
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; taskId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId, taskId } = params;
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get('memberId');

  if (!memberId) {
    return apiError('INVALID_PARAMETERS', '缺少成员ID参数', null, 400);
  }

  // 检查用户是否有任务分配权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'task.update',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden('您没有权限管理任务分配');
  }

  try {
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

    // 检查成员是否存在并属于此项目
    const member = await prisma.projectMember.findUnique({
      where: {
        id: memberId,
        projectId
      }
    });

    if (!member) {
      return apiNotFound('项目成员不存在或不属于此项目');
    }

    // 检查分配是否存在
    const assignment = await prisma.taskAssignment.findUnique({
      where: {
        taskId_memberId: {
          taskId,
          memberId
        }
      }
    });

    if (!assignment) {
      return apiNotFound('该任务分配不存在');
    }

    // 删除任务分配
    await prisma.taskAssignment.delete({
      where: {
        taskId_memberId: {
          taskId,
          memberId
        }
      }
    });

    return apiResponse({ success: true });
  } catch (error) {
    return apiError(
      'SERVER_ERROR',
      '删除任务分配失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
