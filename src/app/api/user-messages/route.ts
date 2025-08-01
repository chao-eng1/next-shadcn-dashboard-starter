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

    // 获取用户的消息
    const userMessages = await prisma.userMessage.findMany({
      where: {
        userId: user.id
      },
      include: {
        message: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        message: {
          createdAt: 'desc'
        }
      }
    });

    return apiResponse({
      messages: userMessages
    });
  } catch (error) {
    console.error('Error fetching user messages:', error);
    return apiError('FETCH_MESSAGES_ERROR', '获取消息失败');
  }
}