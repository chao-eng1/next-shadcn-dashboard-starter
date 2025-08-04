'use client';

import React, { useEffect, useState } from 'react';
import { Bell, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useUnreadMessages } from '@/hooks/use-unread-messages';
import { useRecentMessages } from '@/hooks/use-recent-messages';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';

interface MessageNotificationIconProps {
  className?: string;
}

export function MessageNotificationIcon({
  className
}: MessageNotificationIconProps) {
  const router = useRouter();
  const { unreadCount, loading, fetchUnreadCount } = useUnreadMessages();
  const { messages, loading: messagesLoading } = useRecentMessages(5);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleViewAll = () => {
    router.push('/dashboard/messages');
  };

  const handleMessageClick = (messageId: string) => {
    router.push(`/dashboard/messages?messageId=${messageId}`);
  };

  const displayCount = unreadCount > 99 ? '99+' : unreadCount.toString();
  const hasUnread = unreadCount > 0;

  // 监听实时消息事件
  useEffect(() => {
    const handleNewMessage = () => {
      setIsAnimating(true);
      fetchUnreadCount();

      setTimeout(() => {
        setIsAnimating(false);
      }, 1000);
    };

    const handleUnreadCountUpdate = () => {
      setIsAnimating(true);
      fetchUnreadCount();

      setTimeout(() => {
        setIsAnimating(false);
      }, 1000);
    };

    window.addEventListener('newMessage', handleNewMessage);
    window.addEventListener('unreadCountUpdate', handleUnreadCountUpdate);

    return () => {
      window.removeEventListener('newMessage', handleNewMessage);
      window.removeEventListener('unreadCountUpdate', handleUnreadCountUpdate);
    };
  }, [fetchUnreadCount]);

  return (
    <div className={cn('relative', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='hover:bg-accent hover:text-accent-foreground relative h-9 w-9 transition-colors duration-200'
            disabled={loading}
          >
            <Bell
              className={cn(
                'h-4 w-4 transition-all duration-200',
                hasUnread && 'text-primary animate-pulse',
                isAnimating && 'animate-bounce'
              )}
            />

            {/* 未读消息徽章 */}
            {hasUnread && (
              <Badge
                variant='destructive'
                className={cn(
                  'border-background animate-in fade-in-0 zoom-in-50 absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 px-1 text-xs font-medium duration-200',
                  isAnimating && 'scale-110 animate-pulse'
                )}
              >
                {displayCount}
              </Badge>
            )}

            {/* 加载状态指示器 */}
            {loading && (
              <div className='absolute inset-0 flex items-center justify-center'>
                <div className='bg-muted-foreground h-2 w-2 animate-pulse rounded-full' />
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-80'>
          <DropdownMenuLabel className='flex items-center justify-between'>
            <span>消息通知</span>
            {hasUnread && (
              <span className='text-muted-foreground text-xs'>
                {unreadCount} 条未读
              </span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {messagesLoading ? (
            <div className='text-muted-foreground p-4 text-center text-sm'>
              加载中...
            </div>
          ) : messages.length === 0 ? (
            <div className='text-muted-foreground p-4 text-center text-sm'>
              暂无未读消息
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <DropdownMenuItem
                  key={message.id}
                  className='hover:bg-accent cursor-pointer p-3'
                  onClick={() => handleMessageClick(message.id)}
                >
                  <div className='flex w-full items-start space-x-3'>
                    <Avatar className='h-8 w-8 flex-shrink-0'>
                      <AvatarImage src={message.sender.image} />
                      <AvatarFallback>
                        <User className='h-4 w-4' />
                      </AvatarFallback>
                    </Avatar>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center justify-between'>
                        <p className='text-foreground truncate text-sm font-medium'>
                          {message.sender.name}
                        </p>
                        <div className='text-muted-foreground ml-2 flex items-center text-xs'>
                          <Clock className='mr-1 h-3 w-3' />
                          {formatDistanceToNow(new Date(message.createdAt), {
                            addSuffix: true,
                            locale: zhCN
                          })}
                        </div>
                      </div>
                      <p className='text-muted-foreground mt-0.5 text-xs'>
                        {(message as any).source || '消息'}
                      </p>
                      <p className='text-muted-foreground mt-1 line-clamp-2 text-sm'>
                        {message.preview}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='text-primary cursor-pointer justify-center text-center text-sm font-medium'
                onClick={handleViewAll}
              >
                查看全部消息
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default MessageNotificationIcon;
