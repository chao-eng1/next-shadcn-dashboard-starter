import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { WebSocketMessage, UseWebSocketChatOptions } from '@/types/chat';
import { useChatStore } from '@/store/chat-store';

export const useWebSocketChat = (
  namespace: string = '/chat',
  options: UseWebSocketChatOptions = {}
) => {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000
  } = options;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);
  const reconnectCount = useRef(0);
  const { user } = useAuth();
  const { setConnected, addMessage, setTyping } = useChatStore();

  useEffect(() => {
    if (!autoConnect || !user) return;

    const connect = () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const wsUrl = `ws://localhost:3001${namespace}?token=${encodeURIComponent(user.token || '')}`;
        const newSocket = new WebSocket(wsUrl);

        newSocket.onopen = () => {
          setConnected(true);
          setError(null);
          reconnectCount.current = 0;
        };

        newSocket.onmessage = (event) => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const message: WebSocketMessage = JSON.parse(event.data);

            switch (message.type) {
              case 'message':
                if (message.data.conversationId && message.data.content) {
                  addMessage(message.data.conversationId, {
                    id:
                      message.data.messageId ||
                      Math.random().toString(36).substr(2, 9),
                    content: message.data.content,
                    role: 'assistant',
                    timestamp: new Date(message.data.timestamp || Date.now()),
                    conversationId: message.data.conversationId,
                    status: 'delivered'
                  });
                }
                break;

              case 'typing':
                setTyping(true);
                setTimeout(() => setTyping(false), 3000);
                break;

              case 'error':
                setError(message.data.content || 'Unknown error');
                break;

              default:
            }
          } catch (error) {}
        };

        newSocket.onclose = (event) => {
          setConnected(false);

          // 自动重连
          if (reconnectCount.current < reconnectAttempts) {
            setTimeout(() => {
              reconnectCount.current++;
              connect();
            }, reconnectDelay * reconnectCount.current);
          }
        };

        newSocket.onerror = (error) => {
          setError('Connection error');
        };

        setSocket(newSocket);
      } catch (error) {
        setError('Failed to connect');
      }
    };

    connect();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [namespace, autoConnect, user, reconnectAttempts, reconnectDelay]);

  const sendMessage = (message: WebSocketMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
      return true;
    } else {
      return false;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sendChatMessage = (conversationId: string, content: string) => {
    return sendMessage({
      type: 'message',
      data: {
        conversationId,
        content,
        messageType: 'text',
        timestamp: new Date().toISOString()
      }
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sendTypingIndicator = (conversationId: string) => {
    return sendMessage({
      type: 'typing',
      data: {
        conversationId
      }
    });
  };

  return {
    socket,
    isConnected: useChatStore((state) => state.isConnected),
    error,
    sendMessage,
    sendChatMessage,
    sendTypingIndicator
  };
};
