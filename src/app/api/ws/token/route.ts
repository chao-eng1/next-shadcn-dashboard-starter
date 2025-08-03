import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { apiResponse, apiUnauthorized } from '@/lib/api-response';
import { sign } from 'jsonwebtoken';

// 获取WebSocket连接令牌
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiUnauthorized();
    }

    // 生成WebSocket令牌
    const wsToken = sign(
      {
        sub: user.id, // 使用 sub 字段，与服务器期望一致
        id: user.id, // 同时保留 id 字段作为备用
        userId: user.id,
        email: user.email,
        type: 'websocket'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    return apiResponse({ token: wsToken });
  } catch (error) {
    console.error('Failed to generate WebSocket token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
