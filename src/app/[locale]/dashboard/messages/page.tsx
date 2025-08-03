'use client';

import React from 'react';
import { MessageCenter } from '@/components/messages/message-center';
import { useMessageCenter } from '@/hooks/use-message-center';



export default function MessagesPage() {
  // 使用消息中心Hook
  const messageCenter = useMessageCenter({
    userId: 'current', // TODO: 从认证状态获取真实用户ID
    autoConnect: true,
    enableNotifications: true,
    enableTypingIndicator: true
  });

  return (
    <div className="h-full">
      <MessageCenter
        initialConversations={messageCenter.conversations}
        initialMessages={messageCenter.messages}
        currentUserId="current"
        onlineUsers={['user1', 'user2']} // TODO: 从WebSocket获取在线用户
      />
    </div>
  );
}