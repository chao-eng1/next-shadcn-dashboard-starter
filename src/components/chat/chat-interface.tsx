'use client';

import React, { useEffect, useState } from 'react';
import { useChatStore } from '@/store/chat-store';
import { useWebSocketChat } from '@/hooks/use-websocket-chat';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { FloatingChatTrigger } from './floating-chat-trigger';
import { FloatingChatWindow } from './floating-chat-window';
import { MobileChatInterface } from './mobile-chat-interface';
import { ChatErrorBoundary } from './chat-error-boundary';
import { ChatInterfaceProps } from '@/types/chat';

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  triggerPosition = { x: 20, y: 20 },
  windowPosition = { x: 100, y: 100 },
  windowSize = { width: 380, height: 580 },
  enableMobile = true,
  enableWebSocket = true
}) => {
  const [mounted, setMounted] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { isVisible, toggleVisibility } = useChatStore();
  const { handleError } = useErrorHandler();

  // WebSocket连接
  const { isConnected, error } = useWebSocketChat('/chat', {
    autoConnect: enableWebSocket,
    reconnectAttempts: 5,
    reconnectDelay: 1000
  });

  // 处理WebSocket错误
  useEffect(() => {
    if (error) {
      handleError(error, 'WebSocket连接');
    }
  }, [error, handleError]);

  // 确保组件在客户端挂载后再渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleChatError = (error: Error, errorInfo: React.ErrorInfo) => {
    handleError(error, '聊天界面');
    console.error('Chat interface error:', error, errorInfo);
  };

  const handleRetry = () => {
    // 重置聊天状态或重新连接
    window.location.reload();
  };

  return (
    <ChatErrorBoundary onError={handleChatError} onRetry={handleRetry}>
      {/* 浮动触发按钮 */}
      <FloatingChatTrigger size='default' draggable={true} snapToEdge={true} />

      {/* 桌面端浮动窗口 */}
      {!isMobile && (
        <FloatingChatWindow
          initialPosition={windowPosition}
          initialSize={windowSize}
        />
      )}

      {/* 移动端全屏界面 */}
      {isMobile && enableMobile && isVisible && (
        <MobileChatInterface onClose={toggleVisibility} showSidebar={false} />
      )}
    </ChatErrorBoundary>
  );
};

// 创建一个简单的媒体查询hook
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // 检查是否在客户端环境
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}
