import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';

// Using singleton prisma instance from @/lib/prisma

// GET /api/messages - Get all messages for the current user
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized', messages: [] }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let userId;
    try {
      const payload = await verifyAuth(token);
      userId = (payload.sub as string) || (payload.userId as string);

      if (!userId) {
        return new NextResponse(
          JSON.stringify({ error: 'Invalid user ID', messages: [] }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error('Token verification error:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Invalid token', messages: [] }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // 'all', 'read', 'unread'

    const skip = (page - 1) * limit;

    // Check if the user is an admin
    const userWithRoles = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const isAdmin = userWithRoles?.roles.some((userRole) =>
      userRole.role.permissions.some(
        (rp) => rp.permission.name === 'message.manage'
      )
    );

    // For admins, get all messages
    if (isAdmin) {
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

      const totalMessages = await prisma.message.count();

      return NextResponse.json({
        messages,
        pagination: {
          total: totalMessages,
          pages: Math.ceil(totalMessages / limit),
          page,
          limit
        }
      });
    }

    // For regular users, get messages addressed to them
    let whereClause: any = {
      userId: userId
    };

    if (status === 'read') {
      whereClause.isRead = true;
    } else if (status === 'unread') {
      whereClause.isRead = false;
    }

    const userMessages = await prisma.userMessage.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        message: {
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
        }
      }
    });

    const totalUserMessages = await prisma.userMessage.count({
      where: whereClause
    });

    return new NextResponse(
      JSON.stringify({
        messages: userMessages.map((um) => ({
          ...um.message,
          isRead: um.isRead,
          readAt: um.readAt
        })),
        pagination: {
          total: totalUserMessages,
          pages: Math.ceil(totalUserMessages / limit),
          page,
          limit
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching messages:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error', messages: [] }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST /api/messages - Create a new message
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuth(token);
    const userId = payload.userId as string;

    // Check if user has permission to send messages
    const userWithRoles = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const canSendMessages = userWithRoles?.roles.some((userRole) =>
      userRole.role.permissions.some(
        (rp) =>
          rp.permission.name === 'message.send' ||
          rp.permission.name === 'message.manage'
      )
    );

    if (!canSendMessages) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to send messages' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, isGlobal, recipientIds, roleIds } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        title,
        content,
        isGlobal: Boolean(isGlobal),
        senderId: userId
      }
    });

    // If it's a global message, send to all users
    if (isGlobal) {
      const allUsers = await prisma.user.findMany({
        select: { id: true }
      });

      // 在Prisma 6.12.0中，createMany不再支持skipDuplicates选项
      // 手动实现去重处理：使用Set确保用户ID唯一
      const uniqueAllUsers = [...new Set(allUsers.map((user) => user.id))];

      if (uniqueAllUsers.length > 0) {
        await prisma.userMessage.createMany({
          data: uniqueAllUsers.map((userId) => ({
            userId,
            messageId: message.id,
            isRead: false
          }))
        });
      }
    }
    // If specific roles are targeted
    else if (roleIds && roleIds.length > 0) {
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

      // 使用Set确保用户ID唯一
      const uniqueUserIds = [...new Set(usersInRoles.map((ur) => ur.userId))];

      if (uniqueUserIds.length > 0) {
        await prisma.userMessage.createMany({
          data: uniqueUserIds.map((userId) => ({
            userId,
            messageId: message.id,
            isRead: false
          }))
        });
      }
    }
    // If specific users are targeted
    else if (recipientIds && recipientIds.length > 0) {
      // 使用Set确保用户ID唯一
      const uniqueRecipientIds = [...new Set(recipientIds)];

      if (uniqueRecipientIds.length > 0) {
        await prisma.userMessage.createMany({
          data: uniqueRecipientIds.map((userId) => ({
            userId,
            messageId: message.id,
            isRead: false
          }))
        });
      }
    } else {
      // If no recipients specified, return error
      await prisma.message.delete({
        where: { id: message.id }
      });

      return NextResponse.json(
        {
          error:
            'No recipients specified. Message must be global or have specific recipients.'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Message sent successfully', id: message.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
