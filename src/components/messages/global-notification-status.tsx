'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalNotificationStatusProps {
  isConnected: boolean;
  className?: string;
}

/**
 * 全局通知状态组件
 * 显示实时通知系统的连接状态
 */
export function GlobalNotificationStatus({
  isConnected,
  className
}: GlobalNotificationStatusProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-1', className)}>
            {isConnected ? (
              <>
                <Wifi className='h-4 w-4 text-green-500' />
                <Badge
                  variant='outline'
                  className='border-green-200 bg-green-50 text-xs text-green-700'
                >
                  在线
                </Badge>
              </>
            ) : (
              <>
                <WifiOff className='h-4 w-4 text-red-500' />
                <Badge
                  variant='outline'
                  className='border-red-200 bg-red-50 text-xs text-red-700'
                >
                  离线
                </Badge>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isConnected
              ? '实时通知系统已连接，您将收到最新消息通知'
              : '实时通知系统连接中断，可能无法及时收到新消息'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default GlobalNotificationStatus;
