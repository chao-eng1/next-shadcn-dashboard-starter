import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';

// 使用Map存储活跃的SSE连接
const connections = new Map<string, ReadableStreamDefaultController>();

// 广播消息给特定会话的用户
export function broadcastToConversation(
  conversationId: string,
  message: any,
  excludeUserId?: string
) {
  connections.forEach((controller, connectionId) => {
    const [userId, connectionConvId] = connectionId.split(':');

    // 如果是同一个会话且不是发送者自己
    if (connectionConvId === conversationId && userId !== excludeUserId) {
      try {
        controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
      } catch (error) {
        connections.delete(connectionId);
      }
    }
  });
}

// SSE连接端点
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');

  if (!conversationId) {
    return new Response('Conversation ID required', { status: 400 });
  }

  // 创建SSE流
  const stream = new ReadableStream({
    start(controller) {
      const connectionId = `${user.id}:${conversationId}`;
      connections.set(connectionId, controller);

      // 发送初始连接确认
      controller.enqueue(
        `data: ${JSON.stringify({
          type: 'connected',
          conversationId,
          timestamp: new Date().toISOString()
        })}\n\n`
      );

      // 设置定期心跳
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            `data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            })}\n\n`
          );
        } catch (error) {
          clearInterval(heartbeat);
          connections.delete(connectionId);
        }
      }, 30000);

      // 清理函数
      return () => {
        clearInterval(heartbeat);
        connections.delete(connectionId);
      };
    },
    cancel() {
      const connectionId = `${user.id}:${conversationId}`;
      connections.delete(connectionId);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}
