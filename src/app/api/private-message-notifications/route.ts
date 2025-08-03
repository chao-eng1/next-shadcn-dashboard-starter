import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { apiResponse, apiError, apiUnauthorized } from '@/lib/api-response';

// 获取私聊消息通知列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized('用户未登录');
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    // 构建查询条件
    const whereCondition: any = {
      userId: user.id
    };

    if (unreadOnly) {
      whereCondition.isRead = false;
    }

    // 获取通知列表
    const notifications = await prisma.privateMessageNotification.findMany({
      where: whereCondition,
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
            },
            conversation: {
              include: {
                project: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // 格式化返回数据
    const formattedNotifications = notifications.map((notification) => ({
      id: notification.id,
      message: {
        id: notification.message.id,
        content: notification.message.content,
        messageType: notification.message.messageType,
        createdAt: notification.message.createdAt,
        sender: notification.message.sender,
        conversation: {
          id: notification.message.conversation.id,
          project: notification.message.conversation.project
        }
      },
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt
    }));

    return apiResponse(formattedNotifications, '获取私聊消息通知成功');
  } catch (error) {
    console.error('获取私聊消息通知失败:', error);
    return apiError('获取私聊消息通知失败');
  }
}

// 标记通知为已读
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized('用户未登录');
    }

    const body = await request.json();
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      // 标记所有通知为已读
      await prisma.privateMessageNotification.updateMany({
        where: {
          userId: user.id,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return apiResponse(null, '所有通知已标记为已读');
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // 标记指定通知为已读
      await prisma.privateMessageNotification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return apiResponse(null, '通知已标记为已读');
    } else {
      return apiError('请提供有效的通知ID或设置markAllAsRead为true');
    }
  } catch (error) {
    console.error('标记通知为已读失败:', error);
    return apiError('标记通知为已读失败');
  }
}
