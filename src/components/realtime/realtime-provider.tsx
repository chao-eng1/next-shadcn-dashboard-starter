'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUnreadMessages } from '@/hooks/use-unread-messages';
import { useMessagePolling } from '@/hooks/use-message-polling';
import { toast } from 'sonner';
import { MessageNotificationDialog } from './message-notification-dialog';
import { getWebSocketService } from '@/lib/websocket-service';

interface Message {
  id: string;
  title: string;
  content: string;
  isGlobal: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
}

interface RealtimeContextType {
  isConnected: boolean;
  newMessageCount: number;
  lastMessage: Message | null;
  clearNewMessages: () => void;
  refreshMessages: () => void;
  isPolling: boolean;
  lastPolled: Date | null;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(
  undefined
);

interface RealtimeProviderProps {
  children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const { user } = useAuth();
  const { unreadCount, fetchUnreadCount } = useUnreadMessages();

  const [previousUnreadCount, setPreviousUnreadCount] = useState(0);

  // 轮询未读消息检查
  const { isPolling, lastPolled } = useMessagePolling(
    async () => {
      console.log('RealtimeProvider: Polling for new messages...');
      await fetchUnreadCount();
      await checkForNewMessages();
    },
    {
      enabled: true,
      interval: 20000, // 20秒轮询
      pauseWhenHidden: true // 页面隐藏时暂停轮询
    }
  );

  // 检查新消息的函数
  const checkForNewMessages = async () => {
    if (!user) return;

    try {
      setIsConnected(true);

      console.log('Checking for new messages for user:', user.id);

      // 使用全局状态管理的未读数量，避免重复API调用
      const currentUnreadCount = unreadCount;

      console.log(
        'Current unread count:',
        currentUnreadCount,
        'Previous:',
        previousUnreadCount
      );

      // 如果未读数量增加，说明有新消息
      if (currentUnreadCount > previousUnreadCount) {
        const newMessagesCount = currentUnreadCount - previousUnreadCount;
        console.log('New messages detected:', newMessagesCount);
        setNewMessageCount((prev) => prev + newMessagesCount);

        // 获取最新消息用于显示
        const messagesResponse = await fetch('/api/user-messages');
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          const messages = messagesData.messages || [];
          console.log('Fetched messages:', messages.length);
          const latestUnreadMessage = messages.find((msg: any) => !msg.isRead);

          if (latestUnreadMessage) {
            console.log('Latest unread message:', latestUnreadMessage);
            setLastMessage(latestUnreadMessage.message);
            setShowNotification(true);

            // 显示浮层通知
            toast.success(`收到新消息：${latestUnreadMessage.message.title}`, {
              duration: 5000,
              action: {
                label: '查看',
                onClick: () => {
                  window.location.href = '/dashboard/messages';
                }
              }
            });
          } else {
            console.log('No unread messages found in response');
          }
        } else {
          console.log('Failed to fetch user messages');
        }
      } else {
        console.log('No new messages detected');
      }

      setPreviousUnreadCount(currentUnreadCount);
    } catch (error) {
      console.error('Error checking for new messages:', error);
      setIsConnected(false);
    }
  };

  // WebSocket连接管理
  useEffect(() => {
    if (!user?.id) {
      setIsConnected(false);
      return;
    }

    const wsService = getWebSocketService();

    // 连接WebSocket
    wsService
      .connect(user.id)
      .then(() => {
        console.log('RealtimeProvider: WebSocket connected for user:', user.id);
        setIsConnected(wsService.isConnected);

        // 连接成功后，加入用户相关的房间
        // 加入全局用户房间（接收系统消息等）
        wsService.joinRoom('user', user.id);

        // 这里可以加入用户参与的所有对话房间
        // 为了简化，我们现在只加入一个通用的用户房间
        console.log('RealtimeProvider: Joined user room for:', user.id);
      })
      .catch((error) => {
        console.error('RealtimeProvider: WebSocket connection failed:', error);
        setIsConnected(false);
      });

    // 监听连接状态变化
    const handleConnectionChange = () => {
      setIsConnected(wsService.isConnected);
    };

    // 监听新消息事件
    const handleNewMessage = (data: any) => {
      console.log('RealtimeProvider: Received new message event:', data);

      // 检查是否在消息页面
      const isOnMessagePage = window.location.pathname.includes('/messages');

      if (!isOnMessagePage) {
        // 增加未读计数
        setNewMessageCount((prev) => prev + 1);

        // 更新全局未读计数
        fetchUnreadCount();

        // 显示通知
        const messageData = data.detail?.message || data;
        if (messageData) {
          setLastMessage({
            id: messageData.id,
            title:
              messageData.title ||
              messageData.content?.substring(0, 20) ||
              '新消息',
            content: messageData.content,
            isGlobal: messageData.isGlobal || false,
            createdAt:
              messageData.timestamp ||
              messageData.createdAt ||
              new Date().toISOString(),
            sender: {
              id: messageData.sender?.id || messageData.senderId || '',
              name:
                messageData.sender?.name ||
                messageData.senderName ||
                '未知用户',
              email: messageData.sender?.email || ''
            }
          });
          setShowNotification(true);
        }
      }
    };

    // 监听WebSocket事件
    wsService.on('connected', handleConnectionChange);
    wsService.on('disconnected', handleConnectionChange);
    wsService.on('message:receive', handleNewMessage);

    // 监听全局自定义事件
    window.addEventListener(
      'unreadCountUpdate',
      handleNewMessage as EventListener
    );

    return () => {
      // 清理事件监听器
      wsService.off('connected', handleConnectionChange);
      wsService.off('disconnected', handleConnectionChange);
      wsService.off('message:receive', handleNewMessage);
      window.removeEventListener(
        'unreadCountUpdate',
        handleNewMessage as EventListener
      );
    };
  }, [user?.id, fetchUnreadCount]);

  // 监听未读消息数量变化（备用方案）
  useEffect(() => {
    if (!user) return;

    // 当未读数量变化时检查新消息
    checkForNewMessages();
  }, [user?.id, unreadCount]); // 依赖user.id和unreadCount变化

  const clearNewMessages = () => {
    setNewMessageCount(0);
    setLastMessage(null);
  };

  const refreshMessages = () => {
    // 刷新未读消息数量
    fetchUnreadCount();
  };

  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  const handleViewMessage = () => {
    setShowNotification(false);
    // 导航到消息页面
    window.location.href = '/dashboard/messages';
  };

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        newMessageCount,
        lastMessage,
        clearNewMessages,
        refreshMessages,
        isPolling,
        lastPolled
      }}
    >
      {children}

      {/* 消息通知弹窗 */}
      {showNotification && lastMessage && (
        <MessageNotificationDialog
          message={lastMessage}
          isOpen={showNotification}
          onClose={handleCloseNotification}
          onView={handleViewMessage}
        />
      )}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
