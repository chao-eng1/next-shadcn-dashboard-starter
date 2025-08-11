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

// 创建评论请求验证
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, '评论内容不能为空')
    .max(1000, '评论内容不能超过1000个字符')
});

// 获取任务评论
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; taskId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId, taskId } = await params;

  // 检查用户是否有查看评论的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'comment.view',
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

    // 获取任务的评论
    const comments = await prisma.comment.findMany({
      where: {
        taskId
      },
      include: {
        user: {
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
    });

    return apiResponse(comments);
  } catch (error) {
    return apiError(
      'SERVER_ERROR',
      '获取评论失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 创建评论
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string; taskId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId, taskId } = await params;

  // 检查用户是否有评论权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'comment.create',
    user.id
  );

  // 如果没有特定的评论权限，检查是否有查看项目的权限
  if (!hasPermission) {
    const canViewProject = await hasProjectPermission(
      projectId,
      'project.view',
      user.id
    );

    if (!canViewProject) {
      return apiForbidden('您没有权限在此项目中添加评论');
    }
  }

  try {
    const body = await request.json();

    // 验证请求数据
    const validated = createCommentSchema.parse(body);

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

    // 创建评论
    const comment = await prisma.comment.create({
      data: {
        content: validated.content,
        taskId,
        userId: user.id
      },
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
    });

    return apiResponse(comment, null, 201);
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
      '创建评论失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
