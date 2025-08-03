'use client';

import { useEffect, useRef, useState } from 'react';
import { useIM } from '@/hooks/useIM';

/**
 * 全局IM提供者组件
 * 在dashboard布局中初始化IM系统，确保未读消息提示在所有页面都能显示
 */
export function GlobalIMProvider({ children }: { children: React.ReactNode }) {
  const { 
    initialize, 
    cleanup, 
    loadConversations, 
    currentUser 
  } = useIM();

  const [isInitialized, setIsInitialized] = useState(false);

  // 使用ref来避免无限循环
  const initializeRef = useRef(initialize);
  const cleanupRef = useRef(cleanup);
  const loadConversationsRef = useRef(loadConversations);

  // 更新refs
  useEffect(() => {
    initializeRef.current = initialize;
    cleanupRef.current = cleanup;
    loadConversationsRef.current = loadConversations;
  });

  useEffect(() => {
    if (!isInitialized) {
      // 在dashboard加载时初始化IM系统
      initializeRef.current();
      setIsInitialized(true);
    }

    // 组件卸载时清理
    return () => {
      cleanupRef.current();
    };
  }, [isInitialized]); // 只在初始化状态改变时执行

  // 当用户信息可用时，加载会话列表以获取未读计数
  useEffect(() => {
    if (currentUser && isInitialized) {
      // 加载私聊会话来获取未读消息计数
      loadConversationsRef.current('private');
    }
  }, [currentUser, isInitialized]); // 依赖currentUser和初始化状态

  return <>{children}</>;
}