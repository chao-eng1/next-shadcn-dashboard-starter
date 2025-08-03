'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Settings,
  UserPlus,
  Search,
  MoreVertical,
  Pin,
  Archive,
  Bell,
  BellOff,
  ArrowLeft,
  Crown,
  Shield,
  User,
  Calendar,
  FileText,
  Link
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { MessageBubble, Message, MessageUser } from './message-bubble';
import { MessageInput } from './message-input';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ProjectGroupChatProps {
  groupId: string;
}

interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
  isOnline: boolean;
  lastSeen?: Date;
  joinedAt: Date;
}

interface GroupInfo {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  memberCount: number;
  createdAt: Date;
  isPublic: boolean;
  isPinned: boolean;
  isMuted: boolean;
}

export function ProjectGroupChat({ groupId }: ProjectGroupChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<MessageUser[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 模拟数据
  useEffect(() => {
    // 模拟群组信息
    setGroupInfo({
      id: groupId,
      name: '项目开发团队',
      description: '讨论项目开发相关事宜',
      memberCount: 8,
      createdAt: new Date('2024-01-15'),
      isPublic: false,
      isPinned: false,
      isMuted: false
    });

    // 模拟成员列表
    setMembers([
      {
        id: '1',
        name: '张三',
        avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20male%20developer&image_size=square',
        role: 'owner',
        isOnline: true,
        joinedAt: new Date('2024-01-15')
      },
      {
        id: '2',
        name: '李四',
        avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20female%20designer&image_size=square',
        role: 'admin',
        isOnline: true,
        joinedAt: new Date('2024-01-16')
      },
      {
        id: '3',
        name: '王五',
        role: 'member',
        isOnline: false,
        lastSeen: new Date('2024-01-20 10:30'),
        joinedAt: new Date('2024-01-18')
      }
    ]);

    // 模拟消息列表
    setMessages([
      {
        id: '1',
        content: '大家好，欢迎加入项目开发团队！',
        sender: {
          id: '1',
          name: '张三',
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20male%20developer&image_size=square',
          role: '项目经理'
        },
        timestamp: new Date('2024-01-20 09:00'),
        type: 'text',
        status: 'read'
      },
      {
        id: '2',
        content: '项目需求文档已更新，请大家查看',
        sender: {
          id: '2',
          name: '李四',
          avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20female%20designer&image_size=square',
          role: '产品经理'
        },
        timestamp: new Date('2024-01-20 10:15'),
        type: 'text',
        status: 'read',
        isImportant: true,
        attachments: [
          {
            id: 'att1',
            name: '项目需求文档v2.0.pdf',
            size: 2048000,
            type: 'file',
            url: '#'
          }
        ]
      },
      {
        id: '3',
        content: '收到，我会仔细查看的',
        sender: {
          id: '3',
          name: '王五',
          role: '开发工程师'
        },
        timestamp: new Date('2024-01-20 10:30'),
        type: 'text',
        status: 'read',
        replyTo: {
          id: '2',
          content: '项目需求文档已更新，请大家查看',
          sender: {
            id: '2',
            name: '李四',
            role: '产品经理'
          }
        }
      }
    ]);
  }, [groupId]);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送消息
  const handleSendMessage = (content: string, attachments?: File[], replyToMessage?: Message) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: {
        id: 'current-user',
        name: '我',
        role: '开发工程师'
      },
      timestamp: new Date(),
      type: 'text',
      status: 'sending',
      replyTo: replyToMessage
    };

    setMessages(prev => [...prev, newMessage]);
    setReplyTo(null);

    // 模拟发送状态更新
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'sent' as const }
            : msg
        )
      );
    }, 1000);
  };

  // 处理回复
  const handleReply = (message: Message) => {
    setReplyTo(message);
  };

  // 处理删除消息
  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  // 处理复制消息
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // 处理表情反应
  const handleReaction = (messageId: string, emoji: string) => {
    // 实现表情反应逻辑
    console.log('Reaction:', messageId, emoji);
  };

  // 处理打字状态
  const handleTyping = (isTyping: boolean) => {
    // 实现打字状态逻辑
    console.log('Typing:', isTyping);
  };

  // 获取角色图标
  const getRoleIcon = (role: GroupMember['role']) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-3 w-3 text-blue-500" />;
      default:
        return <User className="h-3 w-3 text-gray-500" />;
    }
  };

  // 获取角色名称
  const getRoleName = (role: GroupMember['role']) => {
    switch (role) {
      case 'owner':
        return '群主';
      case 'admin':
        return '管理员';
      default:
        return '成员';
    }
  };

  if (!groupInfo) {
    return <div className="flex items-center justify-center h-full">加载中...</div>;
  }

  return (
    <div className="h-full flex">
      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col">
        {/* 头部 */}
        <div className="border-b bg-background p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <Avatar className="h-10 w-10">
                <AvatarImage src={groupInfo.avatar} />
                <AvatarFallback>
                  <Users className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{groupInfo.name}</h2>
                  {groupInfo.isPinned && <Pin className="h-4 w-4 text-primary" />}
                  {groupInfo.isMuted && <BellOff className="h-4 w-4 text-muted-foreground" />}
                </div>
                <p className="text-sm text-muted-foreground">
                  {groupInfo.memberCount} 名成员
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMembers(!showMembers)}
              >
                <Users className="h-4 w-4 mr-2" />
                成员
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Search className="h-4 w-4 mr-2" />
                    搜索消息
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Pin className="h-4 w-4 mr-2" />
                    {groupInfo.isPinned ? '取消置顶' : '置顶群聊'}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    {groupInfo.isMuted ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
                    {groupInfo.isMuted ? '开启通知' : '关闭通知'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <UserPlus className="h-4 w-4 mr-2" />
                    邀请成员
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    群组设置
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Archive className="h-4 w-4 mr-2" />
                    退出群组
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* 消息列表 */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isOwn = message.sender.id === 'current-user';
              const showAvatar = !isOwn && (index === 0 || messages[index - 1].sender.id !== message.sender.id);
              
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  onReply={handleReply}
                  onDelete={handleDeleteMessage}
                  onCopy={handleCopyMessage}
                  onReaction={handleReaction}
                />
              );
            })}
            
            {/* 打字指示器 */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span>
                  {typingUsers.map(user => user.name).join(', ')} 正在输入...
                </span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* 输入区域 */}
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          placeholder="输入消息..."
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>

      {/* 成员列表侧边栏 */}
      {showMembers && (
        <div className="w-80 border-l bg-muted/30">
          <Card className="h-full rounded-none border-0">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>群组成员</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMembers(false)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="p-4 space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>
                            {member.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        {member.isOnline && (
                          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{member.name}</p>
                          {getRoleIcon(member.role)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{getRoleName(member.role)}</span>
                          {!member.isOnline && member.lastSeen && (
                            <span>• {format(member.lastSeen, 'MM-dd HH:mm', { locale: zhCN })}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t">
                <Button className="w-full" variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  邀请成员
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}