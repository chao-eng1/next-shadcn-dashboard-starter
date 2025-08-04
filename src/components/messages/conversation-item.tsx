'use client';

import React, { memo, useCallback } from 'react';
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

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onConversationClick: (conversation: Conversation) => void;
}

// 获取会话类型图标
const getConversationIcon = (type: ConversationType) => {
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
};

// 获取优先级样式
const getPriorityStyle = (priority?: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
    case 'important':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
    case 'normal':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
    case 'low':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

// 自定义比较函数，只在关键属性变化时才重新渲染
const arePropsEqual = (
  prevProps: ConversationItemProps,
  nextProps: ConversationItemProps
) => {
  return (
    prevProps.conversation.id === nextProps.conversation.id &&
    prevProps.conversation.name === nextProps.conversation.name &&
    prevProps.conversation.unreadCount === nextProps.conversation.unreadCount &&
    prevProps.conversation.lastActivity.getTime() ===
      nextProps.conversation.lastActivity.getTime() &&
    prevProps.conversation.isPinned === nextProps.conversation.isPinned &&
    prevProps.conversation.isMuted === nextProps.conversation.isMuted &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.onConversationClick === nextProps.onConversationClick &&
    prevProps.conversation.lastMessage?.content ===
      nextProps.conversation.lastMessage?.content
  );
};

const ConversationItem = memo(function ConversationItem({
  conversation,
  isSelected,
  onConversationClick
}: ConversationItemProps) {
  const handleClick = useCallback(() => {
    onConversationClick(conversation);
  }, [conversation, onConversationClick]);

  const handleConversationAction = useCallback(
    (action: string, e: React.MouseEvent) => {
      e.stopPropagation();

      switch (action) {
        case 'pin':
          console.log('Pin conversation:', conversation.id);
          break;
        case 'mute':
          console.log('Mute conversation:', conversation.id);
          break;
        case 'archive':
          console.log('Archive conversation:', conversation.id);
          break;
        default:
          break;
      }
    },
    [conversation.id]
  );

  return (
    <div
      className={cn(
        'group flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50',
        isSelected && 'bg-blue-50 dark:bg-blue-900/20',
        conversation.unreadCount > 0 && 'bg-gray-50/50 dark:bg-gray-800/30'
      )}
      onClick={handleClick}
    >
      {/* 头像 */}
      <div className='flex-shrink-0'>
        <Avatar className='h-12 w-12'>
          <AvatarImage src={conversation.avatar} alt={conversation.name} />
          <AvatarFallback className='text-sm'>
            {conversation.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* 主要内容 */}
      <div className='min-w-0 flex-1'>
        {/* 顶部行：名称、时间、未读计数 */}
        <div className='flex items-center justify-between gap-2'>
          <div className='flex min-w-0 flex-1 items-center gap-2'>
            <h3
              className={cn(
                'truncate text-sm font-medium',
                conversation.unreadCount > 0
                  ? 'text-gray-900 dark:text-gray-100'
                  : 'text-gray-700 dark:text-gray-300'
              )}
            >
              {conversation.name}
            </h3>

            {/* 置顶图标 */}
            {conversation.isPinned && (
              <Pin className='h-3 w-3 flex-shrink-0 text-blue-500' />
            )}

            {/* 免打扰图标 */}
            {conversation.isMuted && (
              <VolumeX className='h-3 w-3 flex-shrink-0 text-gray-400' />
            )}
          </div>

          <div className='flex flex-shrink-0 items-center gap-2'>
            {/* 时间 */}
            <span className='text-xs text-gray-500'>
              {formatDistanceToNow(conversation.lastActivity, {
                addSuffix: false,
                locale: zhCN
              })}
            </span>

            {/* 未读计数 */}
            {conversation.unreadCount > 0 && (
              <Badge className='h-5 min-w-5 bg-blue-500 px-1 text-xs text-white'>
                {conversation.unreadCount > 99
                  ? '99+'
                  : conversation.unreadCount}
              </Badge>
            )}
          </div>
        </div>

        {/* 底部行：最后消息和优先级 */}
        <div className='mt-1 flex items-center justify-between gap-2'>
          <div className='min-w-0 flex-1'>
            {conversation.lastMessage ? (
              <div className='flex items-center gap-1'>
                {conversation.lastMessage.sender && (
                  <span className='flex-shrink-0 text-xs text-gray-500'>
                    {conversation.lastMessage.sender.name}:
                  </span>
                )}
                <p
                  className={cn(
                    'truncate text-xs',
                    conversation.unreadCount > 0
                      ? 'text-gray-800 dark:text-gray-200'
                      : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {conversation.lastMessage.content}
                </p>
              </div>
            ) : (
              <p className='text-xs text-gray-400'>暂无消息</p>
            )}
          </div>

          <div className='flex flex-shrink-0 items-center gap-1'>
            {/* 优先级标识 */}
            {conversation.priority && conversation.priority !== 'normal' && (
              <Badge
                variant='outline'
                className={cn(
                  'h-4 px-1 text-xs',
                  getPriorityStyle(conversation.priority)
                )}
              >
                {conversation.priority === 'urgent' && '紧急'}
                {conversation.priority === 'important' && '重要'}
                {conversation.priority === 'low' && '低'}
              </Badge>
            )}

            {/* 操作菜单 */}
            <div className='opacity-0 transition-opacity group-hover:opacity-100'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                    <MoreHorizontal className='h-3 w-3' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem
                    onClick={(e) => handleConversationAction('pin', e)}
                  >
                    <Pin className='mr-2 h-4 w-4' />
                    {conversation.isPinned ? '取消置顶' : '置顶'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => handleConversationAction('mute', e)}
                  >
                    <VolumeX className='mr-2 h-4 w-4' />
                    {conversation.isMuted ? '取消免打扰' : '免打扰'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => handleConversationAction('archive', e)}
                  >
                    <Archive className='mr-2 h-4 w-4' />
                    归档
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}, arePropsEqual);

export { ConversationItem };
