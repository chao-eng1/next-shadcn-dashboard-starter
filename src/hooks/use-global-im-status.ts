'use client';

import { useIMStore } from '@/store/im-store';

/**
 * 用于获取IM未读消息计数的hook
 * 专门为sidebar等全局组件提供未读消息状态
 */
export function useGlobalIMStatus() {
  const { 
    totalUnreadCount,
    conversationUnreadCounts,
    currentUser,
    isConnected 
  } = useIMStore();

  return {
    /** 总未读消息数量 */
    totalUnreadCount,
    /** 各会话的未读消息计数 */
    conversationUnreadCounts,
    /** 当前用户 */
    currentUser,
    /** WebSocket连接状态 */
    isConnected,
    /** 是否有未读消息 */
    hasUnreadMessages: totalUnreadCount > 0
  };
}