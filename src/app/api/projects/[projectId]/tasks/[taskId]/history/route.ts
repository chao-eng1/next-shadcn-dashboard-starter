import { NextRequest } from 'next/server';
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

export async function GET(
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

  // 检查用户是否有查看项目的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'project.view',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden('您没有权限查看此项目');
  }

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

  try {
    // 获取任务历史记录
    const history = await prisma.taskHistory.findMany({
      where: { taskId },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return apiResponse(history);
  } catch (error) {
    return apiError(
      'SERVER_ERROR',
      '获取任务历史失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
