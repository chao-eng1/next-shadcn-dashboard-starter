import { NextRequest, NextResponse } from 'next/server';

// WebSocket服务器状态检查
export async function GET(request: NextRequest) {
  // Next.js API路由不直接支持WebSocket升级
  // 返回WebSocket服务器信息
  return NextResponse.json(
    {
      message: 'WebSocket服务器运行在独立端口',
      websocketUrl: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
      status: 'Socket.io服务器已配置'
    },
    { status: 200 }
  );
}
