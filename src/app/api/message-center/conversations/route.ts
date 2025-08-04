import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiUnauthorized } from '@/lib/api-response';

// 获取消息中心的所有会话（包括项目群聊、私聊、系统消息）
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiUnauthorized();
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as
      | 'private'
      | 'group'
      | 'system'
      | 'project'
      | null;

    let conversations: any[] = [];

    // 1. 获取项目群聊会话
    if (!type || type === 'group') {
      const projectChats = await prisma.projectChat.findMany({
        where: {
          project: {
            members: {
              some: {
                userId: user.id
              }
            }
          }
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
                  isDeleted: false,
                  senderId: { not: user.id }, // 排除自己发送的消息
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

      const groupConversations = projectChats.map((chat) => ({
        id: chat.id,
        type: 'group' as const,
        name: chat.project.name,
        avatar: `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20team%20collaboration%20icon%20blue%20gradient&image_size=square`,
        lastMessage: chat.messages[0]
          ? {
              content: chat.messages[0].content,
              timestamp: chat.messages[0].createdAt,
              sender: {
                id: chat.messages[0].sender.id,
                name: chat.messages[0].sender.name
              }
            }
          : undefined,
        unreadCount: chat._count.messages,
        isOnline: false,
        isPinned: false,
        isMuted: false,
        projectId: chat.projectId,
        lastActivity: chat.updatedAt
      }));

      conversations.push(...groupConversations);
    }

    // 2. 获取私聊会话
    if (!type || type === 'private') {
      const privateConversations = await prisma.privateConversation.findMany({
        where: {
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
                  isDeleted: false,
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

      const privateChats = privateConversations.map((conv) => {
        const otherParticipant =
          conv.participant1Id === user.id
            ? conv.participant2
            : conv.participant1;
        return {
          id: conv.id,
          type: 'private' as const,
          name: otherParticipant.name || otherParticipant.email,
          avatar:
            otherParticipant.image ||
            `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20asian%20person%20suit&image_size=square`,
          lastMessage: conv.messages[0]
            ? {
                content: conv.messages[0].content,
                timestamp: conv.messages[0].createdAt,
                sender: {
                  id: conv.messages[0].sender.id,
                  name: conv.messages[0].sender.name
                }
              }
            : undefined,
          unreadCount: conv._count.messages,
          isOnline: false, // TODO: 实现实时在线状态
          isPinned: false,
          isMuted: false,
          projectId: conv.projectId,
          lastActivity: conv.updatedAt
        };
      });

      conversations.push(...privateChats);
    }

    // 3. 获取系统消息（虚拟会话）
    if (!type || type === 'system') {
      try {
        const unreadSystemMessages = await prisma.userMessage.count({
          where: {
            userId: user.id,
            isRead: false
          }
        });

        const latestSystemMessage = await prisma.userMessage.findFirst({
          where: {
            userId: user.id
          },
          include: {
            message: true
          },
          orderBy: {
            message: {
              createdAt: 'desc'
            }
          }
        });

        if (latestSystemMessage || unreadSystemMessages > 0) {
          conversations.push({
            id: 'system-messages',
            type: 'system' as const,
            name: '系统通知',
            avatar: undefined,
            lastMessage: latestSystemMessage
              ? {
                  content: latestSystemMessage.message.content,
                  timestamp: latestSystemMessage.message.createdAt
                }
              : undefined,
            unreadCount: unreadSystemMessages,
            isPinned: false,
            isMuted: false,
            priority: 'important' as const,
            lastActivity: latestSystemMessage?.message.createdAt || new Date()
          });
        }
      } catch (systemError) {
        console.error('Failed to load system messages:', systemError);
        // 即使系统消息加载失败，也要添加一个错误提示的虚拟会话
        conversations.push({
          id: 'system-messages-error',
          type: 'system' as const,
          name: '系统通知 (加载失败)',
          avatar: undefined,
          lastMessage: {
            content: '系统通知加载失败，请稍后重试',
            timestamp: new Date()
          },
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          priority: 'important' as const,
          lastActivity: new Date()
        });
      }
    }

    // 4. 获取项目通知（虚拟会话 - 基于需求文档中的项目管理通知）
    if (!type || type === 'project') {
      // 这里可以添加项目通知的逻辑
      // 基于需求文档中提到的项目进度通知、任务管理通知等

      // 获取用户参与的项目中的任务变更通知（模拟）
      const userProjects = await prisma.project.findMany({
        where: {
          members: {
            some: {
              userId: user.id
            }
          }
        },
        include: {
          tasks: {
            where: {
              updatedAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 最近7天
              }
            },
            take: 1,
            orderBy: {
              updatedAt: 'desc'
            }
          }
        }
      });

      if (
        userProjects.length > 0 &&
        userProjects.some((p) => p.tasks.length > 0)
      ) {
        const latestTask = userProjects
          .flatMap((p) => p.tasks)
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];

        conversations.push({
          id: 'project-notifications',
          type: 'project' as const,
          name: '项目通知',
          avatar: `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20project%20notification%20icon%20purple%20gradient&image_size=square`,
          lastMessage: latestTask
            ? {
                content: `任务"${latestTask.title}"状态已更新`,
                timestamp: latestTask.updatedAt
              }
            : undefined,
          unreadCount: 0, // TODO: 实现项目通知的未读计数
          isPinned: false,
          isMuted: false,
          priority: 'normal' as const,
          lastActivity: latestTask?.updatedAt || new Date()
        });
      }
    }

    // 按最后活动时间排序
    conversations.sort(
      (a, b) =>
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );

    return apiResponse(conversations);
  } catch (error) {
    console.error('Failed to get message center conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
