import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { apiResponse, apiError, apiUnauthorized } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized('请先登录');
    }

    // 批量更新用户的所有未读消息为已读
    const result = await prisma.userMessage.updateMany({
      where: {
        userId: user.id,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return apiResponse({
      message: '所有消息已标记为已读',
      updatedCount: result.count
    });
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    return apiError('MARK_ALL_READ_ERROR', '批量标记已读失败');
  }
}
