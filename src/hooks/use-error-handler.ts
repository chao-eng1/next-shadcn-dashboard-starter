import { useCallback } from 'react';
import { toast } from 'sonner';

export const useErrorHandler = () => {
  const handleError = useCallback((error: Error | string, context?: string) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorType = getErrorType(errorMessage);

    const userMessage = getUserFriendlyMessage(errorType, errorMessage);

    // 显示用户友好的错误提示
    toast.error(userMessage, {
      description: context ? `Context: ${context}` : undefined,
      duration: 5000
    });

    // 记录详细错误信息到控制台
    console.error(`[${context || 'Unknown'}] ${errorMessage}`, error);
  }, []);

  const getErrorType = (message: string): string => {
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('unauthorized') || message.includes('401')) {
      return 'auth';
    }
    if (message.includes('server') || message.includes('500')) {
      return 'server';
    }
    if (message.includes('rate limit') || message.includes('429')) {
      return 'rate_limit';
    }
    if (message.includes('websocket') || message.includes('connection')) {
      return 'websocket';
    }
    return 'unknown';
  };

  const getUserFriendlyMessage = (
    type: string,
    originalMessage: string
  ): string => {
    switch (type) {
      case 'network':
        return '网络连接失败，请检查您的网络连接';
      case 'auth':
        return '身份验证失败，请重新登录';
      case 'server':
        return '服务器错误，请稍后重试';
      case 'rate_limit':
        return '请求过于频繁，请稍后重试';
      case 'websocket':
        return '连接中断，正在尝试重新连接...';
      default:
        return originalMessage || '发生未知错误';
    }
  };

  const handleAsyncError = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      context?: string
    ): Promise<T | null> => {
      try {
        return await asyncFn();
      } catch (error) {
        handleError(error as Error, context);
        return null;
      }
    },
    [handleError]
  );

  return {
    handleError,
    handleAsyncError
  };
};
