'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { MessageSquare, Clock, CheckCircle, Globe, Users, UserCheck, Eye } from 'lucide-react';
import { toast } from 'sonner';

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

  // 加载用户消息
  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user-messages');
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
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
        setMessages(prev => 
          prev.map(msg => 
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
        setMessages(prev => 
          prev.map(msg => ({ ...msg, isRead: true, readAt: new Date().toISOString() }))
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
        icon: <Globe className="h-4 w-4" />,
        text: '全体消息',
        variant: 'default' as const
      };
    }
    
    return {
      icon: <Users className="h-4 w-4" />,
      text: '定向消息',
      variant: 'secondary' as const
    };
  };

  // 过滤消息
  const filteredMessages = messages.filter(msg => {
    if (filter === 'unread') return !msg.isRead;
    if (filter === 'read') return msg.isRead;
    return true;
  });

  const unreadCount = messages.filter(msg => !msg.isRead).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">我的消息</h1>
          <p className="text-muted-foreground mt-2">
            查看和管理您收到的系统消息
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              全部标记为已读
            </Button>
          )}
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">总消息数</p>
                <p className="text-2xl font-bold">{messages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">未读消息</p>
                <p className="text-2xl font-bold text-orange-600">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">已读消息</p>
                <p className="text-2xl font-bold text-green-600">{messages.length - unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 过滤器 */}
      <div className="flex gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          全部 ({messages.length})
        </Button>
        <Button 
          variant={filter === 'unread' ? 'default' : 'outline'}
          onClick={() => setFilter('unread')}
          size="sm"
        >
          未读 ({unreadCount})
        </Button>
        <Button 
          variant={filter === 'read' ? 'default' : 'outline'}
          onClick={() => setFilter('read')}
          size="sm"
        >
          已读 ({messages.length - unreadCount})
        </Button>
      </div>

      {/* 消息列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            消息列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">加载中...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无消息</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredMessages.map((userMessage) => {
                  const message = userMessage.message;
                  const typeInfo = getMessageTypeDescription(message);
                  
                  return (
                    <Card 
                      key={userMessage.id} 
                      className={`p-4 transition-colors ${
                        !userMessage.isRead 
                          ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800' 
                          : ''
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{message.title}</h3>
                              {!userMessage.isRead && (
                                <Badge variant="destructive" className="text-xs">
                                  未读
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              发送者: {message.sender.name} ({message.sender.email})
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={typeInfo.variant} className="flex items-center gap-1">
                              {typeInfo.icon}
                              {typeInfo.text}
                            </Badge>
                            {!userMessage.isRead && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsRead(userMessage.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                标记已读
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>发送时间: {formatTime(message.createdAt)}</span>
                          {userMessage.isRead && userMessage.readAt && (
                            <span>已读时间: {formatTime(userMessage.readAt)}</span>
                          )}
                        </div>
                      </div>
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