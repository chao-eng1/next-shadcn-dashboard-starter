import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
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
