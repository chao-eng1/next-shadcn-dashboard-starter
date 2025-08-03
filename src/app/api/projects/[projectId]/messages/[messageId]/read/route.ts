import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';

// 标记消息为已读
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string; messageId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { projectId, messageId } = params;

    // 验证用户是否为项目成员
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: user.id
      }
    });

    if (!projectMember) {
      return NextResponse.json({ error: '无权限访问此项目' }, { status: 403 });
    }

    // 验证消息是否存在且属于该项目
    const message = await prisma.projectMessage.findFirst({
      where: {
        id: messageId,
        chat: {
          projectId
        },
        isDeleted: false
      }
    });

    if (!message) {
      return NextResponse.json({ error: '消息不存在' }, { status: 404 });
    }

    // 如果是自己发送的消息，不需要标记为已读
    if (message.senderId === user.id) {
      return NextResponse.json({
        success: true,
        message: '自己的消息无需标记已读'
      });
    }

    // 标记消息为已读
    await prisma.messageRead.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId: user.id
        }
      },
      update: {
        readAt: new Date()
      },
      create: {
        messageId,
        userId: user.id,
        readAt: new Date()
      }
    });

    // 标记相关通知为已读
    await prisma.messageNotification.updateMany({
      where: {
        messageId,
        userId: user.id,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('标记消息已读失败:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// 获取消息已读状态
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; messageId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { projectId, messageId } = params;

    // 验证用户是否为项目成员
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: user.id
      }
    });

    if (!projectMember) {
      return NextResponse.json({ error: '无权限访问此项目' }, { status: 403 });
    }

    // 获取消息已读状态
    const readStatus = await prisma.messageRead.findMany({
      where: {
        messageId
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
      },
      orderBy: {
        readAt: 'asc'
      }
    });

    return NextResponse.json({ readStatus });
  } catch (error) {
    console.error('获取消息已读状态失败:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
