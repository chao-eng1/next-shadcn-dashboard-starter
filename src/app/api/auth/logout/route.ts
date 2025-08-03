import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Update user status to offline before clearing cookies
    try {
      const user = await getCurrentUser();
      if (user) {
        await prisma.userOnlineStatus.upsert({
          where: { userId: user.id },
          update: {
            isOnline: false,
            lastSeenAt: new Date()
          },
          create: {
            userId: user.id,
            isOnline: false,
            lastSeenAt: new Date()
          }
        });
      }
    } catch (userError) {
      // Don't fail logout if user status update fails
      console.warn('Failed to update user status during logout:', userError);
    }

    // Clear auth cookie
    const cookieStore = await cookies();

    // Use delete method for more reliable cookie removal
    cookieStore.delete({
      name: 'token',
      path: '/'
    });

    // Also try setting to empty with immediate expiration as fallback
    cookieStore.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 0,
      path: '/',
      expires: new Date(0)
    });

    // 为了向后兼容，也清除旧的auth-token
    cookieStore.delete({
      name: 'auth-token',
      path: '/'
    });

    cookieStore.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 0,
      path: '/',
      expires: new Date(0)
    });

    return NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
