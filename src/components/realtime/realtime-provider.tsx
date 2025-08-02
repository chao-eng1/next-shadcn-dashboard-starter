'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { MessageNotificationDialog } from './message-notification-dialog';

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
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

interface RealtimeProviderProps {
  children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const { user } = useAuth();

  const [previousUnreadCount, setPreviousUnreadCount] = useState(0);

  // 检查新消息的函数
  const checkForNewMessages = async () => {
    if (!user) return;
    
    try {
      setIsConnected(true);
      
      console.log('Checking for new messages for user:', user.id);
      
      // 检查未读消息数量
      const unreadResponse = await fetch('/api/user-messages/unread-count');
      if (unreadResponse.ok) {
        const unreadData = await unreadResponse.json();
        const currentUnreadCount = unreadData.unreadCount || 0;
        
        console.log('Current unread count:', currentUnreadCount, 'Previous:', previousUnreadCount);
        
        // 如果未读数量增加，说明有新消息
        if (currentUnreadCount > previousUnreadCount) {
          const newMessagesCount = currentUnreadCount - previousUnreadCount;
          console.log('New messages detected:', newMessagesCount);
          setNewMessageCount(prev => prev + newMessagesCount);
          
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
                  },
                },
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
      } else {
        console.log('Failed to fetch unread count');
      }
    } catch (error) {
      console.error('Error checking for new messages:', error);
      setIsConnected(false);
    }
  };

  // 轮询检查新消息
  useEffect(() => {
    if (!user) return;
    
    // 立即检查一次
    checkForNewMessages();
    
    // 每5秒检查一次新消息（更频繁的检查）
    const interval = setInterval(checkForNewMessages, 5000);
    
    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [user]);

  const clearNewMessages = () => {
    setNewMessageCount(0);
    setLastMessage(null);
  };

  const refreshMessages = () => {
    // 立即检查新消息
    checkForNewMessages();
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
        refreshMessages
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