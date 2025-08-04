'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';

interface RecentMessage {
  id: string;
  content: string;
  messageType: 'system' | 'project' | 'private';
  createdAt: string;
  preview: string;
  source: string; // 消息来源描述
  sender: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface UnreadCount {
  total: number;
  breakdown: {
    system: number;
    project: number;
    private: number;
  };
}

interface UseRecentMessagesReturn {
  messages: RecentMessage[];
  unreadCount: UnreadCount | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRecentMessages(limit: number = 5): UseRecentMessagesReturn {
  const [messages, setMessages] = useState<RecentMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState<UnreadCount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRecentMessages = useCallback(async () => {
    if (!user) {
      setMessages([]);
      setUnreadCount(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 并行获取最近消息和未读数量
      const [messagesResponse, unreadResponse] = await Promise.all([
        fetch(`/api/user-messages/recent?limit=${limit}`),
        fetch('/api/message-center/unread-count')
      ]);

      if (!messagesResponse.ok) {
        throw new Error('获取最近消息失败');
      }

      if (!unreadResponse.ok) {
        throw new Error('获取未读数量失败');
      }

      const messagesData = await messagesResponse.json();
      const unreadData = await unreadResponse.json();

      // console.log('useRecentMessages: API response data:', messagesData);
      // console.log('useRecentMessages: Unread count data:', unreadData);

      setMessages(messagesData.data?.messages || []);
      setUnreadCount(unreadData.data || null);
    } catch (err) {
      console.error('Error fetching recent messages:', err);
      setError(err instanceof Error ? err.message : '获取消息数据失败');
      setMessages([]);
      setUnreadCount(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, limit]); // 只依赖user.id和limit

  // 初始加载
  useEffect(() => {
    fetchRecentMessages();
  }, [user, limit]);

  // 轮询机制 - 每20秒检查一次未读消息
  useEffect(() => {
    if (!user) return;

    console.log('useRecentMessages: Starting polling for user:', user.id);

    // 立即执行一次
    fetchRecentMessages();

    // 设置轮询定时器
    const pollInterval = setInterval(() => {
      console.log('useRecentMessages: Polling for new messages...');
      fetchRecentMessages();
    }, 20000); // 20秒轮询一次

    return () => {
      console.log('useRecentMessages: Stopping polling');
      clearInterval(pollInterval);
    };
  }, [user?.id, fetchRecentMessages]);

  return {
    messages,
    unreadCount,
    loading,
    error,
    refetch: fetchRecentMessages
  };
}
