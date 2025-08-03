'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Phone, 
  Video, 
  Info,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  File,
  Download,
  Reply,
  Forward,
  Trash2,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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

// 消息类型
interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  attachments?: {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
  }[];
}

// 用户类型
interface User {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: Date;
  title?: string;
  department?: string;
}

// 模拟当前用户
const currentUser: User = {
  id: 'current-user',
  name: '我',
  email: 'current@example.com',
  status: 'online'
};

// 模拟用户数据
const mockUsers: { [key: string]: User } = {
  'user1': {
    id: 'user1',
    name: '张三',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20of%20asian%20man%20in%20suit&image_size=square',
    email: 'zhangsan@example.com',
    status: 'online',
    title: '产品经理',
    department: '产品部'
  },
  'user2': {
    id: 'user2',
    name: '李四',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20of%20asian%20woman%20in%20business%20attire&image_size=square',
    email: 'lisi@example.com',
    status: 'away',
    lastSeen: new Date(Date.now() - 30 * 60 * 1000),
    title: '设计师',
    department: '设计部'
  },
  'user3': {
    id: 'user3',
    name: '王五',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20of%20young%20asian%20developer&image_size=square',
    email: 'wangwu@example.com',
    status: 'offline',
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
    title: '开发工程师',
    department: '技术部'
  }
};

// 模拟消息数据
const mockMessages: { [key: string]: Message[] } = {
  'user1': [
    {
      id: '1',
      content: '你好，关于新项目的需求文档，我已经整理好了初稿。',
      type: 'text',
      senderId: 'user1',
      senderName: '张三',
      senderAvatar: mockUsers.user1.avatar,
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      status: 'read'
    },
    {
      id: '2',
      content: '好的，我看一下。有什么特别需要注意的地方吗？',
      type: 'text',
      senderId: 'current-user',
      senderName: '我',
      timestamp: new Date(Date.now() - 55 * 60 * 1000),
      status: 'read'
    },
    {
      id: '3',
      content: '主要是用户体验这块，我们需要重点关注移动端的适配。',
      type: 'text',
      senderId: 'user1',
      senderName: '张三',
      senderAvatar: mockUsers.user1.avatar,
      timestamp: new Date(Date.now() - 50 * 60 * 1000),
      status: 'read',
      replyTo: {
        id: '2',
        content: '好的，我看一下。有什么特别需要注意的地方吗？',
        senderName: '我'
      }
    },
    {
      id: '4',
      content: '需求文档.pdf',
      type: 'file',
      senderId: 'user1',
      senderName: '张三',
      senderAvatar: mockUsers.user1.avatar,
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      status: 'read',
      attachments: [{
        id: 'file1',
        name: '需求文档.pdf',
        size: 2048576,
        type: 'application/pdf',
        url: '#'
      }]
    },
    {
      id: '5',
      content: '收到，我会仔细研读的。预计什么时候开始开发？',
      type: 'text',
      senderId: 'current-user',
      senderName: '我',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      status: 'delivered'
    },
    {
      id: '6',
      content: '计划下周一开始，给你们一周时间准备。',
      type: 'text',
      senderId: 'user1',
      senderName: '张三',
      senderAvatar: mockUsers.user1.avatar,
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      status: 'sent'
    }
  ],
  'user2': [
    {
      id: '7',
      content: '设计稿已经完成，请查收。',
      type: 'text',
      senderId: 'user2',
      senderName: '李四',
      senderAvatar: mockUsers.user2.avatar,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'read'
    },
    {
      id: '8',
      content: '界面设计.png',
      type: 'image',
      senderId: 'user2',
      senderName: '李四',
      senderAvatar: mockUsers.user2.avatar,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'read',
      attachments: [{
        id: 'img1',
        name: '界面设计.png',
        size: 1024000,
        type: 'image/png',
        url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20mobile%20app%20ui%20design%20mockup%20clean%20interface&image_size=portrait_4_3'
      }]
    }
  ],
  'user3': [
    {
      id: '9',
      content: '代码审查已完成，有几个小问题需要修改。',
      type: 'text',
      senderId: 'user3',
      senderName: '王五',
      senderAvatar: mockUsers.user3.avatar,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'read'
    }
  ]
};

// 状态图标组件
const StatusIcon = ({ status }: { status: Message['status'] }) => {
  switch (status) {
    case 'sending':
      return <Clock className="h-3 w-3 text-muted-foreground" />;
    case 'sent':
      return <Check className="h-3 w-3 text-muted-foreground" />;
    case 'delivered':
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
    case 'read':
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    case 'failed':
      return <AlertCircle className="h-3 w-3 text-red-500" />;
    default:
      return null;
  }
};

