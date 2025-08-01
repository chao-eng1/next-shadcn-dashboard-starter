import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { apiResponse, apiError, apiUnauthorized } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized('请先登录');
    }

    // 获取用户未读消息数量
    const unreadCount = await prisma.userMessage.count({
      where: {
        userId: user.id,
        isRead: false
      }
    });

    return apiResponse({
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return apiError('FETCH_UNREAD_COUNT_ERROR', '获取未读消息数量失败');
  }
}