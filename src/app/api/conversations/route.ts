import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiUnauthorized, apiBadRequest } from '@/lib/api-response';
import { z } from 'zod';

const createConversationSchema = z.object({
  type: z.enum(['project', 'private']),
  projectId: z.string().optional(),
  participantId: z.string().optional(),
  participantIds: z.array(z.string()).optional(),
  name: z.string().optional()
});

// 获取会话列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return apiUnauthorized();
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'project' | 'private' | null;
    const projectId = searchParams.get('projectId');

    let whereClause: any = {
      participants: {
        some: {
          userId: user.id
        }
      }
    };

    // 根据类型过滤
    if (type) {
      whereClause.type = type;
    }

    // 根据项目ID过滤
    if (projectId) {
      whereClause.projectId = projectId;
    }

    let conversations: any[] = [];

    if (type === 'project' || !type) {
      // 获取项目聊天室
      const projectChats = await prisma.projectChat.findMany({
        where: {
          project: {
            members: {
              some: {
                userId: user.id
              }
            }
          },
          ...(projectId ? { projectId } : {})
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          messages: {
            take: 1,
            orderBy: {
              createdAt: 'desc'
            },
            select: {
              id: true,
              content: true,
              messageType: true,
              createdAt: true,
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
                  readBy: {
                    none: {
                      userId: user.id
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      // 处理项目聊天，获取每个项目的成员信息
      const projectConversations = await Promise.all(
        projectChats.map(async (chat) => {
          // 获取项目成员信息
          const projectMembers = await prisma.projectMember.findMany({
            where: {
              projectId: chat.projectId
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true
                }
              }
            }
          });

          return {
            id: chat.id,
            type: 'project',
            name: chat.project.name,
            description: chat.project.description,
            projectId: chat.projectId,
            project: chat.project,
            participants: projectMembers.map(member => ({
              id: member.user.id,
              name: member.user.name,
              email: member.user.email,
              image: member.user.image,
              role: member.role,
              status: 'offline' as const // 默认状态，实际状态需要从在线用户列表获取
            })),
            lastMessage: chat.messages[0] ? {
              id: chat.messages[0].id,
              content: chat.messages[0].content,
              senderId: chat.messages[0].sender.id,
              senderName: chat.messages[0].sender.name,
              timestamp: chat.messages[0].createdAt.toISOString(),
              messageType: chat.messages[0].messageType
            } : null,
            unreadCount: chat._count.messages,
            createdAt: chat.createdAt.toISOString(),
            updatedAt: chat.updatedAt.toISOString()
          };
        })
      );

      conversations.push(...projectConversations);
    }

    if (type === 'private' || !type) {
      // 获取私聊会话
      const privateConversations = await prisma.privateConversation.findMany({
        where: {
          OR: [
            { participant1Id: user.id },
            { participant2Id: user.id }
          ],
          ...(projectId ? { projectId } : {})
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
          project: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          messages: {
            take: 1,
            orderBy: {
              createdAt: 'desc'
            },
            select: {
              id: true,
              content: true,
              messageType: true,
              createdAt: true,
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
                  isRead: false,
                  receiverId: user.id
                }
              }
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      conversations.push(...privateConversations.map(conv => {
        const otherParticipant = conv.participant1Id === user.id ? conv.participant2 : conv.participant1;
        return {
          id: conv.id,
          type: 'private',
          name: otherParticipant.name || otherParticipant.email,
          projectId: conv.projectId,
          project: conv.project,
          participants: [conv.participant1, conv.participant2],
          lastMessage: conv.messages[0] || null,
          unreadCount: conv._count.messages,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt
        };
      }));
    }

    // 按更新时间排序
    conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    return apiResponse(conversations);
  } catch (error) {
    console.error('Failed to get conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 创建新会话
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const validation = createConversationSchema.safeParse(body);
    
    if (!validation.success) {
      return apiBadRequest('请求参数验证失败');
    }

    const { type, projectId, participantId, participantIds, name } = validation.data;

    let conversation: any;

    if (type === 'project') {
      // 创建项目聊天室
      if (!projectId) {
        return apiBadRequest('项目聊天室需要指定项目ID');
      }

      // 检查项目聊天室是否已存在
      const existingChat = await prisma.projectChat.findUnique({
        where: { projectId }
      });

      if (existingChat) {
        return apiBadRequest('该项目的聊天室已存在');
      }

      conversation = await prisma.projectChat.create({
        data: {
          projectId
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      });

      conversation = {
        id: conversation.id,
        type: 'project',
        name: conversation.project.name,
        projectId: conversation.projectId,
        project: conversation.project,
        participants: [],
        lastMessage: null,
        unreadCount: 0,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      };
    } else if (type === 'private') {
      // 创建私聊会话
      const otherUserId = participantId || (participantIds && participantIds[0]);
      
      if (!otherUserId) {
        return apiBadRequest('私聊需要指定一个参与者');
      }

      if (!projectId) {
        return apiBadRequest('私聊需要指定项目上下文');
      }

      const participant1Id = user.id < otherUserId ? user.id : otherUserId;
      const participant2Id = user.id < otherUserId ? otherUserId : user.id;

      // 检查私聊会话是否已存在
      const existingConversation = await prisma.privateConversation.findUnique({
        where: {
          participant1Id_participant2Id_projectId: {
            participant1Id,
            participant2Id,
            projectId
          }
        }
      });

      if (existingConversation) {
        return apiBadRequest('该私聊会话已存在');
      }

      conversation = await prisma.privateConversation.create({
        data: {
          participant1Id,
          participant2Id,
          projectId
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
          project: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      });

      const otherParticipant = conversation.participant1Id === user.id ? conversation.participant2 : conversation.participant1;
      conversation = {
        id: conversation.id,
        type: 'private',
        name: otherParticipant.name || otherParticipant.email,
        projectId: conversation.projectId,
        project: conversation.project,
        participants: [conversation.participant1, conversation.participant2],
        lastMessage: null,
        unreadCount: 0,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      };
    } else {
      return apiBadRequest('不支持的会话类型');
    }

    return apiResponse(conversation);
  } catch (error) {
    console.error('Failed to create conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}