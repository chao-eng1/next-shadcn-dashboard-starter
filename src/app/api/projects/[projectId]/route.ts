import { NextRequest, NextResponse } from 'next/server';
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

// 更新项目请求验证
const updateProjectSchema = z.object({
  name: z.string().min(1, '项目名称不能为空').optional(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  visibility: z.enum(['PRIVATE', 'TEAM', 'PUBLIC']).optional()
});

// 获取项目详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId } = await params;

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
    // 获取项目详情
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        members: {
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
        },
        _count: {
          select: {
            tasks: true,
            sprints: true,
            attachments: true,
            documents: true
          }
        }
      }
    });

    if (!project) {
      return apiNotFound('项目不存在');
    }

    return apiResponse(project);
  } catch (error) {
    console.error('获取项目详情失败:', error);
    return apiError(
      'SERVER_ERROR',
      '获取项目详情失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 更新项目
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId } = await params;

  // 检查用户是否有更新项目的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'project.update',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden('您没有权限更新此项目');
  }

  try {
    const body = await request.json();

    // 验证请求数据
    const validated = updateProjectSchema.parse(body);

    // 准备更新数据
    const updateData: any = {};

    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.description !== undefined)
      updateData.description = validated.description;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.visibility !== undefined)
      updateData.visibility = validated.visibility;

    // 处理日期
    if (validated.startDate !== undefined) {
      updateData.startDate = validated.startDate
        ? new Date(validated.startDate)
        : null;
    }

    if (validated.endDate !== undefined) {
      updateData.endDate = validated.endDate
        ? new Date(validated.endDate)
        : null;
    }

    // 更新项目
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData
    });

    return apiResponse(updatedProject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(
        'INVALID_PARAMETERS',
        '请求参数无效',
        error.format(),
        400
      );
    }

    console.error('更新项目失败:', error);
    return apiError(
      'SERVER_ERROR',
      '更新项目失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 删除项目
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId } = await params;

  // 检查用户是否有删除项目的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'project.delete',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden('您没有权限删除此项目');
  }

  try {
    // 删除项目
    await prisma.project.delete({
      where: { id: projectId }
    });

    return apiResponse({ success: true, message: '项目已成功删除' });
  } catch (error) {
    console.error('删除项目失败:', error);
    return apiError(
      'SERVER_ERROR',
      '删除项目失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
