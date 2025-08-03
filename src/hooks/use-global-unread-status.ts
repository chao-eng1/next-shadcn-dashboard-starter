'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { useUnreadMessages } from './use-unread-messages';
import { useGlobalIMStatus } from './use-global-im-status';

/**
 * 全局未读消息状态管理hook
 * 整合系统消息和IM消息的未读计数
 */
export function useGlobalUnreadStatus() {
  const { user } = useAuth();
  const { unreadCount: systemUnreadCount, loading: systemLoading } = useUnreadMessages();
  const { totalUnreadCount: imUnreadCount, hasUnreadMessages: hasIMUnread } = useGlobalIMStatus();
  
  // 总未读消息数量
  const totalUnreadCount = systemUnreadCount + imUnreadCount;
  
  // 是否有未读消息
  const hasUnreadMessages = totalUnreadCount > 0;
  
  // 是否正在加载
  const isLoading = systemLoading;
  
  // 获取未读消息详情
  const getUnreadDetails = useCallback(() => {
    return {
      system: {
        count: systemUnreadCount,
        hasUnread: systemUnreadCount > 0
      },
      im: {
        count: imUnreadCount,
        hasUnread: hasIMUnread
      },
      total: {
        count: totalUnreadCount,
        hasUnread: hasUnreadMessages
      }
    };
  }, [systemUnreadCount, imUnreadCount, totalUnreadCount, hasUnreadMessages, hasIMUnread]);
  
  // 更新浏览器标题栏显示未读计数
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalTitle = document.title.replace(/^\(\d+\)\s*/, '');
      
      if (totalUnreadCount > 0) {
        document.title = `(${totalUnreadCount}) ${originalTitle}`;
      } else {
        document.title = originalTitle;
      }
    }
  }, [totalUnreadCount]);
  
  return {
    /** 系统消息未读数量 */
    systemUnreadCount,
    /** IM消息未读数量 */
    imUnreadCount,
    /** 总未读消息数量 */
    totalUnreadCount,
    /** 是否有未读消息 */
    hasUnreadMessages,
    /** 是否有系统未读消息 */
    hasSystemUnread: systemUnreadCount > 0,
    /** 是否有IM未读消息 */
    hasIMUnread,
    /** 是否正在加载 */
    isLoading,
    /** 获取未读消息详情 */
    getUnreadDetails,
    /** 当前用户 */
    user
  };
}