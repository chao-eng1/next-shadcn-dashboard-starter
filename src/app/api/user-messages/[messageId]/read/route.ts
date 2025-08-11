import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  apiResponse,
  apiError,
  apiUnauthorized,
  apiNotFound
} from '@/lib/api-response';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized('请先登录');
    }

    const { messageId } = await params;

    // 查找用户消息记录
    const userMessage = await prisma.userMessage.findFirst({
      where: {
        id: messageId,
        userId: user.id
      }
    });

    if (!userMessage) {
      return apiNotFound('消息不存在');
    }

    // 如果已经是已读状态，直接返回
    if (userMessage.isRead) {
      return apiResponse.success({ message: '消息已经是已读状态' });
    }

    // 更新为已读状态
    await prisma.userMessage.update({
      where: {
        id: messageId
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return apiResponse({ message: '消息已标记为已读' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return apiError('MARK_READ_ERROR', '标记已读失败');
  }
}
