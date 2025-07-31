import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';

// Using singleton prisma instance from @/lib/prisma

// PUT /api/messages/[id]/read - Mark a message as read
export async function PUT(
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

    // Check if the message exists
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if the user is a recipient of this message
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
        { error: 'You are not a recipient of this message' },
        { status: 403 }
      );
    }

    // If the message is already read, return success
    if (userMessage.isRead) {
      return NextResponse.json({
        message: 'Message already marked as read'
      });
    }

    // Mark the message as read
    await prisma.userMessage.update({
      where: {
        userId_messageId: {
          userId: userId,
          messageId: messageId
        }
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return NextResponse.json({
      message: 'Message marked as read successfully'
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
