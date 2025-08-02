import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { apiResponse, apiError, apiUnauthorized, apiForbidden, apiBadRequest } from '@/lib/api-response';

// 获取项目成员列表
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized('用户未登录');
    }

    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const excludeSelf = searchParams.get('excludeSelf') === 'true';

    // 检查用户是否是项目成员
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: user.id
      }
    });

    if (!projectMember) {
      return apiForbidden('您不是该项目的成员');
    }

    // 构建查询条件
    const whereCondition: any = {
      projectId
    };

    // 排除自己
    if (excludeSelf) {
      whereCondition.userId = {
        not: user.id
      };
    }

    // 搜索条件
    if (search) {
      whereCondition.user = {
        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ]
      };
    }

    // 获取项目成员列表
    const members = await prisma.projectMember.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        {
          user: {
            name: 'asc'
          }
        }
      ]
    });

    // 格式化返回数据
    const formattedMembers = members.map(member => ({
      id: member.id,
      role: member.role, // enum值
      joinedAt: member.joinedAt,
      user: {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        image: member.user.image,
        createdAt: member.user.createdAt
      },
      isOnline: false, // 这里可以后续集成在线状态
      lastSeen: null // 这里可以后续集成最后在线时间
    }));

    return apiResponse(formattedMembers, '获取项目成员列表成功');
  } catch (error) {
    console.error('获取项目成员列表失败:', error);
    return apiError('获取项目成员列表失败');
  }
}

// 添加项目成员
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized('用户未登录');
    }

    const { projectId } = await params;
    const body = await request.json();
    const { email, role = 'MEMBER' } = body;

    // 验证输入
    if (!email) {
      return apiBadRequest('邮箱地址不能为空');
    }

    if (!['ADMIN', 'MEMBER', 'VIEWER'].includes(role)) {
      return apiBadRequest('无效的角色类型');
    }

    // 检查用户是否有权限添加成员
    const currentMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: user.id
      }
    });

    if (!currentMember || !['OWNER', 'ADMIN'].includes(currentMember.role)) {
      return apiForbidden('您没有权限添加成员');
    }

    // 查找要添加的用户
    const targetUser = await prisma.user.findUnique({
      where: { email }
    });

    if (!targetUser) {
      return apiBadRequest('用户不存在');
    }

    // 检查用户是否已经是项目成员
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: targetUser.id
      }
    });

    if (existingMember) {
      return apiBadRequest('用户已经是项目成员');
    }

    // 添加成员
    const newMember = await prisma.projectMember.create({
      data: {
        projectId,
        userId: targetUser.id,
        role: role as any // TypeScript类型转换
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true
          }
        }
      }
    });

    // 格式化返回数据
    const formattedMember = {
      id: newMember.id,
      role: newMember.role,
      joinedAt: newMember.joinedAt,
      user: {
        id: newMember.user.id,
        name: newMember.user.name,
        email: newMember.user.email,
        image: newMember.user.image,
        createdAt: newMember.user.createdAt
      },
      isOnline: false,
      lastSeen: null
    };

    return apiResponse(formattedMember, '成员添加成功');
  } catch (error) {
    console.error('添加项目成员失败:', error);
    return apiError('添加项目成员失败');
  }
}