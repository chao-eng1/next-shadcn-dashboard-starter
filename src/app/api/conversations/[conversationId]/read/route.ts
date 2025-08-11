// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import {
  apiResponse,
  apiUnauthorized,
  apiForbidden,
  apiNotFound
} from '@/lib/api-response';

// 标记会话为已读
export async function PUT(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiUnauthorized();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const conversationId = (await params).conversationId;

    // 首先检查这是项目聊天还是私聊
    const [projectChat, privateConversation] = await Promise.all([
      prisma.projectChat.findUnique({
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
      }),
      prisma.privateConversation.findUnique({
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
      })
    ]);

    // 验证用户权限
    const hasAccess =
      projectChat?.project.members.length > 0 ||
      (privateConversation &&
        (privateConversation.participant1Id === user.id ||
          privateConversation.participant2Id === user.id));

    if (!hasAccess) {
      return apiForbidden('无权访问此会话');
    }

    if (!projectChat && !privateConversation) {
      return apiNotFound('会话不存在');
    }

    // 标记消息为已读
    if (projectChat) {
      // 对于项目聊天，我们需要在 projectMessageReads 表中创建记录

      // 获取当前会话中所有用户未读的消息
      const unreadMessages = await prisma.projectMessage.findMany({
        where: {
          chatId: conversationId,
          isDeleted: false, // 排除已删除的消息
          readBy: {
            none: {
              userId: user.id
            }
          }
        },
        select: { id: true }
      });

      // 为所有未读消息创建已读记录
      if (unreadMessages.length > 0) {
        // 使用 Promise.all 来并行创建记录，忽略重复错误
        const createPromises = unreadMessages.map(async (message) => {
          try {
            await prisma.messageRead.create({
              data: {
                messageId: message.id,
                userId: user.id,
                readAt: new Date()
              }
            });
          } catch (error) {
            // 忽略唯一约束错误（记录已存在）
            if (!error.message?.includes('Unique constraint')) {
              throw error;
            }
          }
        });

        await Promise.all(createPromises);
      }
    } else if (privateConversation) {
      // 对于私聊，我们需要更新 privateMessage 的 isRead 字段

      const updateResult = await prisma.privateMessage.updateMany({
        where: {
          conversationId: conversationId,
          receiverId: user.id,
          isDeleted: false, // 排除已删除的消息
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    }

    return apiResponse({ success: true, message: '会话已标记为已读' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
