import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface WebSocketMessage {
  type: 'message' | 'typing' | 'read' | 'join' | 'leave' | 'error' | 'connected' | 'user_status';
  data: {
    conversationId?: string;
    content?: string;
    messageType?: 'text' | 'image' | 'file';
    timestamp?: string;
    messageId?: string;
    senderId?: string;
    receiverId?: string;
    userId?: string;
    status?: 'online' | 'away' | 'offline';
    metadata?: any;
  };
}

interface UseWebSocketOptions {
  url: string;
  token: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const useWebSocket = ({
  url,
  token,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  autoReconnect = true,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5
}: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isManualClose = useRef(false);

  // 使用ref存储函数引用以避免循环依赖
  const connectRef = useRef<() => void>();
  const disconnectRef = useRef<() => void>();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    
    try {
      const wsUrl = `${url}?token=${encodeURIComponent(token)}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        setReconnectAttempts(0);
        onConnect?.();
        
        // 启动心跳检测
        heartbeatIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // 每30秒发送一次心跳
        
        toast.success('WebSocket连接已建立');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // 处理心跳响应
          if (message.type === 'pong') {
            return;
          }
          
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        onDisconnect?.();
        
        // 清除心跳检测
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
        
        if (!isManualClose.current && autoReconnect && reconnectAttempts < maxReconnectAttempts) {
          setReconnectAttempts(prev => {
            const newAttempts = prev + 1;
            if (newAttempts < maxReconnectAttempts) {
              console.log(`连接断开，${reconnectInterval / 1000}秒后尝试重连...`);
              
              reconnectTimeoutRef.current = setTimeout(() => {
                connectRef.current?.();
              }, reconnectInterval);
            } else {
              console.log('连接失败，已达到最大重连次数');
              setConnectionStatus('error');
            }
            return newAttempts;
          });
        }
      };

      wsRef.current.onerror = (error) => {
        setConnectionStatus('error');
        onError?.(error);
        console.warn('WebSocket连接错误:', error);
      };
    } catch (error) {
      setConnectionStatus('error');
      console.error('Failed to create WebSocket connection:', error);
      // 不显示错误提示，因为WebSocket服务器可能没有启动
    }
  }, [url, token, onConnect, onDisconnect, onError, onMessage, autoReconnect, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    isManualClose.current = true;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setReconnectAttempts(0);
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } else {
      // 不显示错误提示，静默处理WebSocket不可用的情况
      console.log('WebSocket连接未建立，无法发送消息');
      return false;
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnectRef.current?.();
    setTimeout(() => {
      isManualClose.current = false;
      setReconnectAttempts(0);
      connectRef.current?.();
    }, 1000);
  }, []);

  // 更新ref引用
  useEffect(() => {
    connectRef.current = connect;
    disconnectRef.current = disconnect;
  }, [connect, disconnect]);

  useEffect(() => {
    if (token) {
      isManualClose.current = false;
      connectRef.current();
    }

    return () => {
      disconnectRef.current();
    };
  }, [token]);

  return {
    isConnected,
    connectionStatus,
    reconnectAttempts,
    sendMessage,
    connect,
    disconnect,
    reconnect
  };
};

export type { WebSocketMessage };