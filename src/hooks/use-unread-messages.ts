'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/user-messages/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 减少未读数量（当用户标记消息为已读时）
  const decrementUnreadCount = useCallback((count = 1) => {
    setUnreadCount(prev => Math.max(0, prev - count));
  }, []);

  // 增加未读数量（当收到新消息时）
  const incrementUnreadCount = useCallback((count = 1) => {
    setUnreadCount(prev => prev + count);
  }, []);

  // 重置未读数量
  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    
    // 设置定期刷新未读数量（每30秒）
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    fetchUnreadCount,
    decrementUnreadCount,
    incrementUnreadCount,
    resetUnreadCount
  };
}