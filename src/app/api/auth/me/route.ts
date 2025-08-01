import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      console.log('No auth token found in cookies');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuth(token);
    // Ensure we're getting the correct user by ID from the token
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
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

    // Log for debugging
    if (user) {
      console.log(
        'Retrieved user email:',
        user.email,
        'for userId:',
        payload.userId
      );
    }

    if (!user) {
      console.log('User not found for ID:', payload.userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove password hash from the response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user;

    // Double-check the email to ensure it matches what's in the database
    // This ensures the correct user data is being returned
    console.log(
      'Returning user data for:',
      safeUser.email,
      'with ID:',
      safeUser.id
    );

    console.log('API response data:', JSON.stringify({ user: safeUser }, null, 2));
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
