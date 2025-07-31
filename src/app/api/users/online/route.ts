import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiUnauthorized } from '@/lib/api-response';

// 获取在线用户列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return apiUnauthorized();
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    let whereClause: any = {
      status: 'online',
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

    const onlineUsers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        status: true,
        lastActiveAt: true
      },
      orderBy: {
        lastActiveAt: 'desc'
      }
    });
    
    return apiResponse(onlineUsers);
  } catch (error) {
    console.error('Failed to get online users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}