// 用户状态组件
const UserStatus = ({ user }: { user: User }) => {
  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (user: User) => {
    switch (user.status) {
      case 'online': return '在线';
      case 'away': return '离开';
      case 'busy': return '忙碌';
      case 'offline': 
        return user.lastSeen 
          ? `最后在线：${formatTime(user.lastSeen)}`
          : '离线';
      default: return '未知';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn('w-2 h-2 rounded-full', getStatusColor(user.status))} />
      <span className="text-sm text-muted-foreground">{getStatusText(user)}</span>
    </div>
  );
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
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 文件大小格式化
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function PrivateChatPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [messages, setMessages] = useState<Message[]>(mockMessages[userId] || []);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const user = mockUsers[userId];

  useEffect(() => {
    if (!user) {
      router.push('/dashboard/messages');
      return;
    }
    
    // 滚动到底部
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, user, router]);

  useEffect(() => {
    // 模拟对方正在输入
    if (userId === 'user1') {
      const timer = setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [userId]);

  // 发送消息
  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      type: 'text',
      senderId: currentUser.id,
      senderName: currentUser.name,
      timestamp: new Date(),
      status: 'sending',
      replyTo: replyTo ? {
        id: replyTo.id,
        content: replyTo.content,
        senderName: replyTo.senderName
      } : undefined
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setReplyTo(null);

    // 模拟发送状态变化
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'sent' } : msg
      ));
    }, 1000);

    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'delivered' } : msg
      ));
    }, 2000);
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 复制消息
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('消息已复制');
  };

  // 回复消息
  const replyMessage = (message: Message) => {
    setReplyTo(message);
    inputRef.current?.focus();
  };

  // 删除消息
  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    toast.success('消息已删除');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">用户不存在</h2>
          <p className="text-muted-foreground mb-4">找不到指定的用户</p>
          <Button onClick={() => router.push('/dashboard/messages')}>返回消息列表</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 聊天头部 */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/dashboard/messages')}
            className="lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div>
            <h2 className="font-semibold">{user.name}</h2>
            <UserStatus user={user} />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>语音通话</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>视频通话</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Info className="h-4 w-4 mr-2" />
                查看资料
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                删除对话
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.senderId === currentUser.id;
          
          return (
            <div key={message.id} className={cn('flex gap-3', isOwn && 'flex-row-reverse')}>
              {!isOwn && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarImage src={message.senderAvatar} alt={message.senderName} />
                  <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              
              <div className={cn('flex flex-col max-w-[70%]', isOwn && 'items-end')}>
                {/* 回复引用 */}
                {message.replyTo && (
                  <div className={cn(
                    'mb-1 p-2 rounded border-l-2 bg-muted/50 text-sm',
                    isOwn ? 'border-l-blue-500' : 'border-l-gray-400'
                  )}>
                    <div className="font-medium text-xs text-muted-foreground">
                      回复 {message.replyTo.senderName}
                    </div>
                    <div className="truncate">{message.replyTo.content}</div>
                  </div>
                )}
                
                {/* 消息内容 */}
                <div className="group relative">
                  <div className={cn(
                    'rounded-lg px-3 py-2 break-words',
                    isOwn 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-muted',
                    message.type === 'system' && 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  )}>
                    {/* 文本消息 */}
                    {message.type === 'text' && (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                    
                    {/* 图片消息 */}
                    {message.type === 'image' && message.attachments && (
                      <div className="space-y-2">
                        {message.attachments.map((attachment) => (
                          <div key={attachment.id} className="relative">
                            <img 
                              src={attachment.url} 
                              alt={attachment.name}
                              className="max-w-full h-auto rounded cursor-pointer hover:opacity-90"
                              onClick={() => window.open(attachment.url, '_blank')}
                            />
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" variant="secondary" className="h-6 w-6 p-0">
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* 文件消息 */}
                    {message.type === 'file' && message.attachments && (
                      <div className="space-y-2">
                        {message.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center gap-3 p-2 bg-background/10 rounded border">
                            <File className="h-8 w-8 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{attachment.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(attachment.size)}
                              </p>
                            </div>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* 消息操作菜单 */}
                  <div className={cn(
                    'absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity',
                    isOwn ? '-left-8' : '-right-8'
                  )}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isOwn ? 'end' : 'start'}>
                        <DropdownMenuItem onClick={() => replyMessage(message)}>
                          <Reply className="h-4 w-4 mr-2" />
                          回复
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyMessage(message.content)}>
                          <Copy className="h-4 w-4 mr-2" />
                          复制
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Forward className="h-4 w-4 mr-2" />
                          转发
                        </DropdownMenuItem>
                        {isOwn && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => deleteMessage(message.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {/* 消息状态和时间 */}
                <div className={cn(
                  'flex items-center gap-1 mt-1 text-xs text-muted-foreground',
                  isOwn && 'flex-row-reverse'
                )}>
                  <span>{formatTime(message.timestamp)}</span>
                  {isOwn && <StatusIcon status={message.status} />}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* 正在输入指示器 */}
        {isTyping && (
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-lg px-3 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 回复预览 */}
      {replyTo && (
        <div className="px-4 py-2 bg-muted/50 border-t">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">回复 {replyTo.senderName}</div>
              <div className="text-sm text-muted-foreground truncate">{replyTo.content}</div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setReplyTo(null)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="sm">
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm">
            <ImageIcon className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`给 ${user.name} 发消息...`}
              className="resize-none"
            />
          </div>
          
          <Button variant="ghost" size="sm">
            <Smile className="h-4 w-4" />
          </Button>
          
          <Button 
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}