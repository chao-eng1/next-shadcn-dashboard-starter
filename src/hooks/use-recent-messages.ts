'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';

interface RecentMessage {
  id: string;
  content: string;
  messageType: string;
  createdAt: string;
  preview: string;
  sender: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface UseRecentMessagesReturn {
  messages: RecentMessage[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRecentMessages(limit: number = 5): UseRecentMessagesReturn {
  const [messages, setMessages] = useState<RecentMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRecentMessages = useCallback(async () => {
    if (!user) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/user-messages/recent?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('获取最近消息失败');
      }
      
      const data = await response.json();
      setMessages(data.data.messages || []);
    } catch (err) {
      console.error('Error fetching recent messages:', err);
      setError(err instanceof Error ? err.message : '获取最近消息失败');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, limit]); // 只依赖user.id和limit

  useEffect(() => {
    fetchRecentMessages();
  }, [user, limit]); // 只依赖user和limit，而不是fetchRecentMessages

  return {
    messages,
    loading,
    error,
    refetch: fetchRecentMessages
  };
}