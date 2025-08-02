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

// 更新项目成员角色请求验证
const updateMemberSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER'])
});

// 获取项目成员详情
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; memberId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId, memberId } = await params;

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
    // 获取项目成员
    const member = await prisma.projectMember.findUnique({
      where: {
        id: memberId,
        projectId
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

    if (!member) {
      return apiNotFound('项目成员不存在');
    }

    return apiResponse(member);
  } catch (error) {
    console.error('获取项目成员详情失败:', error);
    return apiError(
      'SERVER_ERROR',
      '获取项目成员详情失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 更新项目成员角色
export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string; memberId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId, memberId } = await params;

  // 检查用户是否有管理项目成员的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'project.members.manage',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden('您没有权限管理此项目的成员');
  }

  try {
    // 获取要更新的成员
    const member = await prisma.projectMember.findUnique({
      where: {
        id: memberId,
        projectId
      }
    });

    if (!member) {
      return apiNotFound('项目成员不存在');
    }

    // 不能更改项目所有者的角色
    if (member.role === 'OWNER') {
      return apiForbidden('不能更改项目所有者的角色');
    }

    const body = await request.json();
    const validated = updateMemberSchema.parse(body);

    // 更新成员角色
    const updatedMember = await prisma.projectMember.update({
      where: {
        id: memberId
      },
      data: {
        role: validated.role
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

    return apiResponse(updatedMember);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(
        'INVALID_PARAMETERS',
        '请求参数无效',
        error.format(),
        400
      );
    }

    console.error('更新项目成员角色失败:', error);
    return apiError(
      'SERVER_ERROR',
      '更新项目成员角色失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 移除项目成员
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; memberId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId, memberId } = await params;

  // 检查用户是否有管理项目成员的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'project.members.manage',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden('您没有权限管理此项目的成员');
  }

  try {
    // 获取要删除的成员
    const member = await prisma.projectMember.findUnique({
      where: {
        id: memberId,
        projectId
      }
    });

    if (!member) {
      return apiNotFound('项目成员不存在');
    }

    // 不能移除项目所有者
    if (member.role === 'OWNER') {
      return apiForbidden('不能移除项目所有者');
    }

    // 不能移除自己
    if (member.userId === user.id) {
      return apiForbidden('不能移除自己');
    }

    // 删除成员
    await prisma.projectMember.delete({
      where: {
        id: memberId
      }
    });

    return apiResponse({ success: true, message: '项目成员已移除' });
  } catch (error) {
    console.error('移除项目成员失败:', error);
    return apiError(
      'SERVER_ERROR',
      '移除项目成员失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
