'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { MessageSquare, Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUnreadMessages } from '@/hooks/use-unread-messages';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';

interface UnreadMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  conversationName: string;
}

interface GlobalUnreadNotificationsProps {
  className?: string;
}

export function GlobalUnreadNotifications({
  className
}: GlobalUnreadNotificationsProps) {
  const [notifications, setNotifications] = useState<UnreadMessage[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>('default');
  const { unreadCount, incrementUnreadCount } = useUnreadMessages();
  const router = useRouter();
  const pathname = usePathname();

  // 请求通知权限
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);

      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission);
        });
      }
    }
  }, []);

  // 监听未读计数更新事件
  useEffect(() => {
    const handleUnreadCountUpdate = (event: CustomEvent) => {
      console.log(
        'Global notifications: Received unread count update:',
        event.detail.conversationId || event.detail.id
      );

      const { message, isOnMessagePage, conversationId } = event.detail;

      // 确保消息数据存在
      if (!message) {
        console.log('Global notifications: No message data in event');
        return;
      }

      // 如果不在消息页面，显示通知
      if (!isOnMessagePage) {
        console.log(
          'Showing notification for new message from:',
          message.sender?.name || message.senderName || '未知用户'
        );

        // 增加未读计数
        incrementUnreadCount(1);

        // 添加到通知列表
        const newNotification: UnreadMessage = {
          id: message.id,
          content: message.content,
          sender: {
            id: message.sender?.id || message.senderId || '',
            name: message.sender?.name || message.senderName || '未知用户',
            avatar: message.sender?.avatar || message.senderImage
          },
          timestamp: message.timestamp || message.createdAt || new Date(),
          conversationName: message.conversationName || '消息通知'
        };

        setNotifications((prev) => {
          // 避免重复通知
          if (prev.some((n) => n.id === message.id)) {
            return prev;
          }
          const updated = [newNotification, ...prev.slice(0, 4)]; // 最多保留5条
          return updated;
        });

        // 显示浏览器原生通知
        if (notificationPermission === 'granted') {
          const senderName =
            message.sender?.name || message.senderName || '未知用户';
          const conversationName = message.conversationName || '消息通知';

          const notification = new Notification(
            `${senderName} - ${conversationName}`,
            {
              body: message.content,
              icon:
                message.sender?.avatar || message.senderImage || '/favicon.ico',
              tag: `message-${message.id}`,
              requireInteraction: false,
              silent: false
            }
          );

          notification.onclick = () => {
            window.focus();
            router.push(
              `/dashboard/messages?conversation=${conversationId || message.conversationId}`
            );
            notification.close();
          };

          // 5秒后自动关闭
          setTimeout(() => {
            notification.close();
          }, 5000);
        }

        // 显示toast通知
        toast.success(
          <div className='flex items-center gap-3'>
            <Avatar className='h-8 w-8'>
              <AvatarImage src={message.sender.avatar} />
              <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-medium'>{message.sender.name}</p>
              <p className='text-muted-foreground truncate text-xs'>
                {message.conversationName}: {message.content}
              </p>
            </div>
          </div>,
          {
            duration: 5000,
            action: {
              label: '查看',
              onClick: () => {
                router.push(
                  `/dashboard/messages?conversation=${conversationId}`
                );
              }
            }
          }
        );

        // 显示浮动通知
        setIsVisible(true);

        // 3秒后自动隐藏浮动通知
        setTimeout(() => {
          setIsVisible(false);
        }, 3000);
      }
    };

    const handleConversationRead = (event: CustomEvent) => {
      console.log(
        'Global notifications: Conversation marked as read, refreshing unread count'
      );
      // 当会话被标记为已读时，刷新全局未读计数
      // 这里我们不能直接减少计数，因为不知道具体减少了多少
      // 所以触发一次完整的重新获取
      setTimeout(() => {
        // 延迟一点时间确保服务器端已经处理完成
        const refreshEvent = new CustomEvent('refreshUnreadCount');
        window.dispatchEvent(refreshEvent);
      }, 500);
    };

    // 监听多种消息事件
    window.addEventListener(
      'unreadCountUpdate',
      handleUnreadCountUpdate as EventListener
    );
    window.addEventListener(
      'newMessage',
      handleUnreadCountUpdate as EventListener
    );
    window.addEventListener(
      'conversationRead',
      handleConversationRead as EventListener
    );

    return () => {
      window.removeEventListener(
        'unreadCountUpdate',
        handleUnreadCountUpdate as EventListener
      );
      window.removeEventListener(
        'newMessage',
        handleUnreadCountUpdate as EventListener
      );
      window.removeEventListener(
        'conversationRead',
        handleConversationRead as EventListener
      );
    };
  }, [incrementUnreadCount, router]);

  // 监听路径变化，如果进入消息页面则清除通知
  useEffect(() => {
    if (pathname.includes('/messages')) {
      setNotifications([]);
      setIsVisible(false);
    }
  }, [pathname]);

  // 监听页面可见性变化，当页面重新获得焦点时刷新未读计数
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && pathname.includes('/messages')) {
        // 页面重新获得焦点且在消息页面，清除通知
        setNotifications([]);
        setIsVisible(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname]);

  // 处理通知点击
  const handleNotificationClick = (notification: UnreadMessage) => {
    router.push('/dashboard/messages');
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    setIsVisible(false);
  };

  // 关闭所有通知
  const handleCloseAll = () => {
    setNotifications([]);
    setIsVisible(false);
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className={cn('fixed top-4 right-4 z-50 w-80 space-y-2', className)}>
      {/* 通知头部 */}
      <Card className='border-l-4 border-l-blue-500 shadow-lg'>
        <CardContent className='p-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Bell className='h-4 w-4 text-blue-500' />
              <span className='text-sm font-medium'>新消息通知</span>
              <Badge variant='secondary' className='text-xs'>
                {notifications.length}
              </Badge>
            </div>
            <Button
              variant='ghost'
              size='sm'
              className='h-6 w-6 p-0'
              onClick={handleCloseAll}
            >
              <X className='h-3 w-3' />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 通知列表 */}
      {notifications.slice(0, 3).map((notification) => (
        <Card
          key={notification.id}
          className='cursor-pointer shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl'
          onClick={() => handleNotificationClick(notification)}
        >
          <CardContent className='p-3'>
            <div className='flex items-start gap-3'>
              <Avatar className='h-8 w-8 flex-shrink-0'>
                <AvatarImage src={notification.sender.avatar} />
                <AvatarFallback className='text-xs'>
                  {notification.sender.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className='min-w-0 flex-1'>
                <div className='mb-1 flex items-center gap-2'>
                  <span className='truncate text-sm font-medium'>
                    {notification.sender.name}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    {format(notification.timestamp, 'HH:mm', { locale: zhCN })}
                  </span>
                </div>

                <p className='text-muted-foreground mb-1 text-xs'>
                  {notification.conversationName}
                </p>

                <p className='line-clamp-2 text-sm'>{notification.content}</p>
              </div>

              <MessageSquare className='h-4 w-4 flex-shrink-0 text-blue-500' />
            </div>
          </CardContent>
        </Card>
      ))}

      {/* 查看更多 */}
      {notifications.length > 3 && (
        <Card className='shadow-lg'>
          <CardContent className='p-2'>
            <Button
              variant='ghost'
              size='sm'
              className='w-full text-xs'
              onClick={() => router.push('/dashboard/messages')}
            >
              查看全部 {notifications.length} 条消息
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
