'use client';

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Search,
  MessageSquare,
  Users,
  Bell,
  Briefcase,
  MoreVertical,
  Pin,
  Archive,
  Trash2,
  Volume2,
  VolumeX,
  Circle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Star,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

// 会话类型
export interface Conversation {
  id: string;
  type: 'private' | 'group' | 'system' | 'project';
  name: string;
  avatar?: string;
  lastMessage: {
    content: string;
    timestamp: Date;
    sender?: {
      id: string;
      name: string;
    };
    type: 'text' | 'image' | 'file' | 'system';
  };
  unreadCount: number;
  isOnline?: boolean;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  participants?: {
    id: string;
    name: string;
    avatar?: string;
  }[];
  projectId?: string;
  lastActivity: Date;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onConversationSelect: (conversation: Conversation) => void;
  onNewConversation?: () => void;
  className?: string;
}

// 会话类型配置
const conversationTypeConfig = {
  private: { icon: MessageSquare, color: 'text-blue-600', label: '私聊' },
  group: { icon: Users, color: 'text-green-600', label: '群聊' },
  system: { icon: Bell, color: 'text-orange-600', label: '系统' },
  project: { icon: Briefcase, color: 'text-purple-600', label: '项目' }
};

// 优先级配置
const priorityConfig = {
  low: { color: 'text-gray-500', bgColor: 'bg-gray-100', label: '低' },
  medium: { color: 'text-blue-500', bgColor: 'bg-blue-100', label: '中' },
  high: { color: 'text-orange-500', bgColor: 'bg-orange-100', label: '高' },
  urgent: { color: 'text-red-500', bgColor: 'bg-red-100', label: '紧急' }
};

// 时间格式化
const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  });
};

// 截断文本
const truncateText = (text: string, maxLength: number = 50) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// 获取会话图标
const getConversationIcon = (conversation: Conversation) => {
  const config = conversationTypeConfig[conversation.type];
  const IconComponent = config.icon;
  
  if (conversation.avatar) {
    return (
      <Avatar className="h-12 w-12">
        <AvatarImage src={conversation.avatar} alt={conversation.name} />
        <AvatarFallback>
          <IconComponent className={cn('h-6 w-6', config.color)} />
        </AvatarFallback>
      </Avatar>
    );
  }
  
  return (
    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
      <IconComponent className={cn('h-6 w-6', config.color)} />
    </div>
  );
};

