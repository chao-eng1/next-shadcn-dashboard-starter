// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  apiResponse,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiForbidden
} from '@/lib/api-response';
import { getBroadcastService } from '@/lib/socket-broadcast';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { z } from 'zod';

// 发送私聊消息的请求schema
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, '消息内容不能为空')
    .max(2000, '消息内容不能超过2000字符'),
  messageType: z.enum(['TEXT', 'IMAGE', 'FILE']).default('TEXT'),
  replyToId: z.string().optional()
});

// 获取私聊消息列表
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; conversationId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized('用户未登录');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { projectId, conversationId } = await params;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { searchParams } = new URL(request.url);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const page = parseInt(searchParams.get('page') || '1');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // 检查会话是否存在且用户有权限访问
    const conversation = await prisma.privateConversation.findFirst({
      where: {
        id: conversationId,
        projectId,
        OR: [{ participant1Id: user.id }, { participant2Id: user.id }]
      }
    });

    if (!conversation) {
      return apiNotFound('私聊会话不存在或无权限访问');
    }

    // 获取消息列表
    const messages = await prisma.privateMessage.findMany({
      where: {
        conversationId,
        isDeleted: false
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
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        replyTo: {
          include: {
            sender: {
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
      skip: offset,
      take: limit
    });

    // 标记消息为已读（只标记接收到的消息）
    const unreadMessageIds = messages
      .filter((msg) => msg.receiverId === user.id && !msg.isRead)
      .map((msg) => msg.id);

    if (unreadMessageIds.length > 0) {
      await prisma.privateMessage.updateMany({
        where: {
          id: { in: unreadMessageIds }
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    }

    // 获取总消息数
    const total = await prisma.privateMessage.count({
      where: {
        conversationId,
        isDeleted: false
      }
    });

    return apiResponse(
      {
        messages: messages.reverse(), // 反转顺序，最新消息在底部
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      },
      '获取私聊消息成功'
    );
  } catch (error) {
    return apiError('获取私聊消息失败');
  }
}

// 发送私聊消息
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string; conversationId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized('用户未登录');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { projectId, conversationId } = await params;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const body = await request.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { content, messageType, replyToId } = sendMessageSchema.parse(body);

    // 检查会话是否存在且用户有权限访问
    const conversation = await prisma.privateConversation.findFirst({
      where: {
        id: conversationId,
        projectId,
        OR: [{ participant1Id: user.id }, { participant2Id: user.id }]
      }
    });

    if (!conversation) {
      return apiNotFound('私聊会话不存在或无权限访问');
    }

    // 确定接收者
    const receiverId =
      conversation.participant1Id === user.id
        ? conversation.participant2Id
        : conversation.participant1Id;

    // 如果是回复消息，检查被回复的消息是否存在
    if (replyToId) {
      const replyToMessage = await prisma.privateMessage.findFirst({
        where: {
          id: replyToId,
          conversationId
        }
      });

      if (!replyToMessage) {
        return apiNotFound('被回复的消息不存在');
      }
    }

    // 创建消息
    const message = await prisma.privateMessage.create({
      data: {
        content,
        messageType,
        conversationId,
        senderId: user.id,
        receiverId,
        replyToId
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
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // 更新会话的最后消息时间
    await prisma.privateConversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    // 创建消息通知（给接收者）
    await prisma.privateMessageNotification.create({
      data: {
        messageId: message.id,
        userId: receiverId
      }
    });

    // 格式化消息响应
    const formattedMessage = {
      id: message.id,
      conversationId: conversationId,
      senderId: message.senderId,
      senderName: message.sender.name,
      senderImage: message.sender.image,
      receiverId: message.receiverId,
      receiverName: message.receiver.name,
      content: message.content,
      messageType: message.messageType.toLowerCase(),
      replyToId: message.replyToId,
      replyTo: message.replyTo
        ? {
            id: message.replyTo.id,
            content: message.replyTo.content,
            senderName: message.replyTo.sender.name
          }
        : null,
      status: 'sent',
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString()
    };

    // 通过Socket.io广播私聊消息
    try {
      const broadcastService = getBroadcastService();

      broadcastService.broadcastMessage({
        conversationId,
        type: 'private',
        message: formattedMessage,
        excludeUserId: user.id // 排除发送者自己
      });
    } catch (broadcastError) {
      // 广播失败不影响消息发送成功
    }

    return apiResponse(formattedMessage, '发送私聊消息成功');
  } catch (error) {
    return apiError('发送私聊消息失败');
  }
}
