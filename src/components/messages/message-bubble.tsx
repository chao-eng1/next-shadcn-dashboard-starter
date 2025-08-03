'use client';

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MoreVertical,
  Reply,
  Copy,
  Forward,
  Trash2,
  Edit,
  Pin,
  Star,
  Download,
  ExternalLink,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  File,
  Image as ImageIcon,
  Play,
  Pause,
  Volume2,
  Eye,
  Quote,
  Heart,
  ThumbsUp,
  Smile,
  Angry
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// 消息状态
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

// 消息类型
export interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'voice' | 'video' | 'system' | 'announcement';
  sender: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  timestamp: Date;
  status?: MessageStatus;
  isOwn: boolean;
  replyTo?: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string;
      avatar?: string;
    };
    type: string;
  };
  attachments?: {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    thumbnail?: string;
  }[];
  mentions?: {
    id: string;
    name: string;
    type: 'user' | 'channel';
  }[];
  reactions?: {
    emoji: string;
    count: number;
    users: {
      id: string;
      name: string;
    }[];
    hasReacted: boolean;
  }[];
  isPinned?: boolean;
  isEdited?: boolean;
  editedAt?: Date;
  isForwarded?: boolean;
  forwardedFrom?: {
    id: string;
    name: string;
  };
}

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  showStatus?: boolean;
  compact?: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onForward?: (message: Message) => void;
  onPin?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onMentionClick?: (userId: string) => void;
  className?: string;
}

// 消息状态图标
const getStatusIcon = (status: MessageStatus) => {
  switch (status) {
    case 'sending':
      return <Clock className="h-3 w-3 text-muted-foreground" />;
    case 'sent':
      return <Check className="h-3 w-3 text-muted-foreground" />;
    case 'delivered':
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
    case 'read':
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    case 'failed':
      return <AlertCircle className="h-3 w-3 text-red-500" />;
    default:
      return null;
  }
};

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 格式化时间
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 格式化日期时间
const formatDateTime = (date: Date) => {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return formatTime(date);
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  if (isYesterday) {
    return `昨天 ${formatTime(date)}`;
  }
  
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 检查是否为图片文件
const isImageFile = (type: string) => {
  return type.startsWith('image/');
};

// 检查是否为视频文件
const isVideoFile = (type: string) => {
  return type.startsWith('video/');
};

// 检查是否为音频文件
const isAudioFile = (type: string) => {
  return type.startsWith('audio/');
};

// 渲染提及
const renderContentWithMentions = (content: string, mentions: Message['mentions'], onMentionClick?: (userId: string) => void) => {
  if (!mentions || mentions.length === 0) {
    return content;
  }
  
  let result = content;
  mentions.forEach(mention => {
    const mentionRegex = new RegExp(`@${mention.name}`, 'g');
    result = result.replace(mentionRegex, `<mention data-id="${mention.id}" data-type="${mention.type}">@${mention.name}</mention>`);
  });
  
  return (
    <span
      dangerouslySetInnerHTML={{ __html: result }}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'MENTION') {
          const userId = target.getAttribute('data-id');
          const type = target.getAttribute('data-type');
          if (userId && type === 'user' && onMentionClick) {
            onMentionClick(userId);
          }
        }
      }}
      className="[&>mention]:text-blue-600 [&>mention]:font-medium [&>mention]:cursor-pointer [&>mention]:hover:underline"
    />
  );
};

