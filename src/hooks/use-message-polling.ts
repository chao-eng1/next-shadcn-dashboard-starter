'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from './use-auth';

interface UseMessagePollingOptions {
  enabled?: boolean;
  interval?: number; // 轮询间隔（毫秒）
  pauseWhenHidden?: boolean; // 页面不可见时暂停轮询
}

interface UseMessagePollingReturn {
  isPolling: boolean;
  lastPolled: Date | null;
  startPolling: () => void;
  stopPolling: () => void;
  pausePolling: () => void;
  resumePolling: () => void;
}

export function useMessagePolling(
  callback: () => Promise<void> | void,
  options: UseMessagePollingOptions = {}
): UseMessagePollingReturn {
  const {
    enabled = true,
    interval = 20000, // 默认20秒
    pauseWhenHidden = true
  } = options;

  const { user } = useAuth();
  const [isPolling, setIsPolling] = useState(false);
  const [lastPolled, setLastPolled] = useState<Date | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // 更新回调引用
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 执行轮询回调
  const executeCallback = async () => {
    try {
      await callbackRef.current();
      setLastPolled(new Date());
    } catch (error) {
      console.error('Message polling callback error:', error);
    }
  };

  // 启动轮询
  const startPolling = () => {
    if (!user || !enabled || isPolling) return;

    console.log(`Starting message polling with ${interval}ms interval`);
    setIsPolling(true);

    // 立即执行一次
    executeCallback();

    // 设置定时器
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        console.log('Message polling tick...');
        executeCallback();
      }
    }, interval);
  };

  // 停止轮询
  const stopPolling = () => {
    console.log('Stopping message polling');
    setIsPolling(false);
    setIsPaused(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // 暂停轮询
  const pausePolling = () => {
    console.log('Pausing message polling');
    setIsPaused(true);
  };

  // 恢复轮询
  const resumePolling = () => {
    console.log('Resuming message polling');
    setIsPaused(false);
  };

  // 页面可见性变化处理
  useEffect(() => {
    if (!pauseWhenHidden) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Page hidden, pausing message polling');
        pausePolling();
      } else {
        console.log('Page visible, resuming message polling');
        resumePolling();
        // 页面重新可见时立即执行一次
        if (isPolling) {
          executeCallback();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseWhenHidden, isPolling]);

  // 自动启动/停止轮询
  useEffect(() => {
    if (user && enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [user?.id, enabled, interval]);

  return {
    isPolling,
    lastPolled,
    startPolling,
    stopPolling,
    pausePolling,
    resumePolling
  };
}
