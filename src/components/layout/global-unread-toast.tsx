'use client';

import React, { useEffect, useState } from 'react';
import { Bell, X, MessageSquare, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGlobalUnreadStatus } from '@/hooks/use-global-unread-status';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

/**
 * 全局未读消息浮动通知组件
 * 当有新的未读消息时显示浮动提示
 */
export function GlobalUnreadToast() {
  const router = useRouter();
  const {
    totalUnreadCount,
    systemUnreadCount,
    imUnreadCount,
    hasUnreadMessages,
    hasSystemUnread,
    hasIMUnread
  } = useGlobalUnreadStatus();

  const [isVisible, setIsVisible] = useState(false);
  const [lastUnreadCount, setLastUnreadCount] = useState(0);
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);

  // 监听未读消息数量变化
  useEffect(() => {
    // 如果未读消息数量增加，显示通知
    if (totalUnreadCount > lastUnreadCount && totalUnreadCount > 0) {
      setIsVisible(true);
      
      // 清除之前的定时器
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
      
      // 5秒后自动隐藏
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      
      setAutoHideTimer(timer);
    }
    
    setLastUnreadCount(totalUnreadCount);
    
    // 如果没有未读消息，隐藏通知
    if (totalUnreadCount === 0) {
      setIsVisible(false);
    }
  }, [totalUnreadCount, lastUnreadCount, autoHideTimer]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
    };
  }, [autoHideTimer]);

  const handleClose = () => {
    setIsVisible(false);
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
    }
  };

  const handleViewMessages = () => {
    if (hasSystemUnread && hasIMUnread) {
      // 如果两种消息都有，跳转到系统消息页面
      router.push('/dashboard/messages');
    } else if (hasSystemUnread) {
      router.push('/dashboard/messages');
    } else if (hasIMUnread) {
      router.push('/dashboard/im');
    }
    handleClose();
  };

  if (!isVisible || !hasUnreadMessages) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right-full duration-300">
      <Card className="w-80 shadow-lg border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bell className="h-5 w-5 text-primary" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
                >
                  {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                </Badge>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground">
                  新消息通知
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  您有 {totalUnreadCount} 条未读消息
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleClose}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          {/* 消息详情 */}
          <div className="mt-3 space-y-2">
            {hasSystemUnread && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Mail className="h-3 w-3 text-orange-500" />
                  <span>系统消息</span>
                </div>
                <Badge variant="secondary" className="h-5">
                  {systemUnreadCount}
                </Badge>
              </div>
            )}
            
            {hasIMUnread && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-3 w-3 text-blue-500" />
                  <span>即时通讯</span>
                </div>
                <Badge variant="secondary" className="h-5">
                  {imUnreadCount}
                </Badge>
              </div>
            )}
          </div>
          
          {/* 操作按钮 */}
          <div className="mt-4 flex space-x-2">
            <Button
              size="sm"
              className="flex-1 h-8"
              onClick={handleViewMessages}
            >
              查看消息
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={handleClose}
            >
              稍后
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}