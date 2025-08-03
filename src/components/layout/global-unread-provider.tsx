'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useGlobalUnreadStatus } from '@/hooks/use-global-unread-status';

interface GlobalUnreadContextType {
  systemUnreadCount: number;
  imUnreadCount: number;
  totalUnreadCount: number;
  hasUnreadMessages: boolean;
  hasSystemUnread: boolean;
  hasIMUnread: boolean;
  isLoading: boolean;
}

const GlobalUnreadContext = createContext<GlobalUnreadContextType | undefined>(undefined);

/**
 * 全局未读消息提供者组件
 * 为整个应用提供未读消息状态
 */
export function GlobalUnreadProvider({ children }: { children: React.ReactNode }) {
  const unreadStatus = useGlobalUnreadStatus();

  // 监听未读消息变化，可以在这里添加全局通知逻辑
  useEffect(() => {
    if (unreadStatus.totalUnreadCount > 0) {
      // 可以在这里添加全局通知逻辑，比如桌面通知
      console.log(`全局未读消息: ${unreadStatus.totalUnreadCount} 条`);
    }
  }, [unreadStatus.totalUnreadCount]);

  const contextValue: GlobalUnreadContextType = {
    systemUnreadCount: unreadStatus.systemUnreadCount,
    imUnreadCount: unreadStatus.imUnreadCount,
    totalUnreadCount: unreadStatus.totalUnreadCount,
    hasUnreadMessages: unreadStatus.hasUnreadMessages,
    hasSystemUnread: unreadStatus.hasSystemUnread,
    hasIMUnread: unreadStatus.hasIMUnread,
    isLoading: unreadStatus.isLoading
  };

  return (
    <GlobalUnreadContext.Provider value={contextValue}>
      {children}
    </GlobalUnreadContext.Provider>
  );
}

/**
 * 使用全局未读消息状态的hook
 */
export function useGlobalUnread() {
  const context = useContext(GlobalUnreadContext);
  if (context === undefined) {
    throw new Error('useGlobalUnread must be used within a GlobalUnreadProvider');
  }
  return context;
}