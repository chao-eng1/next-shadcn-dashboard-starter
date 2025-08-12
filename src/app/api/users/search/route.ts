import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiUnauthorized } from '@/lib/api-response';

// 搜索用户
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiUnauthorized();
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 如果有projectId但没有查询词，返回项目成员
    if (projectId && (!query || query.trim().length < 2)) {
      const projectMembers = await prisma.user.findMany({
        where: {
          projectMemberships: {
            some: {
              projectId: projectId
            }
          }
        },
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
        take: limit,
        orderBy: [{ name: 'asc' }]
      });

      return apiResponse(projectMembers);
    }

    // 如果没有查询词且没有项目ID，返回空数组
    if (!query || query.trim().length < 2) {
      return apiResponse([]);
    }

    let whereClause: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } }
      ]
    };

    // 如果指定了项目ID，只搜索该项目的成员
    if (projectId) {
      whereClause = {
        AND: [
          whereClause,
          {
            projectMemberships: {
              some: {
                projectId: projectId
              }
            }
          }
        ]
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
      take: limit,
      orderBy: [{ name: 'asc' }]
    });

    return apiResponse(users);
  } catch (error) {
    console.error('Failed to search users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
