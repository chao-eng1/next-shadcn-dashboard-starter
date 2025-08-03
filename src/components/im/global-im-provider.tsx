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

  // 当用户信息可用时，加载所有会话列表以获取未读计数
  useEffect(() => {
    if (currentUser && isInitialized) {
      // 加载所有类型的会话来获取完整的未读消息计数
      const loadAllConversations = async () => {
        try {
          // 并行加载私聊和项目会话
          await Promise.all([
            loadConversationsRef.current('private'),
            loadConversationsRef.current('project')
          ]);
          console.log('全局IM数据加载完成');
        } catch (error) {
          console.error('加载会话数据失败:', error);
        }
      };
      
      loadAllConversations();
    }
  }, [currentUser, isInitialized]); // 依赖currentUser和初始化状态

  return <>{children}</>;
}