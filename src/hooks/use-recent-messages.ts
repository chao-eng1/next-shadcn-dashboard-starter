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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // eslint-disable-next-line react-hooks/exhaustive-deps
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

      setMessages(messagesData.data?.messages || []);
      setUnreadCount(unreadData.data || null);
    } catch (err) {
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

    // 立即执行一次
    fetchRecentMessages();

    // 设置轮询定时器
    const pollInterval = setInterval(() => {
      fetchRecentMessages();
    }, 20000); // 20秒轮询一次

    return () => {
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
