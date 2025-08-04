'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Star,
  StarOff,
  Eye,
  EyeOff,
  Archive,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';

interface SystemMessage {
  id: string;
  title?: string;
  content: string;
  type?: 'info' | 'warning' | 'error' | 'success' | 'announcement' | 'system';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
  timestamp: Date;
  isRead?: boolean;
  isStarred?: boolean;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  actions?: {
    id: string;
    label: string;
    url?: string;
    type: 'primary' | 'secondary';
  }[];
  attachments?: {
    id: string;
    name: string;
    url: string;
    size: number;
  }[];
}

interface SystemMessageCardProps {
  message: SystemMessage;
  onMarkAsRead?: (id: string) => void;
  onStar?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function SystemMessageCard({
  message,
  onMarkAsRead,
  onStar,
  onArchive,
  onDelete,
  className
}: SystemMessageCardProps) {
  // 获取消息类型对应的图标和颜色
  const getTypeInfo = (type: SystemMessage['type']) => {
    switch (type) {
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-amber-500',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200'
        };
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'announcement':
        return {
          icon: Bell,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      default:
        return {
          icon: Info,
          color: 'text-slate-500',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200'
        };
    }
  };

  // 获取优先级对应的样式
  const getPriorityInfo = (priority: SystemMessage['priority']) => {
    switch (priority) {
      case 'urgent':
        return {
          label: '紧急',
          color: 'bg-red-500 text-white',
          pulse: true
        };
      case 'high':
        return {
          label: '重要',
          color: 'bg-orange-500 text-white',
          pulse: false
        };
      case 'normal':
        return {
          label: '普通',
          color: 'bg-blue-500 text-white',
          pulse: false
        };
      case 'low':
        return {
          label: '低',
          color: 'bg-slate-500 text-white',
          pulse: false
        };
      default:
        return null;
    }
  };

  const typeInfo = getTypeInfo(message.type);
  const priorityInfo = getPriorityInfo(message.priority);
  const TypeIcon = typeInfo.icon;

  // 提取标题，如果没有单独的标题，从内容中提取第一行
  const title =
    message.title || message.content.split('\n')[0].slice(0, 50) + '...';
  const content = message.title
    ? message.content
    : message.content.split('\n').slice(1).join('\n');

  return (
    <Card
      className={cn(
        'group transition-all duration-200 hover:shadow-md',
        !message.isRead && 'bg-blue-50/30 ring-2 ring-blue-100',
        typeInfo.borderColor,
        className
      )}
    >
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex min-w-0 flex-1 items-start gap-3'>
            {/* 消息类型图标 */}
            <div
              className={cn('flex-shrink-0 rounded-lg p-2', typeInfo.bgColor)}
            >
              <TypeIcon className={cn('h-5 w-5', typeInfo.color)} />
            </div>

            {/* 消息主要信息 */}
            <div className='min-w-0 flex-1 space-y-2'>
              {/* 标题行 */}
              <div className='flex flex-wrap items-center gap-2'>
                <h3
                  className={cn(
                    'text-sm leading-tight font-semibold',
                    !message.isRead ? 'text-slate-900' : 'text-slate-700'
                  )}
                >
                  {title}
                </h3>

                {/* 未读标识 */}
                {!message.isRead && (
                  <div className='h-2 w-2 flex-shrink-0 rounded-full bg-blue-500' />
                )}
              </div>

              {/* 元数据行 */}
              <div className='flex flex-wrap items-center gap-2 text-xs text-slate-500'>
                {/* 发送者 */}
                {message.sender && (
                  <span className='font-medium'>{message.sender.name}</span>
                )}

                {/* 时间 */}
                <div className='flex items-center gap-1'>
                  <Clock className='h-3 w-3' />
                  <span>
                    {format(message.timestamp, 'MM月dd日 HH:mm', {
                      locale: zhCN
                    })}
                  </span>
                </div>

                {/* 分类 */}
                {message.category && (
                  <Badge variant='outline' className='text-xs'>
                    {message.category}
                  </Badge>
                )}

                {/* 优先级 */}
                {priorityInfo && (
                  <Badge
                    className={cn(
                      'text-xs',
                      priorityInfo.color,
                      priorityInfo.pulse && 'animate-pulse'
                    )}
                  >
                    {priorityInfo.label}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className='flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
            {/* 收藏按钮 */}
            {onStar && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => onStar(message.id)}
                className='h-8 w-8 p-0'
              >
                {message.isStarred ? (
                  <Star className='h-4 w-4 fill-current text-yellow-500' />
                ) : (
                  <StarOff className='h-4 w-4' />
                )}
              </Button>
            )}

            {/* 更多操作 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                  <MoreVertical className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {onMarkAsRead && (
                  <DropdownMenuItem onClick={() => onMarkAsRead(message.id)}>
                    {message.isRead ? (
                      <>
                        <EyeOff className='mr-2 h-4 w-4' />
                        标记为未读
                      </>
                    ) : (
                      <>
                        <Eye className='mr-2 h-4 w-4' />
                        标记为已读
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                {onArchive && (
                  <DropdownMenuItem onClick={() => onArchive(message.id)}>
                    <Archive className='mr-2 h-4 w-4' />
                    归档
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(message.id)}
                    className='text-red-600'
                  >
                    <Trash2 className='mr-2 h-4 w-4' />
                    删除
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {/* 消息内容 */}
      {content && (
        <CardContent className='pt-0 pb-4'>
          <div className='prose prose-sm max-w-none leading-relaxed text-slate-600'>
            {content.split('\n').map((line, index) => (
              <p key={index} className='mb-2 last:mb-0'>
                {line}
              </p>
            ))}
          </div>
        </CardContent>
      )}

      {/* 附件 */}
      {message.attachments && message.attachments.length > 0 && (
        <CardContent className='pt-0 pb-4'>
          <div className='space-y-2'>
            <h4 className='mb-2 text-xs font-medium text-slate-500'>附件</h4>
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className='flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-sm'
              >
                <ExternalLink className='h-4 w-4 text-slate-400' />
                <span className='flex-1 truncate'>{attachment.name}</span>
                <span className='text-xs text-slate-400'>
                  {(attachment.size / 1024).toFixed(1)}KB
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      )}

      {/* 操作按钮 */}
      {message.actions && message.actions.length > 0 && (
        <CardContent className='pt-0 pb-4'>
          <div className='flex flex-wrap gap-2'>
            {message.actions.map((action) => (
              <Button
                key={action.id}
                variant={action.type === 'primary' ? 'default' : 'outline'}
                size='sm'
                onClick={() => {
                  if (action.url) {
                    window.open(action.url, '_blank');
                  }
                }}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default SystemMessageCard;
