import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import {
  apiResponse,
  apiUnauthorized,
  apiBadRequest
} from '@/lib/api-response';
import { getBroadcastService } from '@/lib/socket-broadcast';
import { z } from 'zod';

const sendMessageSchema = z.object({
  content: z.string().min(1),
  messageType: z.enum(['text', 'image', 'file', 'system']).default('text'),
  replyToId: z.string().optional()
});

// 获取会话消息
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiUnauthorized();
    }

    const conversationId = (await params).conversationId;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const since = searchParams.get('since'); // 新增since参数
    const offset = (page - 1) * limit;

    // 首先确定会话类型
    const projectChat = await prisma.projectChat.findUnique({
      where: { id: conversationId },
      include: {
        project: {
          include: {
            members: {
              where: { userId: user.id },
              take: 1
            }
          }
        }
      }
    });

    const privateConversation = await prisma.privateConversation.findUnique({
      where: { id: conversationId },
      include: {
        project: {
          include: {
            members: {
              where: { userId: user.id },
              take: 1
            }
          }
        }
      }
    });

    // 验证用户权限
    const hasAccess =
      projectChat?.project.members.length > 0 ||
      (privateConversation &&
        (privateConversation.participant1Id === user.id ||
          privateConversation.participant2Id === user.id));

    if (!hasAccess) {
      return NextResponse.json({ error: '无权访问此会话' }, { status: 403 });
    }

    let messages: any[] = [];

    if (projectChat) {
      // 获取项目群聊消息
      const whereClause: any = {
        chatId: conversationId,
        isDeleted: false
      };

      // 如果有since参数，只获取该时间之后的消息
      if (since) {
        whereClause.createdAt = {
          gt: new Date(since)
        };
      }

      messages = await prisma.projectMessage.findMany({
        where: whereClause,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          replyTo: {
            select: {
              id: true,
              content: true,
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
          createdAt: since ? 'asc' : 'desc' // since模式按时间正序，普通模式按时间倒序
        },
        skip: since ? 0 : offset, // since模式不分页
        take: since ? undefined : limit // since模式不限制数量
      });
    } else if (privateConversation) {
      // 获取私聊消息
      const whereClause: any = {
        conversationId: conversationId,
        isDeleted: false
      };

      // 如果有since参数，只获取该时间之后的消息
      if (since) {
        whereClause.createdAt = {
          gt: new Date(since)
        };
      }

      messages = await prisma.privateMessage.findMany({
        where: whereClause,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          replyTo: {
            select: {
              id: true,
              content: true,
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
          createdAt: since ? 'asc' : 'desc' // since模式按时间正序，普通模式按时间倒序
        },
        skip: since ? 0 : offset, // since模式不分页
        take: since ? undefined : limit // since模式不限制数量
      });
    }

    // 转换消息格式
    const formattedMessages = (since ? messages : messages.reverse()).map(
      (message) => ({
        id: message.id,
        conversationId: conversationId,
        senderId: message.senderId,
        senderName: message.sender.name,
        senderImage: message.sender.image,
        content: message.content,
        messageType: message.messageType.toLowerCase(), // 转换回小写以保持前端一致性
        replyToId: message.replyToId,
        replyTo: message.replyTo
          ? {
              id: message.replyTo.id,
              content: message.replyTo.content,
              senderId: message.replyTo.sender.id,
              senderName: message.replyTo.sender.name
            }
          : undefined,
        status: 'delivered',
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString()
      })
    );

    const totalCount = projectChat
      ? await prisma.projectMessage.count({
          where: { chatId: conversationId, isDeleted: false }
        })
      : await prisma.privateMessage.count({
          where: { conversationId: conversationId, isDeleted: false }
        });

    return apiResponse({
      messages: formattedMessages,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Failed to get messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 发送消息
export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiUnauthorized();
    }

    const conversationId = (await params).conversationId;
    const body = await request.json();
    const validation = sendMessageSchema.safeParse(body);

    if (!validation.success) {
      return apiBadRequest('请求参数验证失败');
    }

    const { content, messageType, replyToId } = validation.data;

    // 转换消息类型为 Prisma 枚举格式
    const prismaMessageType = messageType.toUpperCase() as
      | 'TEXT'
      | 'IMAGE'
      | 'FILE'
      | 'SYSTEM';

    // 确定会话类型
    const projectChat = await prisma.projectChat.findUnique({
      where: { id: conversationId },
      include: {
        project: {
          include: {
            members: {
              where: { userId: user.id },
              take: 1
            }
          }
        }
      }
    });

    const privateConversation = await prisma.privateConversation.findUnique({
      where: { id: conversationId },
      include: {
        project: {
          include: {
            members: {
              where: { userId: user.id },
              take: 1
            }
          }
        }
      }
    });

    // 验证用户权限
    const hasAccess =
      projectChat?.project.members.length > 0 ||
      (privateConversation &&
        (privateConversation.participant1Id === user.id ||
          privateConversation.participant2Id === user.id));

    if (!hasAccess) {
      return NextResponse.json({ error: '无权访问此会话' }, { status: 403 });
    }

    let message: any;

    if (projectChat) {
      // 发送项目群聊消息
      message = await prisma.projectMessage.create({
        data: {
          content,
          messageType: prismaMessageType,
          chatId: conversationId,
          senderId: user.id,
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
          }
        }
      });

      // 更新项目聊天室的最后更新时间
      await prisma.projectChat.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });
    } else if (privateConversation) {
      // 发送私聊消息
      const receiverId =
        privateConversation.participant1Id === user.id
          ? privateConversation.participant2Id
          : privateConversation.participant1Id;

      message = await prisma.privateMessage.create({
        data: {
          content,
          messageType: prismaMessageType,
          conversationId: conversationId,
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
          }
        }
      });

      // 更新私聊会话的最后消息时间
      await prisma.privateConversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    // 格式化消息响应
    const formattedMessage = {
      id: message.id,
      conversationId: conversationId,
      senderId: message.senderId,
      senderName: message.sender.name,
      senderImage: message.sender.image,
      content: message.content,
      messageType: message.messageType.toLowerCase(), // 转换回小写以保持前端一致性
      replyToId: message.replyToId,
      status: 'sent',
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString()
    };

    // 通过Socket.io广播消息
    try {
      const broadcastService = getBroadcastService();
      const messageType = projectChat ? 'project' : 'private';

      broadcastService.broadcastMessage({
        conversationId,
        type: messageType,
        message: formattedMessage,
        excludeUserId: user.id // 排除发送者自己
      });

      console.log(`消息已广播到 ${messageType} 会话: ${conversationId}`);
    } catch (broadcastError) {
      console.error('广播消息失败:', broadcastError);
      // 广播失败不影响消息发送成功
    }

    return apiResponse(formattedMessage);
  } catch (error) {
    console.error('Failed to send message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
