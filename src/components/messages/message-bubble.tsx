'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Check,
  CheckCheck,
  Clock,
  MoreHorizontal,
  Reply,
  Copy,
  Trash2,
  AlertTriangle,
  Star,
  Download,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';

export interface MessageUser {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  isOnline?: boolean;
}

export interface MessageAttachment {
  id: string;
  name: string;
  size: number;
  type: 'image' | 'file' | 'video' | 'audio';
  url: string;
  thumbnail?: string;
}

export interface Message {
  id: string;
  content: string;
  sender: MessageUser;
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'system' | 'notification';
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  isImportant?: boolean;
  replyTo?: {
    id: string;
    content: string;
    sender: MessageUser;
  };
  attachments?: MessageAttachment[];
  reactions?: {
    emoji: string;
    users: MessageUser[];
    count: number;
  }[];
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onReply?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = true,
  onReply,
  onDelete,
  onCopy,
  onReaction
}: MessageBubbleProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderAttachment = (attachment: MessageAttachment) => {
    switch (attachment.type) {
      case 'image':
        return (
          <div className='mt-2'>
            <img
              src={attachment.url}
              alt={attachment.name}
              className='max-w-xs cursor-pointer rounded-lg transition-opacity hover:opacity-90'
              onClick={() => window.open(attachment.url, '_blank')}
            />
          </div>
        );
      case 'file':
      case 'video':
      case 'audio':
        return (
          <div className='bg-muted/50 mt-2 max-w-xs rounded-lg border p-3'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded'>
                {attachment.type === 'video' && (
                  <ExternalLink className='text-primary h-5 w-5' />
                )}
                {attachment.type === 'audio' && (
                  <ExternalLink className='text-primary h-5 w-5' />
                )}
                {attachment.type === 'file' && (
                  <ExternalLink className='text-primary h-5 w-5' />
                )}
              </div>
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-medium'>
                  {attachment.name}
                </p>
                <p className='text-muted-foreground text-xs'>
                  {formatFileSize(attachment.size)}
                </p>
              </div>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => window.open(attachment.url, '_blank')}
              >
                <Download className='h-4 w-4' />
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderStatus = () => {
    if (!isOwn || !message.status) return null;

    switch (message.status) {
      case 'sending':
        return <Clock className='text-muted-foreground h-3 w-3' />;
      case 'sent':
        return <Check className='text-muted-foreground h-3 w-3' />;
      case 'delivered':
        return <CheckCheck className='text-muted-foreground h-3 w-3' />;
      case 'read':
        return <CheckCheck className='h-3 w-3 text-blue-500' />;
      default:
        return null;
    }
  };

  if (message.type === 'system' || message.type === 'notification') {
    return (
      <div className='my-4 flex justify-center'>
        <div className='bg-muted text-muted-foreground flex items-center gap-2 rounded-full px-3 py-1 text-xs'>
          {message.isImportant && (
            <AlertTriangle className='h-3 w-3 text-orange-500' />
          )}
          {message.content}
          {showTimestamp && (
            <span className='text-xs'>
              {/* {format(message.timestamp, 'HH:mm', { locale: zhCN })} */}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex gap-3',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* 头像 */}
      {showAvatar && !isOwn && (
        <Avatar className='h-8 w-8 flex-shrink-0'>
          <AvatarImage src={message.sender.avatar} />
          <AvatarFallback className='text-xs'>
            {message.sender.name}
          </AvatarFallback>
        </Avatar>
      )}

      {/* 消息内容 */}
      <div
        className={cn(
          'flex max-w-[70%] flex-col',
          isOwn ? 'items-end' : 'items-start'
        )}
      >
        {/* 发送者信息 */}
        {!isOwn && showAvatar && (
          <div className='mb-1 flex items-center gap-2'>
            <span className='text-muted-foreground text-xs font-medium'>
              {message.sender.name}
            </span>
            {message.sender.role && (
              <Badge variant='secondary' className='px-1 py-0 text-xs'>
                {message.sender.role}
              </Badge>
            )}
            {message.sender.isOnline && (
              <div className='h-2 w-2 rounded-full bg-green-500' />
            )}
          </div>
        )}

        {/* 回复消息 */}
        {message.replyTo && (
          <div className='border-primary/30 bg-muted/30 mb-2 max-w-full rounded border-l-2 p-2 text-xs'>
            <p className='text-muted-foreground font-medium'>
              {message.replyTo.sender.name}
            </p>
            <p className='truncate'>{message.replyTo.content}</p>
          </div>
        )}

        {/* 消息气泡 */}
        <div
          className={cn(
            'relative rounded-lg px-3 py-2 break-words',
            isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted',
            message.isImportant && 'ring-2 ring-orange-500/50'
          )}
        >
          {/* 重要标记 */}
          {message.isImportant && (
            <Star className='absolute -top-1 -right-1 h-3 w-3 fill-orange-500 text-orange-500' />
          )}

          {/* 文本内容 */}
          <p className='text-sm whitespace-pre-wrap'>{message.content}</p>

          {/* 附件 */}
          {message.attachments?.map((attachment) => (
            <div key={attachment.id}>{renderAttachment(attachment)}</div>
          ))}

          {/* 消息状态和时间 */}
          <div
            className={cn(
              'mt-1 flex items-center gap-1',
              isOwn ? 'justify-end' : 'justify-start'
            )}
          >
            {showTimestamp && (
              <span
                className={cn(
                  'text-xs',
                  isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                )}
              >
                {/* {format(message.timestamp, 'HH:mm', { locale: zhCN })} */}
              </span>
            )}
            {renderStatus()}
          </div>
        </div>

        {/* 表情反应 */}
        {message.reactions && message.reactions.length > 0 && (
          <div className='mt-1 flex gap-1'>
            {message.reactions.map((reaction, index) => (
              <Button
                key={`${reaction.emoji}-${reaction.count}-${index}`}
                variant='outline'
                size='sm'
                className='h-6 px-2 text-xs'
                onClick={() => onReaction?.(message.id, reaction.emoji)}
              >
                {reaction.emoji} {reaction.count}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* 操作菜单 */}
      <div
        className={cn(
          'flex items-start pt-2 opacity-0 transition-opacity group-hover:opacity-100',
          isOwn ? 'order-first' : 'order-last'
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
              <MoreHorizontal className='h-3 w-3' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isOwn ? 'end' : 'start'}>
            {onReply && (
              <DropdownMenuItem onClick={() => onReply(message)}>
                <Reply className='mr-2 h-4 w-4' />
                回复
              </DropdownMenuItem>
            )}
            {onCopy && (
              <DropdownMenuItem onClick={() => onCopy(message.content)}>
                <Copy className='mr-2 h-4 w-4' />
                复制
              </DropdownMenuItem>
            )}
            {onReaction && (
              <DropdownMenuItem onClick={() => onReaction(message.id, '👍')}>
                👍 点赞
              </DropdownMenuItem>
            )}
            {isOwn && onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(message.id)}
                className='text-destructive'
              >
                <Trash2 className='mr-2 h-4 w-4' />
                删除
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
