import { LoginSchema } from '@/features/auth/schemas/auth.schema';
import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { SignJWT } from 'jose';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = LoginSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await compare(
      validatedData.password,
      user.passwordHash
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Set user status to online and update last active time
    await prisma.userOnlineStatus.upsert({
      where: { userId: user.id },
      update: {
        isOnline: true,
        lastSeenAt: new Date()
      },
      create: {
        userId: user.id,
        isOnline: true,
        lastSeenAt: new Date()
      }
    });

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Log the user ID being stored in the token
    console.log('Storing user ID in token:', user.id, 'for email:', user.email);

    const secretKey = new TextEncoder().encode(jwtSecret);
    const token = await new SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id) // 设置sub字段为用户ID，这样verifyJwtToken可以正确获取
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secretKey);

    // Set cookie with better compatibility
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/' // Ensure cookie is available for all paths
    });

    return NextResponse.json(
      { message: 'Logged in successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
