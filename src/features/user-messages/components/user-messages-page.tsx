'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  Globe,
  Users,
  Eye,
  Search,
  Mail,
  MailOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UserMessage {
  id: string;
  message: {
    id: string;
    title: string;
    content: string;
    isGlobal: boolean;
    createdAt: string;
    sender: {
      id: string;
      name: string;
      email: string;
    };
  };
  isRead: boolean;
  readAt?: string;
}

interface UserMessagesPageProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
}

export function UserMessagesPage({ currentUser }: UserMessagesPageProps) {
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

  // 加载用户消息
  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user-messages');
      if (response.ok) {
        let data = await response.json();
        setMessages(
          Array.isArray(data.data.messages) ? data.data.messages : []
        );
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('加载消息失败');
    } finally {
      setLoading(false);
    }
  };

  // 标记消息为已读
  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/user-messages/${messageId}/read`, {
        method: 'POST'
      });

      if (response.ok) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, isRead: true, readAt: new Date().toISOString() }
              : msg
          )
        );
        toast.success('消息已标记为已读');
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      toast.error('标记已读失败');
    }
  };

  // 批量标记为已读
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/user-messages/mark-all-read', {
        method: 'POST'
      });

      if (response.ok) {
        setMessages((prev) =>
          prev.map((msg) => ({
            ...msg,
            isRead: true,
            readAt: new Date().toISOString()
          }))
        );
        toast.success('所有消息已标记为已读');
      }
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      toast.error('批量标记已读失败');
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  // 格式化时间
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // 获取消息类型描述
  const getMessageTypeDescription = (message: UserMessage['message']) => {
    if (message.isGlobal) {
      return {
        icon: <Globe className='h-4 w-4' />,
        text: '全体消息',
        variant: 'default' as const
      };
    }

    return {
      icon: <Users className='h-4 w-4' />,
      text: '定向消息',
      variant: 'secondary' as const
    };
  };

  // 过滤消息
  const filteredMessages = messages.filter((msg) => {
    // 状态过滤
    let statusMatch = true;
    if (filter === 'unread') statusMatch = !msg.isRead;
    if (filter === 'read') statusMatch = msg.isRead;

    // 搜索过滤
    let searchMatch = true;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      searchMatch =
        msg.message.title.toLowerCase().includes(query) ||
        msg.message.content.toLowerCase().includes(query) ||
        msg.message.sender.name.toLowerCase().includes(query) ||
        msg.message.sender.email.toLowerCase().includes(query);
    }

    return statusMatch && searchMatch;
  });

  const unreadCount = messages.filter((msg) => !msg.isRead).length;

  return (
    <div className='flex h-screen flex-col space-y-6 overflow-hidden p-6'>
      {/* 页面头部 */}
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>我的消息</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            共 {messages.length} 条消息，{unreadCount} 条未读
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant='outline'>
            <CheckCircle className='mr-2 h-4 w-4' />
            全部标记为已读
          </Button>
        )}
      </div>

      {/* 搜索和过滤区域 */}
      <div className='flex flex-col gap-4 sm:flex-row'>
        {/* 搜索框 */}
        <div className='relative flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
          <Input
            placeholder='搜索消息...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10'
          />
        </div>

        {/* 过滤器按钮 */}
        <div className='flex gap-2'>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size='sm'
          >
            全部 ({messages.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            onClick={() => setFilter('unread')}
            size='sm'
          >
            未读 ({unreadCount})
          </Button>
          <Button
            variant={filter === 'read' ? 'default' : 'outline'}
            onClick={() => setFilter('read')}
            size='sm'
          >
            已读 ({messages.length - unreadCount})
          </Button>
        </div>
      </div>

      {/* 消息列表 */}
      <Card className='flex min-h-0 flex-1 flex-col'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MessageSquare className='h-5 w-5' />
            消息列表
            {filteredMessages.length > 0 && (
              <Badge variant='secondary' className='ml-auto'>
                {filteredMessages.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className='flex min-h-0 flex-1 flex-col'>
          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2'></div>
              <span className='text-muted-foreground ml-2 text-sm'>
                加载中...
              </span>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className='py-12 text-center'>
              <MessageSquare className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
              <h3 className='mb-2 text-lg font-medium'>
                {searchQuery ? '未找到匹配的消息' : '暂无消息'}
              </h3>
              <p className='text-muted-foreground text-sm'>
                {searchQuery
                  ? '尝试使用不同的关键词搜索'
                  : `您目前没有任何${filter === 'all' ? '' : filter === 'unread' ? '未读' : '已读'}消息`}
              </p>
            </div>
          ) : (
            <ScrollArea className='min-h-0 flex-1'>
              <div className='space-y-4'>
                {filteredMessages.map((userMessage) => {
                  const message = userMessage.message;
                  const typeInfo = getMessageTypeDescription(message);

                  return (
                    <Card
                      key={userMessage.id}
                      className={cn(
                        'transition-colors',
                        !userMessage.isRead &&
                          'border-l-primary bg-muted/50 border-l-4'
                      )}
                    >
                      <CardContent className='p-4'>
                        <div className='flex items-start justify-between gap-4'>
                          <div className='flex-1 space-y-2'>
                            <div className='flex items-center gap-2'>
                              <h3 className='leading-none font-medium'>
                                {message.title}
                              </h3>
                              {!userMessage.isRead && (
                                <Badge
                                  variant='destructive'
                                  className='text-xs'
                                >
                                  新消息
                                </Badge>
                              )}
                            </div>

                            <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                              <div className='bg-muted flex h-6 w-6 items-center justify-center rounded-full'>
                                <span className='text-xs font-medium'>
                                  {message.sender.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span>{message.sender.name}</span>
                              <span>•</span>
                              <span>{message.sender.email}</span>
                            </div>

                            <div className='text-muted-foreground bg-muted/50 rounded p-3 text-sm'>
                              <div className='line-clamp-3'>
                                {message.content}
                              </div>
                            </div>

                            <div className='text-muted-foreground flex items-center justify-between text-xs'>
                              <div className='flex items-center gap-1'>
                                <Clock className='h-3 w-3' />
                                <span>
                                  发送时间: {formatTime(message.createdAt)}
                                </span>
                              </div>
                              {userMessage.isRead && userMessage.readAt && (
                                <div className='flex items-center gap-1 text-green-600'>
                                  <CheckCircle className='h-3 w-3' />
                                  <span>
                                    已读时间: {formatTime(userMessage.readAt)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className='flex flex-col items-end gap-2'>
                            <Badge
                              variant={typeInfo.variant}
                              className='flex items-center gap-1'
                            >
                              {typeInfo.icon}
                              {typeInfo.text}
                            </Badge>
                            {!userMessage.isRead && (
                              <Button
                                size='sm'
                                onClick={() => markAsRead(userMessage.id)}
                              >
                                <Eye className='mr-1 h-4 w-4' />
                                标记已读
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
