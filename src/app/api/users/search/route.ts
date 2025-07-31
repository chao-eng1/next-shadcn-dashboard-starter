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

    if (!query || query.trim().length < 2) {
      return apiResponse([]);
    }

    let whereClause: any = {
      AND: [
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } }
          ]
        },
        { id: { not: user.id } } // 排除当前用户
      ]
    };

    // 如果指定了项目ID，只搜索该项目的成员
    if (projectId) {
      whereClause.AND.push({
        projectMembers: {
          some: {
            projectId: projectId
          }
        }
      });
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        status: true,
        lastActiveAt: true
      },
      take: limit,
      orderBy: [
        { status: 'desc' }, // 在线用户优先
        { name: 'asc' }
      ]
    });
    
    return apiResponse(users);
  } catch (error) {
    console.error('Failed to search users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }