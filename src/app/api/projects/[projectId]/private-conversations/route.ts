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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { z } from 'zod';

// 创建私聊会话的请求schema
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createConversationSchema = z.object({
  participantId: z.string().min(1, '参与者ID不能为空')
});

// 获取项目中的私聊会话列表
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized('用户未登录');
    }

    const { projectId } = await params;

    // 检查用户是否是项目成员
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: user.id
      }
    });

    if (!projectMember) {
      return apiForbidden('您不是该项目的成员');
    }

    // 获取用户参与的所有私聊会话
    const conversations = await prisma.privateConversation.findMany({
      where: {
        projectId,
        OR: [{ participant1Id: user.id }, { participant2Id: user.id }]
      },
      include: {
        participant1: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        participant2: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                receiverId: user.id,
                isRead: false
              }
            }
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    });

    // 格式化返回数据
    const formattedConversations = conversations.map((conversation) => {
      const otherParticipant =
        conversation.participant1Id === user.id
          ? conversation.participant2
          : conversation.participant1;

      const lastMessage = conversation.messages[0] || null;
      const unreadCount = conversation._count.messages;

      return {
        id: conversation.id,
        participant: otherParticipant,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              sender: lastMessage.sender,
              createdAt: lastMessage.createdAt
            }
          : null,
        unreadCount,
        lastMessageAt: conversation.lastMessageAt,
        createdAt: conversation.createdAt
      };
    });

    return apiResponse(formattedConversations, '获取私聊会话列表成功');
  } catch (error) {
    return apiError('获取私聊会话列表失败');
  }
}

// 创建或获取私聊会话
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized('用户未登录');
    }

    const { projectId } = await params;
    const body = await request.json();
    const { participantId } = createConversationSchema.parse(body);

    // 检查用户是否是项目成员
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: user.id
      }
    });

    if (!projectMember) {
      return apiForbidden('您不是该项目的成员');
    }

    // 检查对方是否是项目成员
    const otherMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: participantId
      }
    });

    if (!otherMember) {
      return apiNotFound('对方不是该项目的成员');
    }

    // 不能和自己聊天
    if (user.id === participantId) {
      return apiError('不能和自己聊天');
    }

    // 检查是否已存在会话
    const existingConversation = await prisma.privateConversation.findFirst({
      where: {
        projectId,
        OR: [
          {
            participant1Id: user.id,
            participant2Id: participantId
          },
          {
            participant1Id: participantId,
            participant2Id: user.id
          }
        ]
      },
      include: {
        participant1: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        participant2: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    if (existingConversation) {
      const otherParticipant =
        existingConversation.participant1Id === user.id
          ? existingConversation.participant2
          : existingConversation.participant1;

      return apiResponse(
        {
          id: existingConversation.id,
          participant: otherParticipant,
          createdAt: existingConversation.createdAt
        },
        '会话已存在'
      );
    }

    // 创建新的私聊会话
    const conversation = await prisma.privateConversation.create({
      data: {
        projectId,
        participant1Id: user.id,
        participant2Id: participantId
      },
      include: {
        participant1: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        participant2: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    const otherParticipant =
      conversation.participant1Id === user.id
        ? conversation.participant2
        : conversation.participant1;

    return apiResponse(
      {
        id: conversation.id,
        participant: otherParticipant,
        createdAt: conversation.createdAt
      },
      '创建私聊会话成功'
    );
  } catch (error) {
    return apiError('创建私聊会话失败');
  }
}
