'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send, History, Users, Globe, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { MessageForm } from './message-form';
import { MessageFormValues } from '../schemas/message-schema';

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface Message {
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
  recipients: Array<{
    user: {
      id: string;
      name: string;
      email: string;
    };
    isRead: boolean;
    readAt?: string;
  }>;
}

interface MessageManagementPageProps {
  roles: Role[];
  users: User[];
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
}

export function MessageManagementPage({
  roles,
  users,
  currentUser
}: MessageManagementPageProps) {
  const [activeTab, setActiveTab] = useState('send');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<MessageFormValues | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [lastSentMessage, setLastSentMessage] = useState<string | null>(null);

  // 加载消息历史
  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/messages');
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

  // 当切换到历史记录标签时加载消息
  useEffect(() => {
    if (activeTab === 'history') {
      loadMessages();
    }
  }, [activeTab]);

  // 发送成功后的回调
  const handleSendSuccess = () => {
    // 显示成功提示
    setShowSuccessMessage(true);
    setLastSentMessage(previewData?.title || '系统消息');
    
    // 3秒后隐藏成功提示
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
    
    // 自动切换到历史记录标签页
    setActiveTab('history');
    
    // 加载最新的消息列表
    loadMessages();
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // 获取接收者类型描述
  const getRecipientTypeDescription = (message: Message) => {
    if (message.isGlobal) {
      return {
        icon: <Globe className="h-4 w-4" />,
        text: '全体用户',
        variant: 'default' as const
      };
    }
    
    const recipientCount = message.recipients.length;
    return {
      icon: <Users className="h-4 w-4" />,
      text: `${recipientCount} 个用户`,
      variant: 'secondary' as const
    };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 成功提示区域 */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-800">
              消息发送成功！
            </h3>
            <p className="text-sm text-green-700 mt-1">
              消息「{lastSentMessage}」已成功发送，您可以在下方的消息历史中查看详情。
            </p>
          </div>
          <button
            onClick={() => setShowSuccessMessage(false)}
            className="flex-shrink-0 text-green-600 hover:text-green-800 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">系统消息管理</h1>
          <p className="text-muted-foreground mt-2">
            发送系统消息给用户，支持全体发送、按角色发送或指定用户发送
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            发送消息
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            消息历史
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 消息表单 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  发送系统消息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MessageForm
                  roles={roles}
                  users={users}
                  onSuccess={handleSendSuccess}
                  onFormChange={setPreviewData}
                />
              </CardContent>
            </Card>

            {/* 消息预览 */}
            <Card>
              <CardHeader>
                <CardTitle>消息预览</CardTitle>
              </CardHeader>
              <CardContent>
                {previewData && (previewData.title || previewData.content) ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {previewData.title || '(无标题)'}
                      </h3>
                    </div>
                    <Separator />
                    <div className="whitespace-pre-wrap text-sm">
                      {previewData.content || '(无内容)'}
                    </div>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>发送给:</span>
                      {previewData.recipientType === 'global' && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          全体用户
                        </Badge>
                      )}
                      {previewData.recipientType === 'roles' && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {previewData.roleIds?.length || 0} 个角色
                        </Badge>
                      )}
                      {previewData.recipientType === 'users' && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          {previewData.recipientIds?.length || 0} 个用户
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>在左侧填写消息内容，这里将显示预览</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                消息历史记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">加载中...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无消息记录</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const recipientInfo = getRecipientTypeDescription(message);
                      const readCount = message.recipients.filter(r => r.isRead).length;
                      const totalCount = message.recipients.length;
                      
                      return (
                        <Card key={message.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h3 className="font-semibold">{message.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  发送者: {message.sender.name} ({message.sender.email})
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={recipientInfo.variant} className="flex items-center gap-1">
                                  {recipientInfo.icon}
                                  {recipientInfo.text}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {message.content}
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>发送时间: {formatTime(message.createdAt)}</span>
                              <span>已读: {readCount}/{totalCount}</span>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}