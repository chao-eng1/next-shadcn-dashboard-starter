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

// 添加成员请求验证
const addMemberSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER')
});

// 获取项目成员列表
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

  try {
    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return apiNotFound('项目不存在');
    }

    // 获取项目成员
    const members = await prisma.projectMember.findMany({
      where: { projectId },
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
      orderBy: [
        // 首先按角色排序：所有者 > 管理员 > 成员 > 观察者
        {
          role: 'asc'
        },
        // 然后按加入时间排序
        {
          joinedAt: 'asc'
        }
      ]
    });

    return apiResponse(members);
  } catch (error) {
    console.error('获取项目成员列表失败:', error);
    return apiError(
      'SERVER_ERROR',
      '获取项目成员列表失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 添加项目成员
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const projectId = params.projectId;

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
    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    });

    if (!project) {
      return apiNotFound('项目不存在');
    }

    const body = await request.json();

    // 验证请求数据
    const validated = addMemberSchema.parse(body);

    // 查找用户是否存在
    const targetUser = await prisma.user.findUnique({
      where: { email: validated.email }
    });

    if (!targetUser) {
      return apiError(
        'USER_NOT_FOUND',
        '该邮箱地址对应的用户不存在，请先确保用户已注册',
        null,
        404
      );
    }

    // 检查用户是否已经是项目成员
    const isAlreadyMember = project.members.some(
      (member) => member.user.id === targetUser.id
    );

    if (isAlreadyMember) {
      return apiError('ALREADY_MEMBER', '该用户已经是项目成员', null, 400);
    }

    // 添加成员
    const member = await prisma.projectMember.create({
      data: {
        role: validated.role,
        userId: targetUser.id,
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

    return apiResponse(member, null, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(
        'INVALID_PARAMETERS',
        '请求参数无效',
        error.format(),
        400
      );
    }

    console.error('添加项目成员失败:', error);
    return apiError(
      'SERVER_ERROR',
      '添加项目成员失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
