import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiUnauthorized, apiValidationError } from '@/lib/api-response';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['online', 'away', 'offline'])
});

// 更新用户状态
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const validation = updateStatusSchema.safeParse(body);
    
    if (!validation.success) {
      return apiValidationError(validation.error.errors);
    }

    const { status } = validation.data;

    // 更新用户状态和最后活跃时间
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        status,
        lastActiveAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        status: true,
        lastActiveAt: true
      }
    });
    
    return apiResponse(updatedUser);
  } catch (error) {
    console.error('Failed to update user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 获取用户状态
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return apiUnauthorized();
    }

    const userStatus = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        status: true,
        lastActiveAt: true
      }
    });
    
    return apiResponse(userStatus);
  } catch (error) {
    console.error('Failed to get user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }