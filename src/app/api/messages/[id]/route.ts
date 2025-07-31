import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';

// Using singleton prisma instance from @/lib/prisma

// GET /api/messages/[id] - Get a specific message
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuth(token);
    const userId = payload.userId as string;

    const messageId = (await params).id;

    // Fetch the message with its sender
    const message = await prisma.message.findUnique({
      where: { id: messageId },
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

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if the user has permission to view this message
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

    // Admins can view any message
    if (isAdmin) {
      return NextResponse.json(message);
    }

    // For regular users, check if they are a recipient of this message
    const userMessage = await prisma.userMessage.findUnique({
      where: {
        userId_messageId: {
          userId: userId,
          messageId: messageId
        }
      }
    });

    if (!userMessage) {
      return NextResponse.json(
        { error: 'You do not have permission to view this message' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ...message,
      isRead: userMessage.isRead,
      readAt: userMessage.readAt
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/[id] - Delete a message
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuth(token);
    const userId = payload.userId as string;

    const messageId = (await params).id;

    // Get the message
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user has permission to delete messages
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

    const canDeleteMessages = userWithRoles?.roles.some((userRole) =>
      userRole.role.permissions.some(
        (rp) =>
          rp.permission.name === 'message.delete' ||
          rp.permission.name === 'message.manage'
      )
    );

    // Only users with delete permission or the sender can delete a message
    if (!canDeleteMessages && message.senderId !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this message' },
        { status: 403 }
      );
    }

    // Delete all UserMessage records first
    await prisma.userMessage.deleteMany({
      where: { messageId }
    });

    // Then delete the message
    await prisma.message.delete({
      where: { id: messageId }
    });

    return NextResponse.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
