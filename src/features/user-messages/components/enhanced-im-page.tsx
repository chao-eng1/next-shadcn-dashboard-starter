'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  BellOff,
  Image as ImageIcon,
  File,
  Download,
  Reply,
  Edit,
  Trash2,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIM } from '@/hooks/useIM';
import { conversationAPI, messageAPI, projectAPI } from '@/lib/api/im-api';

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
  messageType: 'text' | 'image' | 'file';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  fileName?: string;
  fileSize?: string;
  replyToId?: string;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  conversationId: string;
  updatedAt: string;
}

interface Conversation {
  id: string;
  name: string;
  type: 'project' | 'private';
  participants: User[];
  lastMessage?: {
    content: string;
    senderName: string;
    timestamp: string;
  };
  unreadCount: number;
  isOnline?: boolean;
  projectId?: string;
  avatar?: string;
  description?: string;
}

interface EnhancedIMPageProps {
  currentUser: User;
}

export function EnhancedIMPage({ currentUser }: EnhancedIMPageProps) {
  const [activeTab, setActiveTab] = useState<'project' | 'private'>('project');
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 使用IM Hook
  const {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    isConnected,
    connectionStatus,
    loadConversations,
    selectConversation,
    loadMessages,
    sendMessage,
    setCurrentUser: setIMCurrentUser
  } = useIM();

  // 初始化
  useEffect(() => {
    setIMCurrentUser(currentUser);
    loadConversations(activeTab);
  }, [currentUser, activeTab, setIMCurrentUser, loadConversations]);

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 发送消息
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentConversation) return;

    try {
      await sendMessage(newMessage, 'text', replyToMessage?.id);
      setNewMessage('');
      setReplyToMessage(null);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('发送消息失败');
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentConversation) return;

    // 这里可以添加文件上传逻辑
    toast.info('文件上传功能开发中...');
  };

  // 格式化时间
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

  // 获取消息状态图标
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

  // 获取会话图标
  const getConversationIcon = (type: Conversation['type']) => {
    switch (type) {
      case 'project':
        return <Hash className="h-4 w-4" />;
      case 'private':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  // 过滤会话
  const filteredConversations = conversations.filter(conv => 
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 渲染消息内容
  const renderMessageContent = (message: Message) => {
    switch (message.messageType) {
      case 'image':
        return (
          <div className="max-w-xs">
            <img
              src={message.content}
              alt="Shared image"
              className="rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.content, '_blank')}
            />
          </div>
        );
      case 'file':
        return (
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border max-w-xs">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
              <File className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{message.fileName}</p>
              <p className="text-xs text-muted-foreground">{message.fileSize}</p>
            </div>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        );
      default:
        return (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        );
    }
  };

  // 连接状态指示器
  const ConnectionStatus = () => {
    if (!isConnected) {
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full">
          <div className="h-2 w-2 bg-red-500 rounded-full" />
          <span className="text-xs text-red-600 dark:text-red-400">连接断开</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full">
        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs text-green-600 dark:text-green-400">已连接</span>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
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
          <div className="flex items-center gap-3">
            <ConnectionStatus />
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
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="project" className="flex items-center gap-1 text-xs">
                  <Hash className="h-3 w-3" />
                  项目群聊
                </TabsTrigger>
                <TabsTrigger value="private" className="flex items-center gap-1 text-xs">
                  <MessageCircle className="h-3 w-3" />
                  私聊
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
              {loading.conversations ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">加载会话中...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
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
                    onClick={() => selectConversation(conversation.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 mb-1",
                      currentConversation?.id === conversation.id && "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
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
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white">
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
                            conversation.type === 'private'
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
          {currentConversation ? (
            <>
              {/* 聊天头部 */}
              <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {currentConversation.type === 'private' ? (
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={currentConversation.participants[0]?.image} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-500 text-white">
                            {currentConversation.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white">
                          {getConversationIcon(currentConversation.type)}
                        </div>
                      )}
                      {currentConversation.isOnline && currentConversation.type === 'private' && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
                      )}
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-900 dark:text-white">{currentConversation.name}</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {currentConversation.type === 'project' 
                          ? `${currentConversation.participants.length} 名成员`
                          : currentConversation.isOnline ? '在线' : '离线'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {currentConversation.type === 'private' && (
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

              {/* 回复消息预览 */}
              {replyToMessage && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Reply className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-blue-600 dark:text-blue-400">回复 {replyToMessage.senderName}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setReplyToMessage(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 truncate">
                    {replyToMessage.content}
                  </p>
                </div>
              )}

              {/* 消息区域 */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {loading.messages ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">加载消息中...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">开始对话</h3>
                      <p className="text-slate-500 dark:text-slate-400">发送第一条消息开始聊天</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwn = message.senderId === currentUser.id;
                      return (
                        <div key={message.id} className={cn("flex group", isOwn ? "justify-end" : "justify-start")}>
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
                                "px-4 py-2 rounded-2xl relative group",
                                isOwn 
                                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white" 
                                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                              )}>
                                {renderMessageContent(message)}
                                
                                {/* 消息操作按钮 */}
                                <div className={cn(
                                  "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1",
                                  isOwn ? "-left-20" : "-right-20"
                                )}>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0 bg-white dark:bg-slate-800 border shadow-sm"
                                    onClick={() => setReplyToMessage(message)}
                                  >
                                    <Reply className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0 bg-white dark:bg-slate-800 border shadow-sm"
                                    onClick={() => navigator.clipboard.writeText(message.content)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
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
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept="image/*,application/pdf,.doc,.docx,.txt"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                  >
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
                      disabled={!isConnected}
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
                    disabled={!newMessage.trim() || !isConnected || loading.sending}
                    className="shrink-0 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {loading.sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
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
                  从左侧选择项目群聊或私聊，开始与团队成员交流
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}