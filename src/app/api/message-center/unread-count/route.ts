// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { apiResponse, apiUnauthorized } from '@/lib/api-response';

// 获取用户的总未读消息数量
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiUnauthorized();
    }

    // 1. 系统消息未读数
    const systemUnreadCount = await prisma.userMessage.count({
      where: {
        userId: user.id,
        isRead: false
      }
    });

    // 2. 项目群聊未读数
    const projectUnreadCount = await prisma.projectMessage.count({
      where: {
        isDeleted: false,
        senderId: { not: user.id }, // 排除自己发送的消息
        chat: {
          project: {
            members: {
              some: {
                userId: user.id
              }
            }
          }
        },
        readBy: {
          none: {
            userId: user.id
          }
        }
      }
    });

    // 3. 私聊未读数
    const privateUnreadCount = await prisma.privateMessage.count({
      where: {
        isDeleted: false,
        receiverId: user.id,
        isRead: false
      }
    });

    const totalUnreadCount =
      systemUnreadCount + projectUnreadCount + privateUnreadCount;

    return apiResponse({
      total: totalUnreadCount,
      breakdown: {
        system: systemUnreadCount,
        project: projectUnreadCount,
        private: privateUnreadCount
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
