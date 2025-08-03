'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useGlobalUnreadStatus } from '@/hooks/use-global-unread-status';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

/**
 * 全局未读消息通知组件
 * 显示系统消息和IM消息的总未读计数
 */
export function GlobalUnreadNotification() {
  const router = useRouter();
  const {
    totalUnreadCount,
    systemUnreadCount,
    imUnreadCount,
    hasUnreadMessages,
    hasSystemUnread,
    hasIMUnread,
    isLoading,
    getUnreadDetails
  } = useGlobalUnreadStatus();

  const unreadDetails = getUnreadDetails();

  const handleSystemMessagesClick = () => {
    router.push('/dashboard/messages');
  };

  const handleIMClick = () => {
    router.push('/dashboard/im');
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Bell className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "relative",
            hasUnreadMessages && "text-primary"
          )}
        >
          <Bell className={cn(
            "h-4 w-4",
            hasUnreadMessages && "animate-pulse"
          )} />
          {hasUnreadMessages && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">消息通知</CardTitle>
            <CardDescription>
              {hasUnreadMessages 
                ? `您有 ${totalUnreadCount} 条未读消息` 
                : '暂无未读消息'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* 系统消息 */}
            <div 
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                hasSystemUnread 
                  ? "bg-orange-50 border-orange-200 hover:bg-orange-100 dark:bg-orange-950 dark:border-orange-800 dark:hover:bg-orange-900" 
                  : "bg-muted/50 hover:bg-muted"
              )}
              onClick={handleSystemMessagesClick}
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  hasSystemUnread ? "bg-orange-500" : "bg-gray-300"
                )} />
                <div>
                  <p className="text-sm font-medium">系统消息</p>
                  <p className="text-xs text-muted-foreground">
                    {hasSystemUnread ? `${systemUnreadCount} 条未读` : '暂无未读'}
                  </p>
                </div>
              </div>
              {hasSystemUnread && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  {systemUnreadCount}
                </Badge>
              )}
            </div>

            <Separator />

            {/* IM即时通讯 */}
            <div 
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                hasIMUnread 
                  ? "bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:border-blue-800 dark:hover:bg-blue-900" 
                  : "bg-muted/50 hover:bg-muted"
              )}
              onClick={handleIMClick}
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  hasIMUnread ? "bg-blue-500" : "bg-gray-300"
                )} />
                <div>
                  <p className="text-sm font-medium">即时通讯</p>
                  <p className="text-xs text-muted-foreground">
                    {hasIMUnread ? `${imUnreadCount} 条未读` : '暂无未读'}
                  </p>
                </div>
              </div>
              {hasIMUnread && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {imUnreadCount}
                </Badge>
              )}
            </div>

            {!hasUnreadMessages && (
              <div className="text-center py-4">
                <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">所有消息已读</p>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}