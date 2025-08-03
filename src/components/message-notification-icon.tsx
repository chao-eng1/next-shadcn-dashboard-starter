'use client';

import React from 'react';
import { Bell, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useUnreadMessages } from '@/hooks/use-unread-messages';
import { useRecentMessages } from '@/hooks/use-recent-messages';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface MessageNotificationIconProps {
  className?: string;
}

export function MessageNotificationIcon({ className }: MessageNotificationIconProps) {
  const router = useRouter();
  const { unreadCount, loading } = useUnreadMessages();
  const { messages, loading: messagesLoading } = useRecentMessages(5);

  const handleViewAll = () => {
    router.push('/dashboard/messages');
  };

  const handleMessageClick = (messageId: string) => {
    router.push(`/dashboard/messages?messageId=${messageId}`);
  };

  const displayCount = unreadCount > 99 ? '99+' : unreadCount.toString();
  const hasUnread = unreadCount > 0;

  return (
    <div className={cn('relative', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
            disabled={loading}
          >
            <Bell 
              className={cn(
                'h-4 w-4 transition-all duration-200',
                hasUnread && 'text-primary animate-pulse'
              )} 
            />
            
            {/* 未读消息徽章 */}
            {hasUnread && (
              <Badge 
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs font-medium flex items-center justify-center rounded-full border-2 border-background animate-in fade-in-0 zoom-in-50 duration-200"
              >
                {displayCount}
              </Badge>
            )}
            
            {/* 加载状态指示器 */}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse" />
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>消息通知</span>
            {hasUnread && (
              <span className="text-xs text-muted-foreground">
                {unreadCount} 条未读
              </span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {messagesLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              加载中...
            </div>
          ) : messages.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              暂无未读消息
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <DropdownMenuItem
                  key={message.id}
                  className="p-3 cursor-pointer hover:bg-accent"
                  onClick={() => handleMessageClick(message.id)}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={message.sender.image} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground truncate">
                          {message.sender.name}
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground ml-2">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDistanceToNow(new Date(message.createdAt), {
                            addSuffix: true,
                            locale: zhCN
                          })}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {message.preview}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-center justify-center text-sm font-medium text-primary cursor-pointer"
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