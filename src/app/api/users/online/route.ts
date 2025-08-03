import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiUnauthorized } from '@/lib/api-response';

// 获取用户在线状态列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return apiUnauthorized();
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    let whereClause: any = {
      id: { not: user.id } // 排除当前用户
    };

    // 如果指定了项目ID，只返回该项目的成员
    if (projectId) {
      whereClause.projectMembers = {
        some: {
          projectId: projectId
        }
      };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        onlineStatus: {
          select: {
            isOnline: true,
            lastSeenAt: true
          }
        }
      },
      orderBy: [
        {
          onlineStatus: {
            isOnline: 'desc' // 在线用户优先
          }
        },
        {
          onlineStatus: {
            lastSeenAt: 'desc'
          }
        }
      ]
    });
    
    // 格式化返回数据，添加 status 字段
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      status: user.onlineStatus?.isOnline ? 'online' : 'offline',
      lastActiveAt: user.onlineStatus?.lastSeenAt || null
    }));
    
    return apiResponse(formattedUsers);
  } catch (error) {
    console.error('Failed to get users status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}