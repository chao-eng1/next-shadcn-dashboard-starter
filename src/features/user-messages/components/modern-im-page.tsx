'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Users, 
  Settings, 
  Search, 
  Send, 
  Phone, 
  Video, 
  MoreVertical,
  Paperclip,
  Smile,
  Clock,
  CheckCircle2,
  Circle,
  Globe,
  Hash,
  Plus,
  X,
  Loader2,
  Bell,
  BellOff
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// 类型定义
interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderImage?: string;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'system';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
}

interface Conversation {
  id: string;
  name: string;
  type: 'project' | 'private' | 'system';
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isOnline?: boolean;
  projectId?: string;
  avatar?: string;
}

interface ModernIMPageProps {
  currentUser: User;
}

export function ModernIMPage({ currentUser }: ModernIMPageProps) {
  const [activeTab, setActiveTab] = useState<'project' | 'private' | 'system'>('project');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 模拟数据
  const mockConversations: Conversation[] = [
    {
      id: '1',
      name: '项目Alpha开发组',
      type: 'project',
      participants: [
        { id: '1', name: '张三', email: 'zhang@example.com', status: 'online' },
        { id: '2', name: '李四', email: 'li@example.com', status: 'away' },
        { id: '3', name: '王五', email: 'wang@example.com', status: 'offline' }
      ],
      lastMessage: {
        id: '1',
        content: '今天的代码审查会议推迟到下午3点',
        senderId: '1',
        senderName: '张三',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        type: 'text',
        status: 'read'
      },
      unreadCount: 2,
      isOnline: true,
      projectId: 'proj1'
    },
    {
      id: '2',
      name: '李四',
      type: 'private',
      participants: [
        { id: '2', name: '李四', email: 'li@example.com', status: 'online', image: '/avatars/li.jpg' }
      ],
      lastMessage: {
        id: '2',
        content: '关于明天的需求评审，我有几个问题想和你讨论',
        senderId: '2',
        senderName: '李四',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: 'text',
        status: 'delivered'
      },
      unreadCount: 1,
      isOnline: true
    },
    {
      id: '3',
      name: '系统通知',
      type: 'system',
      participants: [],
      lastMessage: {
        id: '3',
        content: '您的账户安全设置已更新',
        senderId: 'system',
        senderName: '系统',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        type: 'system',
        status: 'read'
      },
      unreadCount: 0,
      isOnline: false
    }
  ];

  const mockMessages: Message[] = [
    {
      id: '1',
      content: '大家好，今天我们来讨论一下项目的进度安排',
      senderId: '1',
      senderName: '张三',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      status: 'read'
    },
    {
      id: '2',
      content: '好的，我这边的前端开发已经完成了80%',
      senderId: currentUser.id,
      senderName: currentUser.name,
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      status: 'read'
    },
    {
      id: '3',
      content: '后端API还需要再优化一下性能',
      senderId: '2',
      senderName: '李四',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      status: 'read',
      replyTo: {
        id: '2',
        content: '好的，我这边的前端开发已经完成了80%',
        senderName: currentUser.name
      }
    },
    {
      id: '4',
      content: '今天的代码审查会议推迟到下午3点',
      senderId: '1',
      senderName: '张三',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      type: 'text',
      status: 'delivered'
    }
  ];

  useEffect(() => {
    setConversations(mockConversations.filter(conv => conv.type === activeTab));
  }, [activeTab]);

  useEffect(() => {
    if (selectedConversation) {
      setMessages(mockMessages);
      scrollToBottom();
    }
  }, [selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderImage: currentUser.image,
      timestamp: new Date().toISOString(),
      type: 'text',
      status: 'sending'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    scrollToBottom();

    // 模拟发送
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === message.id 
            ? { ...msg, status: 'sent' as const }
            : msg
        )
      );
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
      case 'sent':
        return <Circle className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCircle2 className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const getConversationIcon = (type: Conversation['type']) => {
    switch (type) {
      case 'project':
        return <Hash className="h-4 w-4" />;
      case 'private':
        return <MessageCircle className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* 顶部导航栏 */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">即时通讯</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">与团队保持实时沟通</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧边栏 */}
        <div className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col">
          {/* 标签页 */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="project" className="flex items-center gap-1 text-xs">
                  <Hash className="h-3 w-3" />
                  项目群聊
                </TabsTrigger>
                <TabsTrigger value="private" className="flex items-center gap-1 text-xs">
                  <MessageCircle className="h-3 w-3" />
                  私聊
                </TabsTrigger>
                <TabsTrigger value="system" className="flex items-center gap-1 text-xs">
                  <Settings className="h-3 w-3" />
                  系统
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* 搜索框 */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="搜索会话..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          {/* 会话列表 */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {searchQuery ? '未找到匹配的会话' : '暂无会话'}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 mb-1",
                      selectedConversation?.id === conversation.id && "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                    )}
                  >
                    <div className="relative">
                      {conversation.type === 'private' ? (
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conversation.participants[0]?.image} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-500 text-white">
                            {conversation.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center text-white",
                          conversation.type === 'project' ? "bg-gradient-to-r from-green-400 to-blue-500" : "bg-gradient-to-r from-orange-400 to-red-500"
                        )}>
                          {getConversationIcon(conversation.type)}
                        </div>
                      )}
                      {conversation.isOnline && conversation.type === 'private' && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-sm text-slate-900 dark:text-white truncate">
                          {conversation.name}
                        </h3>
                        {conversation.lastMessage && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                            {formatTime(conversation.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {conversation.lastMessage ? (
                            conversation.type === 'private' || conversation.lastMessage.senderId === currentUser.id
                              ? conversation.lastMessage.content
                              : `${conversation.lastMessage.senderName}: ${conversation.lastMessage.content}`
                          ) : (
                            '暂无消息'
                          )}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs h-5 min-w-[20px] rounded-full flex items-center justify-center">
                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* 主聊天区域 */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* 聊天头部 */}
              <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {selectedConversation.type === 'private' ? (
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={selectedConversation.participants[0]?.image} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-500 text-white">
                            {selectedConversation.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center text-white",
                          selectedConversation.type === 'project' ? "bg-gradient-to-r from-green-400 to-blue-500" : "bg-gradient-to-r from-orange-400 to-red-500"
                        )}>
                          {getConversationIcon(selectedConversation.type)}
                        </div>
                      )}
                      {selectedConversation.isOnline && selectedConversation.type === 'private' && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
                      )}
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-900 dark:text-white">{selectedConversation.name}</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {selectedConversation.type === 'project' 
                          ? `${selectedConversation.participants.length} 名成员`
                          : selectedConversation.type === 'private'
                          ? selectedConversation.isOnline ? '在线' : '离线'
                          : '系统消息'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {selectedConversation.type === 'private' && (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* 消息区域 */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">开始对话</h3>
                      <p className="text-slate-500 dark:text-slate-400">发送第一条消息开始聊天</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwn = message.senderId === currentUser.id;
                      return (
                        <div key={message.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                          <div className={cn("flex gap-2 max-w-[70%]", isOwn ? "flex-row-reverse" : "flex-row")}>
                            {!isOwn && (
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src={message.senderImage} />
                                <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-500 text-white text-sm">
                                  {message.senderName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div className={cn("space-y-1", isOwn ? "items-end" : "items-start")}>
                              {!isOwn && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 px-3">
                                  {message.senderName}
                                </p>
                              )}
                              
                              {message.replyTo && (
                                <div className={cn(
                                  "text-xs p-2 rounded-lg border-l-2 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600",
                                  isOwn ? "mr-3" : "ml-3"
                                )}>
                                  <p className="font-medium text-slate-600 dark:text-slate-300">{message.replyTo.senderName}</p>
                                  <p className="text-slate-500 dark:text-slate-400 truncate">{message.replyTo.content}</p>
                                </div>
                              )}
                              
                              <div className={cn(
                                "px-4 py-2 rounded-2xl",
                                isOwn 
                                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white" 
                                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                              )}>
                                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                              </div>
                              
                              <div className={cn(
                                "flex items-center gap-1 text-xs text-slate-400 px-3",
                                isOwn ? "justify-end" : "justify-start"
                              )}>
                                <span>{formatTime(message.timestamp)}</span>
                                {isOwn && getStatusIcon(message.status)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex gap-2 max-w-[70%]">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-500 text-white text-sm">
                            ?
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-2xl">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* 输入区域 */}
              <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-end gap-3">
                  <Button variant="ghost" size="sm" className="shrink-0">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex-1 relative">
                    <Textarea
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="输入消息..."
                      className="min-h-[44px] max-h-32 resize-none pr-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      rows={1}
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-2 bottom-2"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="shrink-0 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* 未选择会话时的占位内容 */
            <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-800">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">选择一个会话开始聊天</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md">
                  从左侧选择项目群聊、私聊或系统消息，开始与团队成员交流
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}