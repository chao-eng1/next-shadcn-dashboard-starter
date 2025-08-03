'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { zhCN } from 'date-fns/locale';

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
          <div key={attachment.id} className="mt-2">
            <img
              src={attachment.url}
              alt={attachment.name}
              className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(attachment.url, '_blank')}
            />
          </div>
        );
      case 'file':
      case 'video':
      case 'audio':
        return (
          <div key={attachment.id} className="mt-2 p-3 border rounded-lg bg-muted/50 max-w-xs">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                {attachment.type === 'video' && <ExternalLink className="h-5 w-5 text-primary" />}
                {attachment.type === 'audio' && <ExternalLink className="h-5 w-5 text-primary" />}
                {attachment.type === 'file' && <ExternalLink className="h-5 w-5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => window.open(attachment.url, '_blank')}>
                <Download className="h-4 w-4" />
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
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  if (message.type === 'system' || message.type === 'notification') {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground flex items-center gap-2">
          {message.isImportant && <AlertTriangle className="h-3 w-3 text-orange-500" />}
          {message.content}
          {showTimestamp && (
            <span className="text-xs">
              {format(message.timestamp, 'HH:mm', { locale: zhCN })}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-3 group', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      {/* 头像 */}
      {showAvatar && !isOwn && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.sender.avatar} />
          <AvatarFallback className="text-xs">
            {message.sender.name.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
      )}

      {/* 消息内容 */}
      <div className={cn('flex flex-col max-w-[70%]', isOwn ? 'items-end' : 'items-start')}>
        {/* 发送者信息 */}
        {!isOwn && showAvatar && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-muted-foreground">
              {message.sender.name}
            </span>
            {message.sender.role && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                {message.sender.role}
              </Badge>
            )}
            {message.sender.isOnline && (
              <div className="h-2 w-2 bg-green-500 rounded-full" />
            )}
          </div>
        )}

        {/* 回复消息 */}
        {message.replyTo && (
          <div className="mb-2 p-2 border-l-2 border-primary/30 bg-muted/30 rounded text-xs max-w-full">
            <p className="font-medium text-muted-foreground">{message.replyTo.sender.name}</p>
            <p className="truncate">{message.replyTo.content}</p>
          </div>
        )}

        {/* 消息气泡 */}
        <div
          className={cn(
            'relative px-3 py-2 rounded-lg break-words',
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted',
            message.isImportant && 'ring-2 ring-orange-500/50'
          )}
        >
          {/* 重要标记 */}
          {message.isImportant && (
            <Star className="absolute -top-1 -right-1 h-3 w-3 text-orange-500 fill-orange-500" />
          )}

          {/* 文本内容 */}
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>

          {/* 附件 */}
          {message.attachments?.map(renderAttachment)}

          {/* 消息状态和时间 */}
          <div className={cn(
            'flex items-center gap-1 mt-1',
            isOwn ? 'justify-end' : 'justify-start'
          )}>
            {showTimestamp && (
              <span className={cn(
                'text-xs',
                isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}>
                {format(message.timestamp, 'HH:mm', { locale: zhCN })}
              </span>
            )}
            {renderStatus()}
          </div>
        </div>

        {/* 表情反应 */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex gap-1 mt-1">
            {message.reactions.map((reaction, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => onReaction?.(message.id, reaction.emoji)}
              >
                {reaction.emoji} {reaction.count}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* 操作菜单 */}
      <div className={cn(
        'opacity-0 group-hover:opacity-100 transition-opacity flex items-start pt-2',
        isOwn ? 'order-first' : 'order-last'
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isOwn ? 'end' : 'start'}>
            {onReply && (
              <DropdownMenuItem onClick={() => onReply(message)}>
                <Reply className="h-4 w-4 mr-2" />
                回复
              </DropdownMenuItem>
            )}
            {onCopy && (
              <DropdownMenuItem onClick={() => onCopy(message.content)}>
                <Copy className="h-4 w-4 mr-2" />
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
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}