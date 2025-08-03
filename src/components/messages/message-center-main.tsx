'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  MessageSquare,
  Users,
  Bell,
  Briefcase,
  Settings,
  Search,
  Plus,
  Wifi,
  WifiOff,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { ConversationList } from './conversation-list';
import { ChatContent } from './chat-content';
import { GlobalNotificationStatus } from './global-notification-status';

// 会话类型
type ConversationType = 'private' | 'group' | 'system' | 'project';

// 会话接口
interface Conversation {
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

// 模拟会话数据
const mockConversations: Conversation[] = [
  {
    id: 'conv1',
    type: 'private',
    name: '张三',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20asian%20man%20suit&image_size=square',
    lastMessage: {
      content: '好的，我明天会准时参加会议',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      sender: { id: 'user1', name: '张三' }
    },
    unreadCount: 2,
    isOnline: true,
    isPinned: false,
    isMuted: false,
    lastActivity: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    id: 'conv2',
    type: 'group',
    name: '项目Alpha讨论组',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20team%20collaboration%20icon%20blue%20gradient&image_size=square',
    lastMessage: {
      content: '大家对新的UI设计有什么看法？',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      sender: { id: 'user2', name: '李四' }
    },
    unreadCount: 5,
    isPinned: true,
    isMuted: false,
    lastActivity: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: 'conv3',
    type: 'system',
    name: '系统通知',
    lastMessage: {
      content: '您的密码将在7天后过期，请及时更新',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    unreadCount: 1,
    isPinned: false,
    isMuted: false,
    priority: 'important',
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: 'conv4',
    type: 'project',
    name: '项目Beta通知',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20project%20notification%20icon%20purple%20gradient&image_size=square',
    lastMessage: {
      content: '任务"API接口开发"已完成',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    unreadCount: 3,
    isPinned: false,
    isMuted: false,
    priority: 'normal',
    projectId: 'proj2',
    lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000)
  }
];

export function MessageCenterMain() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ConversationType | 'all'>('all');
  const [isConnected, setIsConnected] = useState(true);

  // 计算未读消息总数
  const totalUnreadCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);

  // 过滤会话
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchQuery || 
      conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || conv.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  // 处理会话点击
  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // 不再跳转页面，直接在右侧显示聊天内容
  };

  // 快速操作
  const handleNewPrivateChat = () => {
    router.push('/dashboard/messages/private/new');
  };

  const handleMessageSettings = () => {
    router.push('/dashboard/messages/settings');
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between p-4 border-b bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">消息中心</h1>
          {totalUnreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <GlobalNotificationStatus isConnected={isConnected} />
          <Button variant="ghost" size="sm" onClick={handleMessageSettings}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* 左侧会话列表 */}
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
          <div className="h-full flex flex-col overflow-hidden">
            {/* 搜索和筛选 */}
            <div className="p-4 space-y-3 border-b flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索会话或消息..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {/* 筛选按钮 */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                >
                  全部
                </Button>
                <Button
                  variant={filterType === 'private' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('private')}
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  私聊
                </Button>
                <Button
                  variant={filterType === 'group' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('group')}
                >
                  <Users className="h-3 w-3 mr-1" />
                  群聊
                </Button>
                <Button
                  variant={filterType === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('system')}
                >
                  <Bell className="h-3 w-3 mr-1" />
                  系统
                </Button>
                <Button
                  variant={filterType === 'project' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('project')}
                >
                  <Briefcase className="h-3 w-3 mr-1" />
                  项目
                </Button>
              </div>
            </div>

            {/* 会话列表 */}
            <ScrollArea className="flex-1 min-h-0">
              <ConversationList
                conversations={filteredConversations}
                selectedConversation={selectedConversation}
                onConversationClick={handleConversationClick}
              />
            </ScrollArea>

            {/* 快速操作 */}
            <div className="p-4 border-t flex-shrink-0">
              <Button onClick={handleNewPrivateChat} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                新建私聊
              </Button>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* 右侧聊天内容 */}
        <ResizablePanel defaultSize={65}>
          <ChatContent conversation={selectedConversation} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}