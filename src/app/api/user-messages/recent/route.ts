import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { apiResponse, apiError, apiUnauthorized } from '@/lib/api-response';

// 获取最近的未读消息（用于通知下拉菜单）
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized('请先登录');
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    // 获取最近的未读消息
    const recentMessages = await prisma.userMessage.findMany({
      where: {
        userId: user.id,
        isRead: false
      },
      include: {
        message: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        message: {
          createdAt: 'desc'
        }
      },
      take: limit
    });

    // 格式化消息数据
    const formattedMessages = recentMessages.map(userMessage => ({
      id: userMessage.message.id,
      content: userMessage.message.content,
      messageType: userMessage.message.messageType,
      createdAt: userMessage.message.createdAt,
      sender: {
        id: userMessage.message.sender.id,
        name: userMessage.message.sender.name,
        email: userMessage.message.sender.email,
        image: userMessage.message.sender.image
      },
      // 截取内容预览（最多50字符）
      preview: userMessage.message.content.length > 50 
        ? userMessage.message.content.substring(0, 50) + '...' 
        : userMessage.message.content
    }));

    return apiResponse({
      messages: formattedMessages,
      total: recentMessages.length
    });
  } catch (error) {
    console.error('Error fetching recent messages:', error);
    return apiError('FETCH_RECENT_MESSAGES_ERROR', '获取最近消息失败');
  }
}