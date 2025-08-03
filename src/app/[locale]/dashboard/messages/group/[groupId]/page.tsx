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
  Copy,
  Users,
  UserPlus,
  Settings,
  Pin,
  Archive,
  Mute,
  Search,
  AtSign
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

// 消息类型
interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system' | 'announcement';
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
  mentions?: string[];
  isPinned?: boolean;
  readBy?: {
    userId: string;
    userName: string;
    readAt: Date;
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
  role?: 'admin' | 'member';
}

// 群组类型
interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  type: 'project' | 'department' | 'custom';
  memberCount: number;
  members: User[];
  admins: string[];
  createdAt: Date;
  settings: {
    allowMemberInvite: boolean;
    allowFileSharing: boolean;
    muteNotifications: boolean;
  };
}

// 模拟当前用户
const currentUser: User = {
  id: 'current-user',
  name: '我',
  email: 'current@example.com',
  status: 'online',
  role: 'member'
};

// 模拟群组成员
const mockMembers: User[] = [
  {
    id: 'user1',
    name: '张三',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20of%20asian%20man%20in%20suit&image_size=square',
    email: 'zhangsan@example.com',
    status: 'online',
    title: '产品经理',
    department: '产品部',
    role: 'admin'
  },
  {
    id: 'user2',
    name: '李四',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20of%20asian%20woman%20in%20business%20attire&image_size=square',
    email: 'lisi@example.com',
    status: 'away',
    lastSeen: new Date(Date.now() - 30 * 60 * 1000),
    title: '设计师',
    department: '设计部',
    role: 'member'
  },
  {
    id: 'user3',
    name: '王五',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20of%20young%20asian%20developer&image_size=square',
    email: 'wangwu@example.com',
    status: 'offline',
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
    title: '开发工程师',
    department: '技术部',
    role: 'member'
  },
  {
    id: 'user4',
    name: '赵六',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20of%20asian%20woman%20developer&image_size=square',
    email: 'zhaoliu@example.com',
    status: 'busy',
    title: '测试工程师',
    department: '技术部',
    role: 'member'
  },
  currentUser
];

// 模拟群组数据
const mockGroups: { [key: string]: Group } = {
  'group1': {
    id: 'group1',
    name: '项目Alpha开发组',
    description: '项目Alpha的核心开发团队群组',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20project%20team%20collaboration%20icon%20blue%20gradient&image_size=square',
    type: 'project',
    memberCount: 5,
    members: mockMembers,
    admins: ['user1'],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    settings: {
      allowMemberInvite: true,
      allowFileSharing: true,
      muteNotifications: false
    }
  },
  'group2': {
    id: 'group2',
    name: '产品设计团队',
    description: '产品设计相关讨论',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=creative%20design%20team%20icon%20purple%20gradient&image_size=square',
    type: 'department',
    memberCount: 3,
    members: mockMembers.slice(0, 3),
    admins: ['user1', 'user2'],
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    settings: {
      allowMemberInvite: false,
      allowFileSharing: true,
      muteNotifications: false
    }
  }
};

