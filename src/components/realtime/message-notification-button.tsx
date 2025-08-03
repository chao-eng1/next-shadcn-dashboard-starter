'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { useRealtime } from '../realtime/realtime-provider';
import { useUnreadMessages } from '@/hooks/use-unread-messages';
import { cn } from '@/lib/utils';

export function MessageNotificationButton() {
  const { newMessageCount } = useRealtime();
  const { unreadCount } = useUnreadMessages();

  // 显示实时新消息数量或总未读数量
  const displayCount = newMessageCount > 0 ? newMessageCount : unreadCount;
  const hasNotifications = displayCount > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          className={cn(
            'relative h-9 w-9 p-0 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800',
            hasNotifications && 'animate-pulse'
          )}
        >
          <Bell
            className={cn(
              'h-5 w-5 transition-colors duration-200',
              hasNotifications
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            )}
          />

          {hasNotifications && (
            <>
              {/* 数字徽标 */}
              <Badge
                variant='destructive'
                className='absolute -top-1 -right-1 flex h-5 w-5 animate-bounce items-center justify-center rounded-full p-0 text-xs font-bold'
              >
                {displayCount > 99 ? '99+' : displayCount}
              </Badge>

              {/* 脉冲动画圆点 */}
              <div className='absolute -top-1 -right-1 h-5 w-5 animate-ping rounded-full bg-red-500 opacity-75' />
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className='w-80 border-0 bg-white p-0 shadow-lg dark:bg-gray-900'
        align='end'
        sideOffset={8}
      >
        <div className='border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4 dark:border-gray-700 dark:from-blue-950/50 dark:to-purple-950/50'>
          <div className='flex items-center justify-between'>
            <h3 className='flex items-center gap-2 font-semibold text-gray-900 dark:text-white'>
              <Bell className='h-4 w-4' />
              消息通知
            </h3>
            {hasNotifications && (
              <Badge
                variant='secondary'
                className='bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
              >
                {displayCount} 条未读
              </Badge>
            )}
          </div>
        </div>

        <div className='p-4'>
          {hasNotifications ? (
            <div className='space-y-3'>
              <div className='flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30'>
                <div className='h-2 w-2 animate-pulse rounded-full bg-blue-500' />
                <div className='flex-1'>
                  <p className='text-sm font-medium text-gray-900 dark:text-white'>
                    您有 {displayCount} 条未读消息
                  </p>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    点击查看详情
                  </p>
                </div>
              </div>

              <Button
                className='w-full border-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                onClick={() => {
                  window.location.href = '/dashboard/messages';
                }}
              >
                查看所有消息
              </Button>
            </div>
          ) : (
            <div className='py-6 text-center'>
              <Bell className='mx-auto mb-3 h-12 w-12 text-gray-400 dark:text-gray-600' />
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                暂无新消息
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
