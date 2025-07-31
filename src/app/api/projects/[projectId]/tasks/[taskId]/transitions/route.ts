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

// 任务状态更新和分配请求验证
const taskStatusUpdateSchema = z.object({
  toStatus: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']),
  comment: z.string().optional(),
  assignToId: z.string().optional() // 可选的重新分配
});

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string; taskId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  // In Next.js 15, dynamic route params must be awaited
  const paramsData = await params;
  const projectId = paramsData.projectId;
  const taskId = paramsData.taskId;

  // 检查任务是否存在
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
      projectId
    },
    include: {
      assignments: {
        include: {
          member: true
        }
      }
    }
  });

  if (!task) {
    return apiNotFound('任务不存在');
  }

  // 检查用户是否有更新任务状态的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'task.status.update',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden('您没有权限更新此任务状态');
  }

  try {
    const body = await request.json();
    const validated = taskStatusUpdateSchema.parse(body);

    // 记录原始状态
    const fromStatus = task.status;
    const fromAssigneeIds = task.assignments.map((a) => a.member.userId);

    // 变更摘要
    const changes: Record<string, any> = {};

    if (fromStatus !== validated.toStatus) {
      changes.status = {
        from: fromStatus,
        to: validated.toStatus
      };
    }

    // 更新任务状态
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: validated.toStatus,
        // 如果状态变为DONE且未设置completedAt，自动设置完成时间
        completedAt:
          validated.toStatus === 'DONE'
            ? new Date()
            : validated.toStatus !== 'DONE'
              ? null
              : undefined
      }
    });

    // 处理分配更改
    let toAssigneeId = null;
    if (validated.assignToId) {
      // 检查成员是否存在并属于此项目
      const memberToAssign = await prisma.projectMember.findFirst({
        where: {
          userId: validated.assignToId,
          projectId
        }
      });

      if (memberToAssign) {
        // 删除所有现有分配
        await prisma.taskAssignment.deleteMany({
          where: { taskId }
        });

        // 创建新分配
        await prisma.taskAssignment.create({
          data: {
            taskId,
            memberId: memberToAssign.id
          }
        });

        toAssigneeId = validated.assignToId;
        changes.assignee = {
          from: fromAssigneeIds,
          to: [validated.assignToId]
        };
      }
    }

    // 创建历史记录
    await prisma.taskHistory.create({
      data: {
        taskId,
        performedById: user.id,
        fromStatus,
        toStatus: validated.toStatus,
        fromAssigneeId: fromAssigneeIds.length > 0 ? fromAssigneeIds[0] : null,
        toAssigneeId,
        changeSummary: JSON.stringify(changes),
        comment: validated.comment
      }
    });

    return apiResponse({
      task: updatedTask,
      message: `任务状态已更新为 ${validated.toStatus === 'TODO' ? '待办' : validated.toStatus === 'IN_PROGRESS' ? '进行中' : validated.toStatus === 'REVIEW' ? '待审核' : validated.toStatus === 'DONE' ? '已完成' : '受阻'}`
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

    console.error('更新任务状态失败:', error);
    return apiError(
      'SERVER_ERROR',
      '更新任务状态失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
