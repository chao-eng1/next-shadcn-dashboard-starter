import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { apiResponse, apiUnauthorized } from '@/lib/api-response';

// 获取当前用户信息
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiUnauthorized();
    }

    // 返回用户信息，排除敏感字段
    const { passwordHash, ...safeUser } = user;

    return apiResponse(safeUser);
  } catch (error) {
    console.error('Failed to get current user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
