import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { WebSocketMessage, UseWebSocketChatOptions } from '@/types/chat';
import { useChatStore } from '@/store/chat-store';
import { getWebSocketService } from '@/lib/websocket-service';

export const useWebSocketChat = (
  namespace: string = '/chat',
  options: UseWebSocketChatOptions = {}
) => {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000
  } = options;

  const [wsService] = useState(() => getWebSocketService());
  const [error, setError] = useState<string | null>(null);
  const reconnectCount = useRef(0);
  const { user } = useAuth();
  const { setConnected, addMessage, setTyping } = useChatStore();

  useEffect(() => {
    if (!autoConnect || !user) return;

    const connect = async () => {
      try {
        // 使用WebSocketService连接
        await wsService.connect(user.id);
        setConnected(true);
        setError(null);
        reconnectCount.current = 0;

        // 监听消息事件
        wsService.on('message:receive', (data) => {
          try {
            const message = {
              id: data.id || Date.now().toString(),
              content: data.content,
              role: data.role || 'assistant',
              timestamp: new Date(data.timestamp || Date.now()),
              conversationId: data.conversationId,
              status: 'delivered' as const
            };

            if (data.conversationId) {
              addMessage(data.conversationId, message);
            }
          } catch (error) {
            console.error('Error processing message:', error);
          }
        });

        // 监听输入状态
        wsService.on('typing:start', () => {
          setTyping(true);
        });

        wsService.on('typing:stop', () => {
          setTyping(false);
        });

        // 监听错误事件
        wsService.on('error', (errorData) => {
          setError(errorData.message || 'Connection error');
        });

        // 监听连接状态
        wsService.on('disconnect', () => {
          setConnected(false);

          // 自动重连
          if (reconnectCount.current < reconnectAttempts) {
            setTimeout(() => {
              reconnectCount.current++;
              connect();
            }, reconnectDelay * reconnectCount.current);
          }
        });
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        setError('Failed to connect');
        setConnected(false);
      }
    };

    connect();

    return () => {
      // 清理事件监听器
      wsService.off('message:receive', () => {});
      wsService.off('typing:start', () => {});
      wsService.off('typing:stop', () => {});
      wsService.off('error', () => {});
      wsService.off('disconnect', () => {});
    };
  }, [
    namespace,
    autoConnect,
    user,
    reconnectAttempts,
    reconnectDelay,
    wsService,
    setConnected,
    addMessage,
    setTyping
  ]);

  const sendMessage = (message: WebSocketMessage) => {
    if (wsService.isConnected) {
      try {
        wsService.send(message.type as any, message.data);
        return true;
      } catch (error) {
        console.error('Failed to send message:', error);
        return false;
      }
    } else {
      return false;
    }
  };

  const sendChatMessage = (conversationId: string, content: string) => {
    if (wsService.isConnected) {
      wsService.sendMessage(conversationId, content, 'text');
      return true;
    }
    return false;
  };

  const sendTypingIndicator = (conversationId: string) => {
    if (wsService.isConnected) {
      wsService.sendTypingStatus(conversationId, true);
      return true;
    }
    return false;
  };

  return {
    socket: wsService,
    isConnected: wsService.isConnected,
    error,
    sendMessage,
    sendChatMessage,
    sendTypingIndicator
  };
};
