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

    // 1. 获取系统消息
    const systemMessages = await prisma.userMessage.findMany({
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
      take: Math.ceil(limit / 2) // 系统消息占一半
    });

    // 2. 获取项目群聊未读消息
    const projectMessages = await prisma.projectMessage.findMany({
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
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        chat: {
          include: {
            project: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: Math.ceil(limit / 3) // 项目消息占一部分
    });

    // 3. 获取私聊未读消息
    const privateMessages = await prisma.privateMessage.findMany({
      where: {
        isDeleted: false,
        receiverId: user.id,
        isRead: false
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: Math.ceil(limit / 3) // 私聊消息占一部分
    });

    // 格式化系统消息
    const formattedSystemMessages = systemMessages.map((userMessage) => ({
      id: userMessage.message.id,
      content: userMessage.message.content,
      messageType: 'system',
      createdAt: userMessage.message.createdAt,
      sender: {
        id: userMessage.message.sender.id,
        name: userMessage.message.sender.name,
        email: userMessage.message.sender.email,
        image: userMessage.message.sender.image
      },
      preview:
        userMessage.message.content.length > 50
          ? userMessage.message.content.substring(0, 50) + '...'
          : userMessage.message.content,
      source: '系统消息'
    }));

    // 格式化项目群聊消息
    const formattedProjectMessages = projectMessages.map((projectMessage) => ({
      id: projectMessage.id,
      content: projectMessage.content,
      messageType: 'project',
      createdAt: projectMessage.createdAt,
      sender: {
        id: projectMessage.sender.id,
        name: projectMessage.sender.name,
        email: projectMessage.sender.email,
        image: projectMessage.sender.image
      },
      preview:
        projectMessage.content.length > 50
          ? projectMessage.content.substring(0, 50) + '...'
          : projectMessage.content,
      source: `项目：${projectMessage.chat.project.name}`
    }));

    // 格式化私聊消息
    const formattedPrivateMessages = privateMessages.map((privateMessage) => ({
      id: privateMessage.id,
      content: privateMessage.content,
      messageType: 'private',
      createdAt: privateMessage.createdAt,
      sender: {
        id: privateMessage.sender.id,
        name: privateMessage.sender.name,
        email: privateMessage.sender.email,
        image: privateMessage.sender.image
      },
      preview:
        privateMessage.content.length > 50
          ? privateMessage.content.substring(0, 50) + '...'
          : privateMessage.content,
      source: '私聊消息'
    }));

    // 合并所有消息并按时间排序
    const allMessages = [
      ...formattedSystemMessages,
      ...formattedProjectMessages,
      ...formattedPrivateMessages
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit); // 限制总数量

    return apiResponse({
      messages: allMessages,
      total: allMessages.length,
      breakdown: {
        system: formattedSystemMessages.length,
        project: formattedProjectMessages.length,
        private: formattedPrivateMessages.length
      }
    });
  } catch (error) {
    console.error('Error fetching recent messages:', error);
    return apiError('FETCH_RECENT_MESSAGES_ERROR', '获取最近消息失败');
  }
}
