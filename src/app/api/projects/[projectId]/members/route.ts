import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { apiResponse, apiError, apiUnauthorized, apiForbidden } from '@/lib/api-response';

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

    const { projectId } = params;
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
        },
        role: {
          select: {
            id: true,
            name: true,
            color: true
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
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      image: member.user.image,
      role: member.role,
      joinedAt: member.joinedAt,
      isOnline: false, // 这里可以后续集成在线状态
      lastSeen: null // 这里可以后续集成最后在线时间
    }));

    return apiResponse(formattedMembers, '获取项目成员列表成功');
  } catch (error) {
    console.error('获取项目成员列表失败:', error);
    return apiError('获取项目成员列表失败');
  }
}