'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  Pin,
  Archive,
  Bell,
  BellOff,
  UserCheck,
  UserX,
  Shield,
  MessageSquare,
  Users,
  Briefcase,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageBubble, Message, MessageUser } from './message-bubble';
import { MessageInput } from './message-input';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

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

interface ChatContentProps {
  conversation: Conversation | null;
}

export function ChatContent({ conversation }: ChatContentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 模拟消息数据
  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      return;
    }

    // 根据会话类型生成不同的模拟消息
    const mockMessages: Message[] = [];
    
    if (conversation.type === 'private') {
      mockMessages.push(
        {
          id: '1',
          content: '你好！关于新项目的技术方案，我想和你讨论一下',
          sender: {
            id: conversation.id,
            name: conversation.name,
            avatar: conversation.avatar
          },
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          type: 'text',
          status: 'read'
        },
        {
          id: '2',
          content: '好的，我正在整理相关资料，稍后发给你',
          sender: {
            id: 'current-user',
            name: '我'
          },
          timestamp: new Date(Date.now() - 25 * 60 * 1000),
          type: 'text',
          status: 'read'
        },
        {
          id: '3',
          content: '有什么具体的技术要求吗？',
          sender: {
            id: conversation.id,
            name: conversation.name,
            avatar: conversation.avatar
          },
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          type: 'text',
          status: 'delivered'
        }
      );
    } else if (conversation.type === 'group') {
      mockMessages.push(
        {
          id: '1',
          content: '大家对新的UI设计有什么看法？',
          sender: {
            id: 'user1',
            name: '李四',
            avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20designer&image_size=square'
          },
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          type: 'text',
          status: 'read'
        },
        {
          id: '2',
          content: '我觉得颜色搭配很不错，但是布局可以再优化一下',
          sender: {
            id: 'user2',
            name: '王五',
            avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20developer&image_size=square'
          },
          timestamp: new Date(Date.now() - 25 * 60 * 1000),
          type: 'text',
          status: 'read'
        },
        {
          id: '3',
          content: '同意，我们可以在下次会议中详细讨论',
          sender: {
            id: 'current-user',
            name: '我'
          },
          timestamp: new Date(Date.now() - 20 * 60 * 1000),
          type: 'text',
          status: 'read'
        }
      );
    } else if (conversation.type === 'system') {
      mockMessages.push(
        {
          id: '1',
          content: '您的密码将在7天后过期，请及时更新密码以确保账户安全。',
          sender: {
            id: 'system',
            name: '系统通知'
          },
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          type: 'text',
          status: 'read'
        },
        {
          id: '2',
          content: '系统将于今晚23:00-01:00进行维护，期间可能影响部分功能使用。',
          sender: {
            id: 'system',
            name: '系统通知'
          },
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          type: 'text',
          status: 'read'
        }
      );
    } else if (conversation.type === 'project') {
      mockMessages.push(
        {
          id: '1',
          content: '任务"API接口开发"已完成，请相关人员进行代码审查。',
          sender: {
            id: 'project-system',
            name: '项目通知'
          },
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          type: 'text',
          status: 'read'
        },
        {
          id: '2',
          content: '项目里程碑"第一阶段开发"即将到期，请注意进度安排。',
          sender: {
            id: 'project-system',
            name: '项目通知'
          },
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          type: 'text',
          status: 'read'
        }
      );
    }

    setMessages(mockMessages);
  }, [conversation]);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送消息
  const handleSendMessage = (content: string, attachments?: File[], replyToMessage?: Message) => {
    if (!conversation) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: {
        id: 'current-user',
        name: '我'
      },
      timestamp: new Date(),
      type: 'text',
      status: 'sending',
      replyTo: replyToMessage,
      attachments: attachments?.map(file => ({
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        url: URL.createObjectURL(file)
      }))
    };

    setMessages(prev => [...prev, newMessage]);
    setReplyTo(null);

    // 模拟发送状态更新
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'delivered' as const }
            : msg
        )
      );
    }, 1000);

    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'read' as const }
            : msg
        )
      );
    }, 2000);
  };

  // 处理消息操作
  const handleMessageAction = (action: string, message: Message) => {
    switch (action) {
      case 'reply':
        setReplyTo(message);
        break;
      case 'delete':
        setMessages(prev => prev.filter(msg => msg.id !== message.id));
        break;
      case 'copy':
        navigator.clipboard.writeText(message.content);
        break;
    }
  };

  // 获取会话类型图标
  const getConversationIcon = () => {
    if (!conversation) return null;
    
    switch (conversation.type) {
      case 'private':
        return <MessageSquare className="h-5 w-5" />;
      case 'group':
        return <Users className="h-5 w-5" />;
      case 'system':
        return <Bell className="h-5 w-5" />;
      case 'project':
        return <Briefcase className="h-5 w-5" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
    }
  };

  // 如果没有选中会话，显示欢迎界面
  if (!conversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20">
        <div className="text-center space-y-4">
          <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <MessageSquare className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              选择一个会话开始聊天
            </h2>
            <p className="text-muted-foreground mt-2">
              从左侧选择一个会话，开始您的沟通之旅
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 聊天头部 */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          {conversation.avatar ? (
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversation.avatar} alt={conversation.name} />
              <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              {getConversationIcon()}
            </div>
          )}
          <div>
            <h3 className="font-semibold">{conversation.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {conversation.isOnline && (
                <>
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  <span>在线</span>
                </>
              )}
              {conversation.type === 'private' && !conversation.isOnline && (
                <>
                  <Clock className="h-3 w-3" />
                  <span>最后在线：2小时前</span>
                </>
              )}
              {conversation.type === 'group' && (
                <span>群组聊天</span>
              )}
              {conversation.type === 'system' && (
                <span>系统消息</span>
              )}
              {conversation.type === 'project' && (
                <span>项目通知</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {conversation.type === 'private' && (
            <>
              <Button variant="ghost" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm">
            <Search className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Pin className="h-4 w-4 mr-2" />
                {conversation.isPinned ? '取消置顶' : '置顶会话'}
              </DropdownMenuItem>
              <DropdownMenuItem>
                {conversation.isMuted ? (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    取消静音
                  </>
                ) : (
                  <>
                    <BellOff className="h-4 w-4 mr-2" />
                    静音通知
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Archive className="h-4 w-4 mr-2" />
                归档会话
              </DropdownMenuItem>
              {conversation.type === 'private' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <UserX className="h-4 w-4 mr-2" />
                    屏蔽用户
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 消息列表 */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onAction={handleMessageAction}
            />
          ))}
          {isTyping && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex gap-1">
                <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
                <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <span>{conversation.name} 正在输入...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* 消息输入框 */}
      {(conversation.type === 'private' || conversation.type === 'group') && (
        <div className="border-t bg-card">
          <MessageInput
            onSendMessage={handleSendMessage}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            placeholder={`发送消息给 ${conversation.name}...`}
          />
        </div>
      )}
    </div>
  );
}