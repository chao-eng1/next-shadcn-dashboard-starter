import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasPermission } from '@/lib/permissions';

// GET /api/messages - 获取消息列表
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // 'all', 'read', 'unread'

    const skip = (page - 1) * limit;

    // 检查用户是否有消息管理权限
    const canManageMessages = await hasPermission(
      currentUser.id,
      'message.manage'
    );

    if (canManageMessages) {
      // 管理员可以查看所有消息
      const messages = await prisma.message.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          recipients: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      const total = await prisma.message.count();

      return NextResponse.json({
        messages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } else {
      // 普通用户只能查看发给自己的消息
      let whereClause: any = {
        recipients: {
          some: {
            userId: currentUser.id
          }
        }
      };

      // 根据状态过滤
      if (status === 'read') {
        whereClause.recipients.some.isRead = true;
      } else if (status === 'unread') {
        whereClause.recipients.some.isRead = false;
      }

      const messages = await prisma.message.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          recipients: {
            where: {
              userId: currentUser.id
            },
            select: {
              isRead: true,
              readAt: true
            }
          }
        }
      });

      const total = await prisma.message.count({
        where: whereClause
      });

      return NextResponse.json({
        messages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/messages - 发送新消息
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查用户是否有发送消息权限
    const canSendMessages = await hasPermission(currentUser.id, 'message.send');
    if (!canSendMessages) {
      return NextResponse.json(
        { error: 'No permission to send messages' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      content,
      isGlobal,
      roleIds,
      recipientIds,
      includeSender = false
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    console.log('Creating message with data:', {
      title,
      content,
      isGlobal,
      roleIds,
      recipientIds,
      includeSender,
      senderId: currentUser.id
    });

    // 创建消息
    const message = await prisma.message.create({
      data: {
        title,
        content,
        isGlobal: isGlobal || false,
        senderId: currentUser.id
      }
    });

    let recipientUserIds: string[] = [];

    if (isGlobal) {
      // 全局消息：发送给所有用户
      const allUsers = await prisma.user.findMany({
        select: { id: true }
      });
      recipientUserIds = allUsers.map((user) => user.id);

      // 如果不包含发送者，则从列表中移除
      if (!includeSender) {
        recipientUserIds = recipientUserIds.filter(
          (id) => id !== currentUser.id
        );
      }
    } else if (roleIds && roleIds.length > 0) {
      // 按角色发送：获取指定角色的所有用户
      const usersInRoles = await prisma.userRole.findMany({
        where: {
          roleId: {
            in: roleIds
          }
        },
        select: {
          userId: true
        }
      });
      recipientUserIds = [...new Set(usersInRoles.map((ur) => ur.userId))];

      // 如果不包含发送者，则从列表中移除
      if (!includeSender) {
        recipientUserIds = recipientUserIds.filter(
          (id) => id !== currentUser.id
        );
      }
    } else if (recipientIds && recipientIds.length > 0) {
      // 指定用户：直接使用提供的用户ID
      recipientUserIds = recipientIds;

      // 如果不包含发送者，则从列表中移除
      if (!includeSender) {
        recipientUserIds = recipientUserIds.filter(
          (id) => id !== currentUser.id
        );
      }
    }

    // 创建用户消息关联记录
    if (recipientUserIds.length > 0) {
      const userMessageData = recipientUserIds.map((userId) => ({
        userId,
        messageId: message.id,
        isRead: false
      }));

      console.log('Creating UserMessage records:', userMessageData);

      await prisma.userMessage.createMany({
        data: userMessageData
      });

      console.log(`Created ${userMessageData.length} UserMessage records`);
    } else {
      console.log('No recipients found for message:', message.id);
    }

    // 通过WebSocket发送实时通知给所有接收者
    try {
      const { getBroadcastService } = await import('@/lib/socket-broadcast');
      const broadcastService = getBroadcastService();

      // 为每个接收者发送个人消息通知
      for (const userId of recipientUserIds) {
        broadcastService.broadcastUserMessage({
          userId: userId,
          message: {
            id: message.id,
            title: message.title,
            content: message.content,
            isGlobal: message.isGlobal,
            priority: message.priority,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderImage: currentUser.image,
            createdAt: message.createdAt.toISOString(),
            conversationId: `system-${message.id}`,
            conversationName: '系统消息'
          },
          excludeUserId: currentUser.id
        });
      }

      console.log(
        'System message broadcasted to:',
        recipientUserIds.length,
        'users'
      );
    } catch (broadcastError) {
      console.error('Failed to broadcast system message:', broadcastError);
    }

    console.log('Message sent to recipients:', recipientUserIds);
    console.log('Sender ID:', currentUser.id);
    console.log(
      'Message type:',
      isGlobal ? 'global' : roleIds?.length ? 'role-based' : 'specific'
    );

    // 返回创建的消息和接收者数量
    return NextResponse.json({
      message: {
        ...message,
        recipientCount: recipientUserIds.length
      }
    });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
