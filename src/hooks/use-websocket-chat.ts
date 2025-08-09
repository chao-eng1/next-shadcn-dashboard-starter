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
  const [error, setError] = useState<string | null>(null);
  const reconnectCount = useRef(0);
  const { user } = useAuth();
  const { setConnected, addMessage, setTyping } = useChatStore();

  useEffect(() => {
    if (!autoConnect || !user) return;

    const connect = () => {
      try {
        const wsUrl = `ws://localhost:3001${namespace}?token=${encodeURIComponent(user.token || '')}`;
        const newSocket = new WebSocket(wsUrl);

        newSocket.onopen = () => {
          setConnected(true);
          setError(null);
          reconnectCount.current = 0;
          console.log('AI Chat WebSocket connected');
        };

        newSocket.onmessage = (event) => {
          try {
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
                console.error('WebSocket error:', message.data);
                setError(message.data.content || 'Unknown error');
                break;

              default:
                console.log('Unknown message type:', message.type);
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        newSocket.onclose = (event) => {
          setConnected(false);
          console.log('AI Chat WebSocket disconnected');

          // 自动重连
          if (reconnectCount.current < reconnectAttempts) {
            setTimeout(() => {
              reconnectCount.current++;
              connect();
            }, reconnectDelay * reconnectCount.current);
          }
        };

        newSocket.onerror = (error) => {
          console.error('AI Chat WebSocket error:', error);
          setError('Connection error');
        };

        setSocket(newSocket);
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
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
      console.warn('WebSocket not connected, cannot send message');
      return false;
    }
  };

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
