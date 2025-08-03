import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiUnauthorized, apiValidationError } from '@/lib/api-response';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['online', 'away', 'offline'])
});

// 更新用户状态
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const validation = updateStatusSchema.safeParse(body);
    
    if (!validation.success) {
      return apiValidationError(validation.error.errors);
    }

    const { status } = validation.data;

    // 更新或创建用户在线状态
    const onlineStatus = await prisma.userOnlineStatus.upsert({
      where: { userId: user.id },
      update: {
        isOnline: status === 'online',
        lastSeenAt: new Date()
      },
      create: {
        userId: user.id,
        isOnline: status === 'online',
        lastSeenAt: new Date()
      }
    });

    // 获取用户信息和在线状态
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
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
      }
    });
    
    return apiResponse({
      ...updatedUser,
      status: onlineStatus.isOnline ? 'online' : 'offline',
      lastActiveAt: onlineStatus.lastSeenAt
    });
  } catch (error) {
    console.error('Failed to update user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 获取用户状态
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return apiUnauthorized();
    }

    const userStatus = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        onlineStatus: {
          select: {
            isOnline: true,
            lastSeenAt: true
          }
        }
      }
    });
    
    return apiResponse({
      id: userStatus?.id,
      status: userStatus?.onlineStatus?.isOnline ? 'online' : 'offline',
      lastActiveAt: userStatus?.onlineStatus?.lastSeenAt || null
    });
  } catch (error) {
    console.error('Failed to get user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}