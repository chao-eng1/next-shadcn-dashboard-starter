'use client';

import React, { memo, useMemo } from 'react';
import { ConversationItem, type Conversation } from './conversation-item';

// 重新导出类型以保持兼容性
export type { Conversation };

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onConversationClick: (conversation: Conversation) => void;
}

// 自定义比较函数，避免不必要的重新渲染
const arePropsEqual = (
  prevProps: ConversationListProps,
  nextProps: ConversationListProps
) => {
  // 检查对话数组长度
  if (prevProps.conversations.length !== nextProps.conversations.length) {
    return false;
  }

  // 检查选中的对话
  if (
    prevProps.selectedConversation?.id !== nextProps.selectedConversation?.id
  ) {
    return false;
  }

  // 检查回调函数引用
  if (prevProps.onConversationClick !== nextProps.onConversationClick) {
    return false;
  }

  // 检查每个对话的关键属性
  for (let i = 0; i < prevProps.conversations.length; i++) {
    const prev = prevProps.conversations[i];
    const next = nextProps.conversations[i];

    if (
      prev.id !== next.id ||
      prev.name !== next.name ||
      prev.unreadCount !== next.unreadCount ||
      prev.isPinned !== next.isPinned ||
      prev.isMuted !== next.isMuted ||
      prev.lastActivity.getTime() !== next.lastActivity.getTime() ||
      prev.lastMessage?.content !== next.lastMessage?.content
    ) {
      return false;
    }
  }

  return true;
};

const ConversationList = memo(function ConversationList({
  conversations,
  selectedConversation,
  onConversationClick
}: ConversationListProps) {
  // 排序会话：置顶 > 未读 > 最后活动时间 - 使用 useMemo 优化性能
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      // 置顶的会话优先
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // 有未读消息的优先
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;

      // 按最后活动时间排序
      return b.lastActivity.getTime() - a.lastActivity.getTime();
    });
  }, [conversations]);

  if (conversations.length === 0) {
    return (
      <div className='flex h-32 items-center justify-center text-gray-500'>
        <p className='text-sm'>暂无会话</p>
      </div>
    );
  }

  return (
    <div className='space-y-1 p-2'>
      {sortedConversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isSelected={selectedConversation?.id === conversation.id}
          onConversationClick={onConversationClick}
        />
      ))}
    </div>
  );
}, arePropsEqual);

export { ConversationList };
