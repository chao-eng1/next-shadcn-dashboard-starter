import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';

// GET /api/messages/unread-count - 获取未读消息数量
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取用户的未读消息数量
    const unreadCount = await prisma.userMessage.count({
      where: {
        userId: currentUser.id,
        isRead: false
      }
    });

    return NextResponse.json({
      count: unreadCount
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
