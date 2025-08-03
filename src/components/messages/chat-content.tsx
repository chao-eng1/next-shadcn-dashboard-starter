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
  DropdownMenuTrigger
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
import { zhCN } from 'date-fns/locale/zh-CN';
import { useAuth } from '@/hooks/use-auth';
import { getWebSocketService } from '@/lib/websocket-service';
import { toast } from 'sonner';

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
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const wsService = getWebSocketService();

  // 加载会话消息
  const loadMessages = async (conversationId: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`
      );
      if (response.ok) {
        const data = await response.json();
        const formattedMessages: Message[] = data.data.messages.map(
          (msg: any) => ({
            id: msg.id,
            content: msg.content,
            sender: {
              id: msg.senderId || '',
              name: msg.senderName || '未知用户',
              avatar: msg.senderImage
            },
            timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
            type: msg.messageType,
            status: (['sending', 'sent', 'delivered', 'read'].includes(
              msg.status
            )
              ? msg.status
              : 'delivered') as 'sending' | 'sent' | 'delivered' | 'read',
            replyTo: msg.replyTo
              ? {
                  id: msg.replyTo.id,
                  content: msg.replyTo.content,
                  sender: {
                    id: msg.replyTo.senderId || '',
                    name: msg.replyTo.senderName || '未知用户'
                  },
                  timestamp: msg.replyTo.createdAt
                    ? new Date(msg.replyTo.createdAt)
                    : new Date(),
                  type: 'text',
                  status: 'delivered'
                }
              : undefined
          })
        );
        setMessages(formattedMessages);
      } else {
        console.error('Failed to load messages:', response.statusText);
        toast.error('加载消息失败');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('加载消息失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      return;
    }

    console.log('🔵 [Chat Content] Conversation changed:', conversation.id);
    console.log('🔵 [Chat Content] User ID:', user?.id);

    // 加载消息
    loadMessages(conversation.id);

    // 加入WebSocket房间
    if (wsService && user) {
      console.log('🔵 [Chat Content] Connecting to WebSocket...');
      wsService
        .connect(user.id)
        .then(() => {
          console.log(
            '🔵 [Chat Content] WebSocket connected, joining room:',
            conversation.type,
            conversation.id
          );
          wsService.joinConversation(conversation.id, conversation.type);
        })
        .catch((error) => {
          console.error(
            '🔵 [Chat Content] WebSocket connection failed:',
            error
          );
        });
    }

    // 简化的消息监听 - 只监听自定义事件
    const handleNewMessage = (event: CustomEvent) => {
      debugger; // 🔴 调试断点：前端组件接收到newMessage事件
      console.log('🔵 [Chat Content] Received newMessage event:', event.detail);
      if (event.detail.conversationId === conversation.id) {
        console.log(
          '🔵 [Chat Content] Message is for current conversation:',
          conversation.id
        );
        const newMessages = event.detail.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          sender: {
            id: msg.sender?.id || msg.senderId || '',
            name: msg.sender?.name || msg.senderName || '未知用户',
            avatar: msg.sender?.avatar || msg.senderImage
          },
          timestamp:
            msg.timestamp instanceof Date
              ? msg.timestamp
              : msg.timestamp || msg.createdAt
                ? new Date(msg.timestamp || msg.createdAt)
                : new Date(),
          type: msg.type || msg.messageType || 'text',
          status: msg.status || ('delivered' as const),
          replyTo: msg.replyTo
        }));

        console.log(
          '🔵 [Chat Content] Adding new messages to state:',
          newMessages
        );
        setMessages((prev) => {
          const updated = [...prev, ...newMessages];
          console.log(
            '🔵 [Chat Content] Updated messages count:',
            updated.length
          );
          return updated;
        });
      } else {
        console.log(
          '🔵 [Chat Content] Message not for current conversation:',
          event.detail.conversationId,
          'current:',
          conversation.id
        );
      }
    };

    window.addEventListener('newMessage', handleNewMessage as EventListener);

    return () => {
      // 离开WebSocket房间
      if (wsService && user) {
        console.log(
          '🔵 [Chat Content] Leaving WebSocket room:',
          conversation.type,
          conversation.id
        );
        wsService.leaveConversation(conversation.id, conversation.type);
      }

      window.removeEventListener(
        'newMessage',
        handleNewMessage as EventListener
      );
    };
  }, [conversation, user]);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送消息
  const handleSendMessage = async (
    content: string,
    attachments?: File[],
    replyToMessage?: Message
  ) => {
    if (!conversation || !user) return;

    // 创建临时消息显示在界面上
    const tempMessage: Message = {
      id: `temp_${Date.now()}`,
      content,
      sender: {
        id: user.id || '',
        name: user.name || '未知用户',
        avatar: user.image || undefined
      },
      timestamp: new Date(),
      type: 'text',
      status: 'sending',
      replyTo: replyToMessage
    };

    setMessages((prev) => [...prev, tempMessage]);
    setReplyTo(null);

    try {
      const response = await fetch(
        `/api/conversations/${conversation.id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content,
            messageType: 'text',
            replyToId: replyToMessage?.id
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Message sent successfully:', data);

        // 用服务器返回的消息替换临时消息
        const serverMessage: Message = {
          id: data.data.id,
          content: data.data.content,
          sender: {
            id: data.data.senderId,
            name: data.data.senderName,
            avatar: data.data.senderImage
          },
          timestamp: new Date(data.data.createdAt),
          type: data.data.messageType,
          status: 'sent',
          replyTo: replyToMessage
        };

        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempMessage.id ? serverMessage : msg))
        );

        console.log('Message state updated successfully');
        toast.success('消息发送成功');
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('发送消息失败');

      // 移除发送失败的临时消息
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
    }
  };

  // 获取会话类型图标
  const getConversationIcon = () => {
    if (!conversation) return null;

    switch (conversation.type) {
      case 'private':
        return <MessageSquare className='h-5 w-5' />;
      case 'group':
        return <Users className='h-5 w-5' />;
      case 'system':
        return <Bell className='h-5 w-5' />;
      case 'project':
        return <Briefcase className='h-5 w-5' />;
      default:
        return <MessageSquare className='h-5 w-5' />;
    }
  };

  // 如果没有选中会话，显示欢迎界面
  if (!conversation) {
    return (
      <div className='dark:via-background flex h-full flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20'>
        <div className='space-y-4 text-center'>
          <div className='mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600'>
            <MessageSquare className='h-10 w-10 text-white' />
          </div>
          <div>
            <h2 className='bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent'>
              选择一个会话开始聊天
            </h2>
            <p className='text-muted-foreground mt-2'>
              从左侧选择一个会话，开始您的沟通之旅
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-background flex h-full flex-col'>
      {/* 聊天头部 */}
      <div className='bg-card flex items-center justify-between border-b p-4'>
        <div className='flex items-center gap-3'>
          {conversation.avatar ? (
            <Avatar className='h-10 w-10'>
              <AvatarImage src={conversation.avatar} alt={conversation.name} />
              <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
            </Avatar>
          ) : (
            <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full'>
              {getConversationIcon()}
            </div>
          )}
          <div>
            <h3 className='font-semibold'>{conversation.name}</h3>
            <div className='text-muted-foreground flex items-center gap-2 text-sm'>
              {conversation.isOnline && (
                <>
                  <div className='h-2 w-2 rounded-full bg-green-500' />
                  <span>在线</span>
                </>
              )}
              {conversation.type === 'private' && !conversation.isOnline && (
                <>
                  <Clock className='h-3 w-3' />
                  <span>最后在线：2小时前</span>
                </>
              )}
              {conversation.type === 'group' && <span>群组聊天</span>}
              {conversation.type === 'system' && <span>系统消息</span>}
              {conversation.type === 'project' && <span>项目通知</span>}
            </div>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          {conversation.type === 'private' && (
            <>
              <Button variant='ghost' size='sm'>
                <Phone className='h-4 w-4' />
              </Button>
              <Button variant='ghost' size='sm'>
                <Video className='h-4 w-4' />
              </Button>
            </>
          )}
          <Button variant='ghost' size='sm'>
            <Search className='h-4 w-4' />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm'>
                <MoreVertical className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem>
                <Pin className='mr-2 h-4 w-4' />
                {conversation.isPinned ? '取消置顶' : '置顶会话'}
              </DropdownMenuItem>
              <DropdownMenuItem>
                {conversation.isMuted ? (
                  <>
                    <Bell className='mr-2 h-4 w-4' />
                    取消静音
                  </>
                ) : (
                  <>
                    <BellOff className='mr-2 h-4 w-4' />
                    静音通知
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Archive className='mr-2 h-4 w-4' />
                归档会话
              </DropdownMenuItem>
              {conversation.type === 'private' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className='text-destructive'>
                    <UserX className='mr-2 h-4 w-4' />
                    屏蔽用户
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 消息列表 */}
      <ScrollArea className='flex-1 p-4'>
        <div className='space-y-4'>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                <div className='border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent' />
                <span>加载消息中...</span>
              </div>
            </div>
          ) : (
            <>
              {console.log('Rendering messages, count:', messages.length)}
              {messages.length === 0 ? (
                <div className='flex items-center justify-center py-8'>
                  <div className='text-muted-foreground text-center'>
                    <p>暂无消息</p>
                    <p className='mt-1 text-xs'>开始聊天吧！</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = user?.id
                    ? message.sender.id === user.id
                    : false;
                  console.log(
                    'Rendering message:',
                    message.id,
                    message.content
                  );
                  return (
                    <MessageBubble
                      key={
                        message.id ||
                        `${message.sender.id}-${message.timestamp.getTime()}`
                      }
                      message={message}
                      isOwn={isOwn}
                      onReply={(msg) => setReplyTo(msg)}
                      onDelete={(messageId) => {
                        setMessages((prev) =>
                          prev.filter((msg) => msg.id !== messageId)
                        );
                      }}
                      onCopy={(content) => {
                        navigator.clipboard.writeText(content);
                        toast.success('消息已复制到剪贴板');
                      }}
                    />
                  );
                })
              )}
              {isTyping && (
                <div
                  key='typing-indicator'
                  className='text-muted-foreground flex items-center gap-2 text-sm'
                >
                  <div className='flex gap-1'>
                    <div className='bg-muted-foreground h-2 w-2 animate-bounce rounded-full' />
                    <div
                      className='bg-muted-foreground h-2 w-2 animate-bounce rounded-full'
                      style={{ animationDelay: '0.1s' }}
                    />
                    <div
                      className='bg-muted-foreground h-2 w-2 animate-bounce rounded-full'
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                  <span>{conversation.name} 正在输入...</span>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* 消息输入框 */}
      {(conversation.type === 'private' || conversation.type === 'group') && (
        <div className='bg-card border-t'>
          <MessageInput
            onSendMessage={handleSendMessage}
            replyTo={replyTo || undefined}
            onCancelReply={() => setReplyTo(null)}
            placeholder={`发送消息给 ${conversation.name}...`}
          />
        </div>
      )}
    </div>
  );
}