// 模拟群组消息
const mockGroupMessages: { [key: string]: Message[] } = {
  'group1': [
    {
      id: '1',
      content: '大家好，项目Alpha正式启动了！欢迎各位加入开发团队。',
      type: 'announcement',
      senderId: 'user1',
      senderName: '张三',
      senderAvatar: mockMembers[0].avatar,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'read',
      isPinned: true,
      readBy: [
        { userId: 'user2', userName: '李四', readAt: new Date(Date.now() - 23 * 60 * 60 * 1000) },
        { userId: 'user3', userName: '王五', readAt: new Date(Date.now() - 22 * 60 * 60 * 1000) },
        { userId: 'current-user', userName: '我', readAt: new Date(Date.now() - 21 * 60 * 60 * 1000) }
      ]
    },
    {
      id: '2',
      content: '太好了！我已经准备好设计稿了，稍后分享给大家。',
      type: 'text',
      senderId: 'user2',
      senderName: '李四',
      senderAvatar: mockMembers[1].avatar,
      timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000),
      status: 'read'
    },
    {
      id: '3',
      content: '@王五 @赵六 技术架构文档已经准备好了，请查收。',
      type: 'text',
      senderId: 'user1',
      senderName: '张三',
      senderAvatar: mockMembers[0].avatar,
      timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000),
      status: 'read',
      mentions: ['user3', 'user4']
    },
    {
      id: '4',
      content: '技术架构文档v1.0.pdf',
      type: 'file',
      senderId: 'user1',
      senderName: '张三',
      senderAvatar: mockMembers[0].avatar,
      timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000),
      status: 'read',
      attachments: [{
        id: 'file1',
        name: '技术架构文档v1.0.pdf',
        size: 3145728,
        type: 'application/pdf',
        url: '#'
      }]
    },
    {
      id: '5',
      content: '收到！我会仔细研读的。',
      type: 'text',
      senderId: 'user3',
      senderName: '王五',
      senderAvatar: mockMembers[2].avatar,
      timestamp: new Date(Date.now() - 21 * 60 * 60 * 1000),
      status: 'read',
      replyTo: {
        id: '3',
        content: '@王五 @赵六 技术架构文档已经准备好了，请查收。',
        senderName: '张三'
      }
    },
    {
      id: '6',
      content: '我也在看，整体架构很清晰。有几个细节想讨论一下。',
      type: 'text',
      senderId: 'user4',
      senderName: '赵六',
      senderAvatar: mockMembers[3].avatar,
      timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000),
      status: 'read'
    },
    {
      id: '7',
      content: '好的，我们可以安排一个技术评审会议。',
      type: 'text',
      senderId: 'current-user',
      senderName: '我',
      timestamp: new Date(Date.now() - 19 * 60 * 60 * 1000),
      status: 'delivered'
    },
    {
      id: '8',
      content: '界面设计稿v2.0.png',
      type: 'image',
      senderId: 'user2',
      senderName: '李四',
      senderAvatar: mockMembers[1].avatar,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'read',
      attachments: [{
        id: 'img1',
        name: '界面设计稿v2.0.png',
        size: 2048000,
        type: 'image/png',
        url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20mobile%20app%20ui%20design%20mockup%20clean%20interface%20dashboard&image_size=landscape_4_3'
      }]
    },
    {
      id: '9',
      content: '设计稿看起来很棒！用户体验很流畅。',
      type: 'text',
      senderId: 'user1',
      senderName: '张三',
      senderAvatar: mockMembers[0].avatar,
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      status: 'sent'
    }
  ],
  'group2': [
    {
      id: '10',
      content: '设计团队周会开始了，请大家准时参加。',
      type: 'system',
      senderId: 'system',
      senderName: '系统',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
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

// 用户状态指示器
const UserStatusIndicator = ({ status }: { status: User['status'] }) => {
  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className={cn('w-2 h-2 rounded-full absolute -bottom-0.5 -right-0.5 border border-background', getStatusColor(status))} />
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

// 处理@提及
const renderMessageContent = (content: string, mentions?: string[]) => {
  if (!mentions || mentions.length === 0) {
    return content;
  }

  let processedContent = content;
  mentions.forEach(userId => {
    const user = mockMembers.find(m => m.id === userId);
    if (user) {
      processedContent = processedContent.replace(
        `@${user.name}`,
        `<span class="bg-blue-100 text-blue-800 px-1 rounded font-medium">@${user.name}</span>`
      );
    }
  });

  return <span dangerouslySetInnerHTML={{ __html: processedContent }} />;
};

export default function GroupChatPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const [messages, setMessages] = useState<Message[]>(mockGroupMessages[groupId] || []);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showMemberList, setShowMemberList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const group = mockGroups[groupId];

  useEffect(() => {
    if (!group) {
      router.push('/dashboard/messages');
      return;
    }
    
    // 滚动到底部
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, group, router]);

  useEffect(() => {
    // 模拟其他用户正在输入
    if (groupId === 'group1') {
      const timer = setTimeout(() => {
        setTypingUsers(['user2']);
        setTimeout(() => setTypingUsers([]), 3000);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [groupId]);

  // 发送消息
  const sendMessage = () => {
    if (!newMessage.trim()) return;

    // 检测@提及
    const mentionRegex = /@([^\s]+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(newMessage)) !== null) {
      const mentionedUser = group.members.find(m => m.name === match[1]);
      if (mentionedUser) {
        mentions.push(mentionedUser.id);
      }
    }

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      type: 'text',
      senderId: currentUser.id,
      senderName: currentUser.name,
      timestamp: new Date(),
      status: 'sending',
      mentions: mentions.length > 0 ? mentions : undefined,
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

  // 置顶消息
  const pinMessage = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
    ));
    toast.success('消息已置顶');
  };

  if (!group) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">群组不存在</h2>
          <p className="text-muted-foreground mb-4">找不到指定的群组</p>
          <Button onClick={() => router.push('/dashboard/messages')}>返回消息列表</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 群聊头部 */}
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
            <AvatarImage src={group.avatar} alt={group.name} />
            <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">{group.name}</h2>
              <Badge variant={group.type === 'project' ? 'default' : 'secondary'}>
                {group.type === 'project' ? '项目' : group.type === 'department' ? '部门' : '自定义'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{group.memberCount} 名成员</span>
              {typingUsers.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-blue-600">
                    {typingUsers.map(userId => {
                      const user = group.members.find(m => m.id === userId);
                      return user?.name;
                    }).join(', ')} 正在输入...
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>搜索消息</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
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
              <TooltipContent>视频会议</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Sheet open={showMemberList} onOpenChange={setShowMemberList}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Users className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>群组成员</SheetTitle>
                <SheetDescription>
                  {group.name} • {group.memberCount} 名成员
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-full mt-6">
                <div className="space-y-4">
                  {group.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <UserStatusIndicator status={member.status} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{member.name}</p>
                          {group.admins.includes(member.id) && (
                            <Badge variant="outline" className="text-xs">管理员</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {member.title} • {member.department}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <AtSign className="h-4 w-4 mr-2" />
                            提及
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Info className="h-4 w-4 mr-2" />
                            查看资料
                          </DropdownMenuItem>
                          {group.admins.includes(currentUser.id) && member.id !== currentUser.id && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                移除成员
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <UserPlus className="h-4 w-4 mr-2" />
                邀请成员
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                群组设置
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Mute className="h-4 w-4 mr-2" />
                静音通知
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Archive className="h-4 w-4 mr-2" />
                归档群组
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                退出群组
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.senderId === currentUser.id;
          const isSystem = message.type === 'system';
          const isAnnouncement = message.type === 'announcement';
          
          if (isSystem) {
            return (
              <div key={message.id} className="flex justify-center">
                <div className="bg-muted px-3 py-1 rounded-full text-sm text-muted-foreground">
                  {message.content}
                </div>
              </div>
            );
          }
          
          return (
            <div key={message.id} className={cn('flex gap-3', isOwn && 'flex-row-reverse')}>
              {!isOwn && (
                <div className="relative">
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage src={message.senderAvatar} alt={message.senderName} />
                    <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <UserStatusIndicator status={group.members.find(m => m.id === message.senderId)?.status || 'offline'} />
                </div>
              )}
              
              <div className={cn('flex flex-col max-w-[70%]', isOwn && 'items-end')}>
                {/* 发送者信息 */}
                {!isOwn && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{message.senderName}</span>
                    {group.admins.includes(message.senderId) && (
                      <Badge variant="outline" className="text-xs h-4">管理员</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                )}
                
                {/* 置顶标识 */}
                {message.isPinned && (
                  <div className="flex items-center gap-1 mb-1">
                    <Pin className="h-3 w-3 text-yellow-600" />
                    <span className="text-xs text-yellow-600">置顶消息</span>
                  </div>
                )}
                
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
                      : isAnnouncement
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      : 'bg-muted'
                  )}>
                    {/* 文本消息 */}
                    {message.type === 'text' && (
                      <p className="whitespace-pre-wrap">
                        {renderMessageContent(message.content, message.mentions)}
                      </p>
                    )}
                    
                    {/* 公告消息 */}
                    {message.type === 'announcement' && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-medium">群组公告</span>
                        </div>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
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
                        {(isOwn || group.admins.includes(currentUser.id)) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => pinMessage(message.id)}>
                              <Pin className="h-4 w-4 mr-2" />
                              {message.isPinned ? '取消置顶' : '置顶'}
                            </DropdownMenuItem>
                          </>
                        )}
                        {(isOwn || group.admins.includes(currentUser.id)) && (
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
                {isOwn && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <span>{formatTime(message.timestamp)}</span>
                    <StatusIcon status={message.status} />
                    {message.readBy && message.readBy.length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-blue-500">
                              {message.readBy.length}人已读
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              {message.readBy.map((read) => (
                                <div key={read.userId} className="text-sm">
                                  {read.userName} • {formatTime(read.readAt)}
                                </div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
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
              placeholder={`在 ${group.name} 中发消息...`}
              className="resize-none"
            />
          </div>
          
          <Button variant="ghost" size="sm">
            <AtSign className="h-4 w-4" />
          </Button>
          
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