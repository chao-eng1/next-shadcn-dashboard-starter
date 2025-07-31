import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET /api/messages/unread-count - Get unread message count for the current user
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized', count: 0 }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify token
    let userId;
    try {
      const payload = await verifyAuth(token);
      userId = (payload.sub as string) || (payload.userId as string);

      if (!userId) {
        return new NextResponse(
          JSON.stringify({ error: 'Invalid user ID', count: 0 }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error('Token verification error:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Invalid token', count: 0 }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Count unread messages
    const count = await prisma.userMessage.count({
      where: {
        userId: userId,
        isRead: false
      }
    });

    // Return proper JSON response
    return new NextResponse(JSON.stringify({ count }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching unread message count:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error', count: 0 }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
