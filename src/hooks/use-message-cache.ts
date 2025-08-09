import { useRef, useCallback } from 'react';
import LRU from 'lru-cache';
import { Message, UseMessageCacheOptions } from '@/types/chat';

export const useMessageCache = (options: UseMessageCacheOptions = {}) => {
  const {
    maxSize = 1000,
    ttl = 1000 * 60 * 30 // 30分钟
  } = options;

  const cache = useRef(
    new LRU<string, Message>({
      max: maxSize,
      ttl
    })
  );

  const getMessages = useCallback((conversationId: string): Message[] => {
    const cacheKey = `conversation:${conversationId}`;
    const cachedMessages = cache.current.get(cacheKey);
    return cachedMessages ? [cachedMessages] : [];
  }, []);

  const setMessages = useCallback(
    (conversationId: string, messages: Message[]) => {
      messages.forEach((message) => {
        const cacheKey = `message:${message.id}`;
        cache.current.set(cacheKey, message);
      });

      // 同时缓存对话的消息列表
      const conversationKey = `conversation:${conversationId}`;
      messages.forEach((message) => {
        cache.current.set(conversationKey, message);
      });
    },
    []
  );

  const addMessage = useCallback((message: Message) => {
    const cacheKey = `message:${message.id}`;
    cache.current.set(cacheKey, message);

    // 更新对话缓存
    const conversationKey = `conversation:${message.conversationId}`;
    cache.current.set(conversationKey, message);
  }, []);

  const getMessage = useCallback((messageId: string): Message | undefined => {
    const cacheKey = `message:${messageId}`;
    return cache.current.get(cacheKey);
  }, []);

  const updateMessage = useCallback(
    (messageId: string, updates: Partial<Message>) => {
      const cacheKey = `message:${messageId}`;
      const existingMessage = cache.current.get(cacheKey);

      if (existingMessage) {
        const updatedMessage = { ...existingMessage, ...updates };
        cache.current.set(cacheKey, updatedMessage);

        // 更新对话缓存
        const conversationKey = `conversation:${updatedMessage.conversationId}`;
        cache.current.set(conversationKey, updatedMessage);

        return updatedMessage;
      }

      return undefined;
    },
    []
  );

  const deleteMessage = useCallback((messageId: string) => {
    const cacheKey = `message:${messageId}`;
    const message = cache.current.get(cacheKey);

    if (message) {
      cache.current.delete(cacheKey);

      // 从对话缓存中移除
      const conversationKey = `conversation:${message.conversationId}`;
      cache.current.delete(conversationKey);

      return true;
    }

    return false;
  }, []);

  const clearCache = useCallback(() => {
    cache.current.clear();
  }, []);

  const getCacheStats = useCallback(() => {
    return {
      size: cache.current.size,
      maxSize: cache.current.max,
      calculatedSize: cache.current.calculatedSize
    };
  }, []);

  return {
    getMessages,
    setMessages,
    addMessage,
    getMessage,
    updateMessage,
    deleteMessage,
    clearCache,
    getCacheStats
  };
};
