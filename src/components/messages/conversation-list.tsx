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
  MessageSquare,
  Users,
  Bell,
  Briefcase,
  Pin,
  VolumeX,
  Archive,
  MoreHorizontal,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';

// 会话类型
type ConversationType = 'private' | 'group' | 'system' | 'project';

// 会话接口
export interface Conversation {
  id: string;
  type: ConversationType;
  name: string;
  avatar?: string;
  lastMessage?: {
    content: string;
    timestamp: Date;
    sender?: {
      id: string;
      name: string;
    };
  };
  unreadCount: number;
  isOnline?: boolean;
  isPinned: boolean;
  isMuted: boolean;
  priority?: 'low' | 'normal' | 'important' | 'urgent';
  projectId?: string;
  lastActivity: Date;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onConversationClick: (conversation: Conversation) => void;
}

// 获取会话类型图标
function getConversationTypeIcon(type: ConversationType) {
  switch (type) {
    case 'private':
      return <MessageSquare className='h-4 w-4' />;
    case 'group':
      return <Users className='h-4 w-4' />;
    case 'system':
      return <Bell className='h-4 w-4' />;
    case 'project':
      return <Briefcase className='h-4 w-4' />;
    default:
      return <MessageSquare className='h-4 w-4' />;
  }
}

// 获取优先级颜色
function getPriorityColor(priority?: string) {
  switch (priority) {
    case 'urgent':
      return 'text-red-500';
    case 'important':
      return 'text-orange-500';
    case 'normal':
      return 'text-blue-500';
    case 'low':
      return 'text-gray-500';
    default:
      return 'text-gray-500';
  }
}

// 获取会话类型标签颜色
function getTypeTagColor(type: ConversationType) {
  switch (type) {
    case 'private':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
    case 'group':
      return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    case 'system':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
    case 'project':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
  }
}

export function ConversationList({
  conversations,
  selectedConversation,
  onConversationClick
}: ConversationListProps) {
  // 排序会话：置顶 > 未读 > 最后活动时间
  const sortedConversations = [...conversations].sort((a, b) => {
    // 置顶的会话优先
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    // 有未读消息的优先
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;

    // 按最后活动时间排序
    return b.lastActivity.getTime() - a.lastActivity.getTime();
  });

  const handleConversationAction = (
    action: string,
    conversation: Conversation,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    switch (action) {
      case 'pin':
        // TODO: 实现置顶功能
        console.log('Pin conversation:', conversation.id);
        break;
      case 'mute':
        // TODO: 实现静音功能
        console.log('Mute conversation:', conversation.id);
        break;
      case 'archive':
        // TODO: 实现归档功能
        console.log('Archive conversation:', conversation.id);
        break;
    }
  };

  if (conversations.length === 0) {
    return (
      <div className='flex h-full flex-col items-center justify-center p-8 text-center'>
        <MessageSquare className='text-muted-foreground mb-4 h-12 w-12' />
        <h3 className='text-muted-foreground mb-2 text-lg font-medium'>
          暂无会话
        </h3>
        <p className='text-muted-foreground text-sm'>
          开始新的对话或等待消息到达
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-1 p-2'>
      {sortedConversations.map((conversation) => {
        const isSelected = selectedConversation?.id === conversation.id;
        const timeAgo = formatDistanceToNow(conversation.lastActivity, {
          addSuffix: true,
          locale: zhCN
        });

        return (
          <div
            key={conversation.id}
            className={cn(
              'group relative flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-all duration-200',
              'hover:bg-accent/50',
              isSelected && 'bg-accent border-border border',
              conversation.isPinned && 'bg-blue-50/50 dark:bg-blue-950/20'
            )}
            onClick={() => onConversationClick(conversation)}
          >
            {/* 头像 */}
            <div className='relative'>
              <Avatar className='h-12 w-12'>
                <AvatarImage
                  src={conversation.avatar}
                  alt={conversation.name}
                />
                <AvatarFallback className={getTypeTagColor(conversation.type)}>
                  {getConversationTypeIcon(conversation.type)}
                </AvatarFallback>
              </Avatar>

              {/* 在线状态指示器 */}
              {conversation.type === 'private' && conversation.isOnline && (
                <div className='border-background absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2 bg-green-500' />
              )}

              {/* 优先级指示器 */}
              {conversation.priority && conversation.priority !== 'normal' && (
                <div
                  className={cn(
                    'absolute -top-1 -right-1 h-3 w-3 rounded-full',
                    getPriorityColor(conversation.priority)
                  )}
                >
                  <Circle className='h-3 w-3 fill-current' />
                </div>
              )}
            </div>

            {/* 会话信息 */}
            <div className='min-w-0 flex-1'>
              <div className='mb-1 flex items-center justify-between'>
                <div className='flex min-w-0 items-center gap-2'>
                  <h3
                    className={cn(
                      'truncate font-medium',
                      conversation.unreadCount > 0
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {conversation.name}
                  </h3>

                  {/* 置顶图标 */}
                  {conversation.isPinned && (
                    <Pin className='h-3 w-3 flex-shrink-0 text-blue-500' />
                  )}

                  {/* 静音图标 */}
                  {conversation.isMuted && (
                    <VolumeX className='text-muted-foreground h-3 w-3 flex-shrink-0' />
                  )}
                </div>

                <div className='flex flex-shrink-0 items-center gap-2'>
                  {/* 未读消息数量 */}
                  {conversation.unreadCount > 0 && (
                    <Badge
                      variant='destructive'
                      className='h-5 min-w-5 px-1.5 text-xs'
                    >
                      {conversation.unreadCount > 99
                        ? '99+'
                        : conversation.unreadCount}
                    </Badge>
                  )}

                  {/* 时间 */}
                  <span className='text-muted-foreground text-xs'>
                    {timeAgo}
                  </span>
                </div>
              </div>

              {/* 最后一条消息 */}
              {conversation.lastMessage && (
                <div className='flex items-center gap-1'>
                  {conversation.lastMessage.sender && (
                    <span className='text-muted-foreground flex-shrink-0 text-xs'>
                      {conversation.lastMessage.sender.name}:
                    </span>
                  )}
                  <p
                    className={cn(
                      'truncate text-sm',
                      conversation.unreadCount > 0
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {conversation.lastMessage.content}
                  </p>
                </div>
              )}
            </div>

            {/* 操作菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100'
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  onClick={(e) =>
                    handleConversationAction('pin', conversation, e)
                  }
                >
                  <Pin className='mr-2 h-4 w-4' />
                  {conversation.isPinned ? '取消置顶' : '置顶会话'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) =>
                    handleConversationAction('mute', conversation, e)
                  }
                >
                  <VolumeX className='mr-2 h-4 w-4' />
                  {conversation.isMuted ? '取消静音' : '静音会话'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) =>
                    handleConversationAction('archive', conversation, e)
                  }
                >
                  <Archive className='mr-2 h-4 w-4' />
                  归档会话
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}
    </div>
  );
}
