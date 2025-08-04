'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  Settings,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SystemNotificationErrorProps {
  className?: string;
  error?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  isConnected?: boolean;
}

/**
 * 系统通知错误状态组件
 * 用于显示系统通知加载失败的情况并提供重试选项
 */
export function SystemNotificationError({
  className,
  error = '系统通知服务暂时不可用',
  onRetry,
  isRetrying = false,
  isConnected = false
}: SystemNotificationErrorProps) {
  return (
    <Card className={cn('mx-auto w-full max-w-2xl', className)}>
      <CardHeader className='pb-4 text-center'>
        <div className='mb-4 flex items-center justify-center'>
          <div className='relative'>
            <AlertTriangle className='h-12 w-12 text-amber-500' />
            <div className='absolute -right-1 -bottom-1'>
              {isConnected ? (
                <Wifi className='h-4 w-4 rounded-full bg-white p-0.5 text-green-500' />
              ) : (
                <WifiOff className='h-4 w-4 rounded-full bg-white p-0.5 text-red-500' />
              )}
            </div>
          </div>
        </div>
        <CardTitle className='text-lg font-semibold text-amber-700'>
          系统通知加载失败
        </CardTitle>
      </CardHeader>

      <CardContent className='space-y-4'>
        <div className='space-y-2 text-center'>
          <p className='text-muted-foreground text-sm'>{error}</p>

          <div className='flex items-center justify-center gap-2'>
            <Badge
              variant={isConnected ? 'default' : 'destructive'}
              className='text-xs'
            >
              {isConnected ? '网络已连接' : '网络连接异常'}
            </Badge>
          </div>
        </div>

        <div className='space-y-3'>
          <div className='text-muted-foreground space-y-1 text-xs'>
            <p>可能的原因：</p>
            <ul className='ml-2 list-inside list-disc space-y-0.5'>
              <li>服务器暂时不可用</li>
              <li>网络连接问题</li>
              <li>数据库连接异常</li>
              <li>系统维护中</li>
            </ul>
          </div>

          <div className='flex flex-col justify-center gap-2 sm:flex-row'>
            {onRetry && (
              <Button
                onClick={onRetry}
                disabled={isRetrying}
                variant='default'
                size='sm'
                className='flex-1 sm:flex-none'
              >
                {isRetrying ? (
                  <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <RefreshCw className='mr-2 h-4 w-4' />
                )}
                重试加载
              </Button>
            )}

            <Button
              variant='outline'
              size='sm'
              onClick={() => window.location.reload()}
              className='flex-1 sm:flex-none'
            >
              <RefreshCw className='mr-2 h-4 w-4' />
              刷新页面
            </Button>
          </div>

          <div className='border-t pt-2'>
            <div className='text-muted-foreground flex items-center justify-center gap-4 text-xs'>
              <span className='flex items-center gap-1'>
                <Settings className='h-3 w-3' />
                系统状态
              </span>
              <span className='flex items-center gap-1'>
                <ExternalLink className='h-3 w-3' />
                <a
                  href='/dashboard/system-management'
                  className='hover:text-primary transition-colors'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  系统管理
                </a>
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SystemNotificationError;
