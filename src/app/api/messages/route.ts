import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasPermission } from '@/lib/permissions';

// GET /api/messages - 获取消息列表
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // 'all', 'read', 'unread'

    const skip = (page - 1) * limit;

    // 检查用户是否有消息管理权限
    const canManageMessages = await hasPermission(currentUser.id, 'message.manage');

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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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
    const { title, content, isGlobal, roleIds, recipientIds } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

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
      recipientUserIds = allUsers.map(user => user.id);
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
      recipientUserIds = [...new Set(usersInRoles.map(ur => ur.userId))];
    } else if (recipientIds && recipientIds.length > 0) {
      // 指定用户：直接使用提供的用户ID
      recipientUserIds = recipientIds;
    }

    // 创建用户消息关联记录
    if (recipientUserIds.length > 0) {
      await prisma.userMessage.createMany({
        data: recipientUserIds.map(userId => ({
          userId,
          messageId: message.id,
          isRead: false
        }))
      });
    }

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