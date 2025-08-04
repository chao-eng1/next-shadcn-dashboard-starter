'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
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
  MoreHorizontal,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { ConversationList } from './conversation-list';
import { ChatContent } from './chat-content';
import { GlobalNotificationStatus } from './global-notification-status';
import { NewPrivateChatDialog } from './new-private-chat-dialog';
import { useRecentMessages } from '@/hooks/use-recent-messages';
import { useMessageCenter } from '@/hooks/use-message-center';
import { useUnreadMessages } from '@/hooks/use-unread-messages';

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

export function MessageCenterMain() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ConversationType | 'all'>('all');
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const { unreadCount } = useRecentMessages();
  const { unreadCount: globalUnreadCount, fetchUnreadCount } =
    useUnreadMessages();
  const { isConnected, connect, disconnect } = useMessageCenter({});

  // WebSocket连接管理
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // 获取会话列表
  const fetchConversations = async (retry = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/message-center/conversations');
      if (response.ok) {
        const data = await response.json();
        const formattedConversations = data.data.map((conv: any) => ({
          ...conv,
          lastMessage: conv.lastMessage
            ? {
                ...conv.lastMessage,
                timestamp: new Date(conv.lastMessage.timestamp)
              }
            : undefined,
          lastActivity: new Date(conv.lastActivity),
          isPinned: false, // TODO: 实现置顶功能
          isMuted: false // TODO: 实现免打扰功能
        }));
        setConversations(formattedConversations);
        setRetryCount(0); // 重置重试计数
      } else {
        throw new Error(
          `服务器响应错误: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error('获取会话列表失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setError(`加载消息失败: ${errorMessage}`);

      if (!retry && retryCount < 3) {
        // 自动重试机制
        setRetryCount((prev) => prev + 1);
        setTimeout(
          () => {
            fetchConversations(true);
          },
          2000 * retryCount + 1000
        ); // 递增延迟重试
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // 监听未读计数更新事件
  useEffect(() => {
    const handleUnreadCountUpdate = (event: CustomEvent) => {
      console.log(
        'Message center: Received unread count update for conversation:',
        event.detail.conversationId
      );

      const { conversationId, increment } = event.detail;

      // 更新对应会话的未读计数
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              unreadCount: conv.unreadCount + increment
            };
          }
          return conv;
        })
      );

      // 刷新全局未读计数
      fetchUnreadCount();
    };

    const handleConversationRead = (event: CustomEvent) => {
      console.log(
        'Message center: Conversation marked as read:',
        event.detail.conversationId
      );

      const { conversationId } = event.detail;

      // 立即清除对应会话的未读计数（UI优化）
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              unreadCount: 0
            };
          }
          return conv;
        })
      );

      // 刷新全局未读计数
      fetchUnreadCount();

      // 延迟一点时间后重新获取会话列表，确保服务器端数据已更新
      setTimeout(() => {
        fetchConversations();
      }, 1000);
    };

    const handleRefreshConversations = () => {
      console.log(
        'Message center: Refreshing conversations due to external trigger'
      );
      fetchConversations();
    };

    window.addEventListener(
      'unreadCountUpdate',
      handleUnreadCountUpdate as EventListener
    );
    window.addEventListener(
      'conversationRead',
      handleConversationRead as EventListener
    );
    window.addEventListener(
      'refreshConversations',
      handleRefreshConversations as EventListener
    );

    return () => {
      window.removeEventListener(
        'unreadCountUpdate',
        handleUnreadCountUpdate as EventListener
      );
      window.removeEventListener(
        'conversationRead',
        handleConversationRead as EventListener
      );
      window.removeEventListener(
        'refreshConversations',
        handleRefreshConversations as EventListener
      );
    };
  }, [fetchUnreadCount]);

  // 计算未读消息总数 - 优先使用全局未读计数
  const totalUnreadCount =
    globalUnreadCount ||
    unreadCount?.total ||
    conversations.reduce((total, conv) => total + conv.unreadCount, 0);

  // 过滤会话
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      !searchQuery ||
      conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage?.content
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

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
    setShowNewChatDialog(true);
  };

  const handleMessageSettings = () => {
    router.push('/dashboard/messages/settings');
  };

  // 手动重试
  const handleRetry = () => {
    setRetryCount(0);
    fetchConversations();
  };

  return (
    <div className='bg-background flex h-full flex-col overflow-hidden'>
      {/* 顶部状态栏 */}
      <div className='bg-card flex flex-shrink-0 items-center justify-between border-b p-4'>
        <div className='flex items-center gap-3'>
          <MessageSquare className='text-primary h-6 w-6' />
          <h1 className='text-xl font-semibold'>消息中心</h1>
        </div>

        <div className='flex items-center gap-2'>
          <GlobalNotificationStatus isConnected={isConnected} />
          <Button variant='ghost' size='sm' onClick={handleMessageSettings}>
            <Settings className='h-4 w-4' />
          </Button>
        </div>
      </div>

      <ResizablePanelGroup direction='horizontal' className='min-h-0 flex-1'>
        {/* 左侧会话列表 */}
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
          <div className='flex h-full flex-col overflow-hidden'>
            {/* 搜索和筛选 */}
            <div className='flex-shrink-0 space-y-3 border-b p-4'>
              <div className='relative'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                <Input
                  placeholder='搜索会话或消息...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-9'
                />
              </div>

              {/* 筛选按钮 */}
              <div className='flex flex-wrap gap-2'>
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setFilterType('all')}
                >
                  全部
                </Button>
                <Button
                  variant={filterType === 'private' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setFilterType('private')}
                >
                  <MessageSquare className='mr-1 h-3 w-3' />
                  私聊
                </Button>
                <Button
                  variant={filterType === 'group' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setFilterType('group')}
                >
                  <Users className='mr-1 h-3 w-3' />
                  群聊
                </Button>
                <Button
                  variant={filterType === 'system' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setFilterType('system')}
                >
                  <Bell className='mr-1 h-3 w-3' />
                  系统
                </Button>
                <Button
                  variant={filterType === 'project' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setFilterType('project')}
                >
                  <Briefcase className='mr-1 h-3 w-3' />
                  项目
                </Button>
              </div>
            </div>

            {/* 会话列表 */}
            <ScrollArea className='min-h-0 flex-1'>
              {error ? (
                <div className='flex flex-col items-center justify-center space-y-4 p-6'>
                  <AlertCircle className='h-12 w-12 text-red-500' />
                  <div className='space-y-2 text-center'>
                    <h3 className='font-medium text-red-700'>加载失败</h3>
                    <p className='text-muted-foreground text-sm'>{error}</p>
                    {retryCount > 0 && (
                      <p className='text-muted-foreground text-xs'>
                        已重试 {retryCount} 次
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleRetry}
                    variant='outline'
                    size='sm'
                    disabled={loading}
                    className='mt-2'
                  >
                    {loading ? (
                      <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <RefreshCw className='mr-2 h-4 w-4' />
                    )}
                    重试
                  </Button>
                </div>
              ) : loading ? (
                <div className='flex flex-col items-center justify-center space-y-4 p-6'>
                  <RefreshCw className='text-primary h-8 w-8 animate-spin' />
                  <div className='space-y-1 text-center'>
                    <p className='text-muted-foreground text-sm'>
                      正在加载消息...
                    </p>
                    {retryCount > 0 && (
                      <p className='text-muted-foreground text-xs'>
                        重试中... ({retryCount}/3)
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <ConversationList
                  conversations={filteredConversations}
                  selectedConversation={selectedConversation}
                  onConversationClick={handleConversationClick}
                />
              )}
            </ScrollArea>

            {/* 快速操作 */}
            <div className='flex-shrink-0 border-t p-4'>
              <Button onClick={handleNewPrivateChat} className='w-full'>
                <Plus className='mr-2 h-4 w-4' />
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

      {/* 新建私聊对话框 */}
      <NewPrivateChatDialog
        open={showNewChatDialog}
        onOpenChange={setShowNewChatDialog}
      />
    </div>
  );
}
