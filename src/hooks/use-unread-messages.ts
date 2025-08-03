'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';

// 全局状态管理，避免重复API调用
let globalUnreadCount = 0;
let globalLoading = false;
let subscribers: Set<(count: number, loading: boolean) => void> = new Set();
let lastFetchTime = 0;
const FETCH_COOLDOWN = 5000; // 5秒冷却时间

const notifySubscribers = (count: number, loading: boolean) => {
  globalUnreadCount = count;
  globalLoading = loading;
  subscribers.forEach((callback) => callback(count, loading));
};

const fetchUnreadCountGlobal = async (userId: string) => {
  const now = Date.now();
  if (now - lastFetchTime < FETCH_COOLDOWN) {
    return; // 在冷却时间内，不重复请求
  }

  lastFetchTime = now;
  notifySubscribers(globalUnreadCount, true);

  try {
    const response = await fetch('/api/user-messages/unread-count');
    if (response.ok) {
      const data = await response.json();
      notifySubscribers(data.data.unreadCount || 0, false);
    }
  } catch (error) {
    console.error('Error fetching unread count:', error);
    notifySubscribers(globalUnreadCount, false);
  }
};

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(globalUnreadCount);
  const [loading, setLoading] = useState(globalLoading);
  const { user } = useAuth();
  const subscriberRef = useRef<(count: number, loading: boolean) => void>();

  // 创建订阅回调
  useEffect(() => {
    const callback = (count: number, loading: boolean) => {
      setUnreadCount(count);
      setLoading(loading);
    };
    subscriberRef.current = callback;
    subscribers.add(callback);

    return () => {
      if (subscriberRef.current) {
        subscribers.delete(subscriberRef.current);
      }
    };
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) {
      notifySubscribers(0, false);
      return;
    }
    await fetchUnreadCountGlobal(user.id);
  }, [user?.id]);

  // 减少未读数量（当用户标记消息为已读时）
  const decrementUnreadCount = useCallback((count = 1) => {
    const newCount = Math.max(0, globalUnreadCount - count);
    notifySubscribers(newCount, false);
  }, []);

  // 增加未读数量（当收到新消息时）
  const incrementUnreadCount = useCallback((count = 1) => {
    const newCount = globalUnreadCount + count;
    notifySubscribers(newCount, false);
  }, []);

  // 重置未读数量
  const resetUnreadCount = useCallback(() => {
    notifySubscribers(0, false);
  }, []);

  useEffect(() => {
    if (user?.id) {
      // 只在用户ID变化时获取一次
      fetchUnreadCountGlobal(user.id);
    }
  }, [user?.id]);

  return {
    unreadCount,
    loading,
    fetchUnreadCount,
    decrementUnreadCount,
    incrementUnreadCount,
    resetUnreadCount
  };
}