export function MessageBubble({
  message,
  showAvatar = true,
  showTimestamp = true,
  showStatus = true,
  compact = false,
  onReply,
  onEdit,
  onDelete,
  onForward,
  onPin,
  onReaction,
  onMentionClick,
  className
}: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 处理消息操作
  const handleAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    switch (action) {
      case 'reply':
        onReply?.(message);
        break;
      case 'edit':
        onEdit?.(message);
        break;
      case 'delete':
        onDelete?.(message.id);
        break;
      case 'forward':
        onForward?.(message);
        break;
      case 'pin':
        onPin?.(message.id);
        break;
      case 'copy':
        navigator.clipboard.writeText(message.content);
        toast.success('已复制到剪贴板');
        break;
    }
  };

  // 处理表情反应
  const handleReaction = (emoji: string) => {
    onReaction?.(message.id, emoji);
    setShowReactions(false);
  };

  // 下载附件
  const downloadAttachment = (attachment: Message['attachments'][0]) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.click();
  };

  // 播放语音
  const toggleVoicePlay = () => {
    setIsPlaying(!isPlaying);
    // TODO: 实现语音播放功能
  };

  // 系统消息样式
  if (message.type === 'system' || message.type === 'announcement') {
    return (
      <div className={cn('flex justify-center my-4', className)}>
        <div className={cn(
          'px-3 py-2 rounded-full text-sm text-center max-w-md',
          message.type === 'announcement' 
            ? 'bg-blue-100 text-blue-800 border border-blue-200'
            : 'bg-muted text-muted-foreground'
        )}>
          {message.type === 'announcement' && (
            <Badge className="mr-2 bg-blue-600">公告</Badge>
          )}
          {message.content}
          {showTimestamp && (
            <span className="ml-2 text-xs opacity-70">
              {formatTime(message.timestamp)}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'group flex gap-3 px-4 py-2 hover:bg-muted/30 transition-colors',
      message.isOwn && 'flex-row-reverse',
      compact && 'py-1',
      className
    )}>
      {/* 头像 */}
      {showAvatar && !compact && (
        <div className={cn('flex-shrink-0', message.isOwn && 'order-last')}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.sender.avatar} alt={message.sender.name} />
            <AvatarFallback className="text-xs">
              {message.sender.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      {/* 消息内容 */}
      <div className={cn(
        'flex-1 min-w-0',
        message.isOwn && 'flex flex-col items-end'
      )}>
        {/* 发送者信息 */}
        {!compact && !message.isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{message.sender.name}</span>
            {message.sender.role && (
              <Badge variant="outline" className="text-xs">
                {message.sender.role}
              </Badge>
            )}
            {showTimestamp && (
              <span className="text-xs text-muted-foreground">
                {formatDateTime(message.timestamp)}
              </span>
            )}
          </div>
        )}
        
        {/* 回复引用 */}
        {message.replyTo && (
          <div className={cn(
            'mb-2 p-2 border-l-2 border-muted bg-muted/30 rounded-r text-sm',
            message.isOwn && 'border-r-2 border-l-0 rounded-l rounded-r-none'
          )}>
            <div className="flex items-center gap-1 mb-1">
              <Reply className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium text-xs">{message.replyTo.sender.name}</span>
            </div>
            <p className="text-muted-foreground truncate">
              {message.replyTo.type === 'image' && '[图片]'}
              {message.replyTo.type === 'file' && '[文件]'}
              {message.replyTo.type === 'voice' && '[语音]'}
              {message.replyTo.type === 'text' && message.replyTo.content}
            </p>
          </div>
        )}
        
        {/* 转发标识 */}
        {message.isForwarded && message.forwardedFrom && (
          <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
            <Forward className="h-3 w-3" />
            <span>转发自 {message.forwardedFrom.name}</span>
          </div>
        )}
        
        {/* 消息气泡 */}
        <div className={cn(
          'relative group/bubble',
          message.isOwn ? 'ml-auto' : 'mr-auto'
        )}>
          {/* 置顶标识 */}
          {message.isPinned && (
            <div className="absolute -top-2 -right-2 z-10">
              <div className="bg-yellow-500 text-white rounded-full p-1">
                <Pin className="h-3 w-3" />
              </div>
            </div>
          )}
          
          <div className={cn(
            'relative px-3 py-2 rounded-lg max-w-md break-words',
            message.isOwn 
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted rounded-bl-sm',
            message.type === 'voice' && 'px-2 py-1'
          )}>
            {/* 文本消息 */}
            {message.type === 'text' && (
              <div className="whitespace-pre-wrap">
                {renderContentWithMentions(message.content, message.mentions, onMentionClick)}
              </div>
            )}
            
            {/* 图片消息 */}
            {message.type === 'image' && message.attachments && (
              <div className="space-y-2">
                {message.content && (
                  <div className="whitespace-pre-wrap mb-2">
                    {renderContentWithMentions(message.content, message.mentions, onMentionClick)}
                  </div>
                )}
                <div className="grid gap-2">
                  {message.attachments.map((attachment, index) => (
                    <div key={attachment.id} className="relative group/image">
                      <img
                        src={attachment.thumbnail || attachment.url}
                        alt={attachment.name}
                        className="max-w-full h-auto rounded cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setImagePreview(attachment.url)}
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover/image:opacity-100 transition-opacity">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => downloadAttachment(attachment)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 文件消息 */}
            {message.type === 'file' && message.attachments && (
              <div className="space-y-2">
                {message.content && (
                  <div className="whitespace-pre-wrap mb-2">
                    {renderContentWithMentions(message.content, message.mentions, onMentionClick)}
                  </div>
                )}
                {message.attachments.map((attachment, index) => (
                  <div key={attachment.id} className="flex items-center gap-3 p-2 border rounded bg-background/50">
                    <div className="flex-shrink-0">
                      {isImageFile(attachment.type) && <ImageIcon className="h-6 w-6 text-blue-500" />}
                      {isVideoFile(attachment.type) && <Play className="h-6 w-6 text-green-500" />}
                      {isAudioFile(attachment.type) && <Volume2 className="h-6 w-6 text-purple-500" />}
                      {!isImageFile(attachment.type) && !isVideoFile(attachment.type) && !isAudioFile(attachment.type) && (
                        <File className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{attachment.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                    </div>
                    <div className="flex gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(attachment.url, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>预览</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadAttachment(attachment)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>下载</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* 语音消息 */}
            {message.type === 'voice' && message.attachments && (
              <div className="flex items-center gap-2 min-w-[200px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleVoicePlay}
                  className="flex-shrink-0"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <div className="flex-1 h-8 bg-background/30 rounded flex items-center px-2">
                  <div className="flex-1 h-1 bg-background/50 rounded">
                    <div className="h-full w-1/3 bg-current rounded" />
                  </div>
                </div>
                <span className="text-xs opacity-70">0:15</span>
              </div>
            )}
            
            {/* 消息状态和时间 */}
            <div className={cn(
              'flex items-center gap-1 mt-1',
              message.isOwn ? 'justify-end' : 'justify-start'
            )}>
              {message.isEdited && (
                <span className="text-xs opacity-70">(已编辑)</span>
              )}
              
              {compact && showTimestamp && (
                <span className="text-xs opacity-70">
                  {formatTime(message.timestamp)}
                </span>
              )}
              
              {message.isOwn && showStatus && message.status && (
                <div className="flex-shrink-0">
                  {getStatusIcon(message.status)}
                </div>
              )}
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className={cn(
            'absolute top-0 opacity-0 group-hover/bubble:opacity-100 transition-opacity z-10',
            message.isOwn ? '-left-12' : '-right-12'
          )}>
            <div className="flex items-center gap-1 bg-background border rounded-lg shadow-sm p-1">
              {/* 表情反应 */}
              <DropdownMenu open={showReactions} onOpenChange={setShowReactions}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Smile className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-auto p-1">
                  <div className="flex gap-1">
                    {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-lg hover:bg-muted"
                        onClick={() => handleReaction(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* 更多操作 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={message.isOwn ? 'end' : 'start'}>
                  <DropdownMenuItem onClick={(e) => handleAction('reply', e)}>
                    <Reply className="h-4 w-4 mr-2" />
                    回复
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleAction('forward', e)}>
                    <Forward className="h-4 w-4 mr-2" />
                    转发
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleAction('copy', e)}>
                    <Copy className="h-4 w-4 mr-2" />
                    复制
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => handleAction('pin', e)}>
                    <Pin className="h-4 w-4 mr-2" />
                    {message.isPinned ? '取消置顶' : '置顶'}
                  </DropdownMenuItem>
                  {message.isOwn && (
                    <>
                      <DropdownMenuItem onClick={(e) => handleAction('edit', e)}>
                        <Edit className="h-4 w-4 mr-2" />
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={(e) => handleAction('delete', e)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        删除
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        
        {/* 表情反应 */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.reactions.map((reaction, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={reaction.hasReacted ? 'default' : 'outline'}
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleReaction(reaction.emoji)}
                    >
                      <span className="mr-1">{reaction.emoji}</span>
                      <span>{reaction.count}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      {reaction.users.map(user => user.name).join(', ')}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}
      </div>
      
      {/* 图片预览模态框 */}
      {imagePreview && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setImagePreview(null)}
        >
          <div className="relative max-w-4xl max-h-4xl">
            <img
              src={imagePreview}
              alt="预览"
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setImagePreview(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}