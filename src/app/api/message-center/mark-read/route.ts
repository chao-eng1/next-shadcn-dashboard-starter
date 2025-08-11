// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import {
  apiResponse,
  apiUnauthorized,
  apiBadRequest
} from '@/lib/api-response';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const markReadSchema = z.object({
  messageId: z.string(),
  messageType: z.enum(['system', 'project', 'private'])
});

// 标记消息为已读
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiUnauthorized();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const body = await request.json();
    const validation = markReadSchema.safeParse(body);

    if (!validation.success) {
      return apiBadRequest('请求参数验证失败');
    }

    const { messageId, messageType } = validation.data;

    switch (messageType) {
      case 'system':
        // 标记系统消息为已读
        await prisma.userMessage.updateMany({
          where: {
            messageId: messageId,
            userId: user.id,
            isRead: false
          },
          data: {
            isRead: true,
            readAt: new Date()
          }
        });
        break;

      case 'project':
        // 标记项目消息为已读
        const existingRead = await prisma.messageRead.findUnique({
          where: {
            messageId_userId: {
              messageId: messageId,
              userId: user.id
            }
          }
        });

        if (!existingRead) {
          await prisma.messageRead.create({
            data: {
              messageId: messageId,
              userId: user.id,
              readAt: new Date()
            }
          });
        }
        break;

      case 'private':
        // 标记私聊消息为已读
        await prisma.privateMessage.updateMany({
          where: {
            id: messageId,
            receiverId: user.id,
            isRead: false
          },
          data: {
            isRead: true,
            readAt: new Date()
          }
        });
        break;

      default:
        return apiBadRequest('不支持的消息类型');
    }

    return apiResponse({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 批量标记消息为已读
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const batchMarkReadSchema = z.object({
  messageIds: z.array(z.string()),
  messageType: z.enum(['system', 'project', 'private'])
});

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiUnauthorized();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const body = await request.json();
    const validation = batchMarkReadSchema.safeParse(body);

    if (!validation.success) {
      return apiBadRequest('请求参数验证失败');
    }

    const { messageIds, messageType } = validation.data;

    switch (messageType) {
      case 'system':
        await prisma.userMessage.updateMany({
          where: {
            messageId: { in: messageIds },
            userId: user.id,
            isRead: false
          },
          data: {
            isRead: true,
            readAt: new Date()
          }
        });
        break;

      case 'project':
        // 批量创建已读记录
        const readRecords = messageIds.map((messageId) => ({
          messageId,
          userId: user.id,
          readAt: new Date()
        }));

        await prisma.messageRead.createMany({
          data: readRecords,
          skipDuplicates: true
        });
        break;

      case 'private':
        await prisma.privateMessage.updateMany({
          where: {
            id: { in: messageIds },
            receiverId: user.id,
            isRead: false
          },
          data: {
            isRead: true,
            readAt: new Date()
          }
        });
        break;

      default:
        return apiBadRequest('不支持的消息类型');
    }

    return apiResponse({ success: true, markedCount: messageIds.length });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