export function ConversationList({
  conversations,
  selectedConversationId,
  onConversationSelect,
  onNewConversation,
  className
}: ConversationListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);

  // 过滤会话
  const filteredConversations = conversations.filter(conversation => {
    // 搜索过滤
    if (searchQuery && !conversation.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !conversation.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // 类型过滤
    if (selectedType !== 'all' && conversation.type !== selectedType) {
      return false;
    }
    
    // 归档过滤
    if (!showArchived && conversation.isArchived) {
      return false;
    }
    
    return true;
  });

  // 排序会话（置顶 > 未读 > 最后活动时间）
  const sortedConversations = filteredConversations.sort((a, b) => {
    // 置顶优先
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // 未读优先
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
    
    // 按最后活动时间排序
    return b.lastActivity.getTime() - a.lastActivity.getTime();
  });

  // 会话操作
  const handleConversationAction = (conversation: Conversation, action: string, e: React.MouseEvent) => {
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
      case 'delete':
        // TODO: 实现删除功能
        console.log('Delete conversation:', conversation.id);
        break;
    }
  };

  // 处理会话点击
  const handleConversationClick = (conversation: Conversation) => {
    onConversationSelect(conversation);
    
    // 根据会话类型导航到对应页面
    switch (conversation.type) {
      case 'private':
        router.push(`/dashboard/messages/private/${conversation.id}`);
        break;
      case 'group':
        router.push(`/dashboard/messages/group/${conversation.id}`);
        break;
      case 'system':
        router.push('/dashboard/messages/system');
        break;
      case 'project':
        router.push('/dashboard/messages/notifications');
        break;
    }
  };

  // 统计数据
  const stats = {
    total: conversations.filter(c => !c.isArchived).length,
    unread: conversations.filter(c => c.unreadCount > 0 && !c.isArchived).length,
    archived: conversations.filter(c => c.isArchived).length
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 头部 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">消息</h2>
          {onNewConversation && (
            <Button size="sm" onClick={onNewConversation}>
              新建对话
            </Button>
          )}
        </div>
        
        {/* 搜索框 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索对话..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* 过滤器 */}
        <div className="flex gap-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              {Object.entries(conversationTypeConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showArchived ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowArchived(!showArchived)}
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showArchived ? '隐藏归档' : '显示归档'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* 统计信息 */}
        <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
          <span>总计: {stats.total}</span>
          <span>未读: {stats.unread}</span>
          {showArchived && <span>归档: {stats.archived}</span>}
        </div>
      </div>

      {/* 会话列表 */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {sortedConversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || selectedType !== 'all' ? '没有找到匹配的对话' : '暂无对话'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {sortedConversations.map((conversation) => {
                const isSelected = selectedConversationId === conversation.id;
                const TypeIcon = conversationTypeConfig[conversation.type].icon;
                
                return (
                  <div
                    key={conversation.id}
                    className={cn(
                      'group relative p-3 rounded-lg cursor-pointer transition-all duration-200',
                      'hover:bg-muted/50',
                      isSelected && 'bg-primary/10 border border-primary/20',
                      conversation.unreadCount > 0 && !isSelected && 'bg-blue-50/50',
                      conversation.isArchived && 'opacity-60'
                    )}
                    onClick={() => handleConversationClick(conversation)}
                  >
                    <div className="flex items-start gap-3">
                      {/* 头像/图标 */}
                      <div className="relative">
                        {getConversationIcon(conversation)}
                        
                        {/* 在线状态 */}
                        {conversation.type === 'private' && conversation.isOnline !== undefined && (
                          <div className={cn(
                            'absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background',
                            conversation.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          )} />
                        )}
                        
                        {/* 置顶标识 */}
                        {conversation.isPinned && (
                          <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-yellow-500 flex items-center justify-center">
                            <Pin className="h-2 w-2 text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* 会话信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className={cn(
                              'font-medium truncate',
                              conversation.unreadCount > 0 && 'font-semibold text-foreground'
                            )}>
                              {conversation.name}
                            </h3>
                            
                            {/* 会话类型图标 */}
                            <TypeIcon className={cn(
                              'h-3 w-3 flex-shrink-0',
                              conversationTypeConfig[conversation.type].color
                            )} />
                            
                            {/* 静音图标 */}
                            {conversation.isMuted && (
                              <VolumeX className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            )}
                            
                            {/* 优先级标识 */}
                            {conversation.priority && conversation.priority !== 'low' && (
                              <Badge 
                                className={cn(
                                  'text-xs px-1 py-0',
                                  priorityConfig[conversation.priority].color,
                                  priorityConfig[conversation.priority].bgColor
                                )}
                              >
                                {priorityConfig[conversation.priority].label}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {/* 时间 */}
                            <span className="text-xs text-muted-foreground">
                              {formatTime(conversation.lastMessage.timestamp)}
                            </span>
                            
                            {/* 操作菜单 */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={(e) => handleConversationAction(conversation, 'pin', e)}
                                >
                                  <Pin className="h-4 w-4 mr-2" />
                                  {conversation.isPinned ? '取消置顶' : '置顶'}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => handleConversationAction(conversation, 'mute', e)}
                                >
                                  {conversation.isMuted ? (
                                    <><Volume2 className="h-4 w-4 mr-2" />取消静音</>
                                  ) : (
                                    <><VolumeX className="h-4 w-4 mr-2" />静音</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={(e) => handleConversationAction(conversation, 'archive', e)}
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  归档
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={(e) => handleConversationAction(conversation, 'delete', e)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  删除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        {/* 最后消息 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            {/* 发送者（群聊时显示） */}
                            {conversation.type === 'group' && conversation.lastMessage.sender && (
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {conversation.lastMessage.sender.name}:
                              </span>
                            )}
                            
                            {/* 消息内容 */}
                            <p className={cn(
                              'text-sm text-muted-foreground truncate',
                              conversation.unreadCount > 0 && 'font-medium text-foreground'
                            )}>
                              {conversation.lastMessage.type === 'image' && '[图片]'}
                              {conversation.lastMessage.type === 'file' && '[文件]'}
                              {conversation.lastMessage.type === 'system' && '[系统消息]'}
                              {conversation.lastMessage.type === 'text' && truncateText(conversation.lastMessage.content)}
                            </p>
                          </div>
                          
                          {/* 未读数量 */}
                          {conversation.unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center px-1">
                              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        
                        {/* 参与者（群聊时显示） */}
                        {conversation.type === 'group' && conversation.participants && (
                          <div className="flex items-center gap-1 mt-2">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {conversation.participants.length} 人
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}