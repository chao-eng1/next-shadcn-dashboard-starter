'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  MessageSquare,
  Users,
  Bell,
  Briefcase,
  Settings,
  Search,
  Plus,
  Phone,
  Video,
  Info,
  Archive,
  Star,
  Loader2,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ConversationList, type Conversation } from './conversation-list';
import { MessageBubble, type Message } from './message-bubble';
import { MessageInput, type MessageDraft } from './message-input';
import { useRouter } from 'next/navigation';

// 连接状态
type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

// 输入状态
interface TypingUser {
  id: string;
  name: string;
  avatar?: string;
}

interface MessageCenterProps {
  initialConversations?: Conversation[];
  initialMessages?: Message[];
  currentUserId: string;
  onlineUsers?: string[];
  className?: string;
}

// 模拟会话数据
const mockConversations: Conversation[] = [
  {
    id: 'conv1',
    type: 'private',
    name: '张三',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20of%20asian%20man%20in%20suit&image_size=square',
    lastMessage: {
      content: '好的，我明天会准时参加会议',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      sender: { id: 'user1', name: '张三' },
      type: 'text'
    },
    unreadCount: 2,
    isOnline: true,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    lastActivity: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    id: 'conv2',
    type: 'group',
    name: '项目Alpha讨论组',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20team%20collaboration%20icon%20blue%20gradient&image_size=square',
    lastMessage: {
      content: '大家对新的UI设计有什么看法？',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      sender: { id: 'user2', name: '李四' },
      type: 'text'
    },
    unreadCount: 5,
    isPinned: true,
    isMuted: false,
    isArchived: false,
    participants: [
      { id: 'user1', name: '张三', avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20of%20asian%20man%20in%20suit&image_size=square' },
      { id: 'user2', name: '李四', avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20of%20asian%20woman%20developer&image_size=square' },
      { id: 'user3', name: '王五', avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20of%20young%20asian%20developer&image_size=square' }
    ],
    lastActivity: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: 'conv3',
    type: 'system',
    name: '系统通知',
    lastMessage: {
      content: '您的密码将在7天后过期，请及时更新',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      type: 'text'
    },
    unreadCount: 1,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    priority: 'medium',
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: 'conv4',
    type: 'project',
    name: '项目Beta通知',
    avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20project%20notification%20icon%20green%20gradient&image_size=square',
    lastMessage: {
      content: '任务"API接口开发"已完成',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      type: 'text'
    },
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    priority: 'high',
    projectId: 'proj2',
    lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000)
  }
];

// 模拟消息数据
const mockMessages: Message[] = [
  {
    id: 'msg1',
    content: '大家好，欢迎加入项目Alpha讨论组！',
    type: 'system',
    sender: { id: 'system', name: '系统' },
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isOwn: false
  },
  {
    id: 'msg2',
    content: '谢谢邀请！很高兴能参与这个项目。',
    type: 'text',
    sender: {
      id: 'user1',
      name: '张三',
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20of%20asian%20man%20in%20suit&image_size=square',
      role: '产品经理'
    },
    timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000),
    status: 'read',
    isOwn: false
  },
  {
    id: 'msg3',
    content: '我也很期待与大家合作！有什么需要我协助的地方请随时告诉我。',
    type: 'text',
    sender: {
      id: 'current',
      name: '我',
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20of%20confident%20developer&image_size=square'
    },
    timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000),
    status: 'read',
    isOwn: true
  },
  {
    id: 'msg4',
    content: '我已经准备好了初版的UI设计稿，大家可以看看。',
    type: 'image',
    sender: {
      id: 'user2',
      name: '李四',
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20of%20asian%20woman%20developer&image_size=square',
      role: 'UI设计师'
    },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'delivered',
    isOwn: false,
    attachments: [
      {
        id: 'att1',
        name: 'ui-design-v1.png',
        url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20mobile%20app%20ui%20design%20mockup%20clean%20interface&image_size=landscape_16_9',
        size: 2048576,
        type: 'image/png',
        thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20mobile%20app%20ui%20design%20mockup%20clean%20interface&image_size=square'
      }
    ]
  },
  {
    id: 'msg5',
    content: '设计看起来很棒！我觉得颜色搭配很和谐，用户体验也考虑得很周到。',
    type: 'text',
    sender: {
      id: 'user3',
      name: '王五',
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20of%20young%20asian%20developer&image_size=square',
      role: '前端工程师'
    },
    timestamp: new Date(Date.now() - 90 * 60 * 1000),
    status: 'read',
    isOwn: false,
    replyTo: {
      id: 'msg4',
      content: '我已经准备好了初版的UI设计稿，大家可以看看。',
      sender: {
        id: 'user2',
        name: '李四',
        avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20of%20asian%20woman%20developer&image_size=square'
      },
      type: 'image'
    },
    reactions: [
      {
        emoji: '👍',
        count: 2,
        users: [{ id: 'user1', name: '张三' }, { id: 'current', name: '我' }],
        hasReacted: true
      }
    ]
  },
  {
    id: 'msg6',
    content: '大家对新的UI设计有什么看法？',
    type: 'text',
    sender: {
      id: 'user2',
      name: '李四',
      avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20of%20asian%20woman%20developer&image_size=square',
      role: 'UI设计师'
    },
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    status: 'delivered',
    isOwn: false,
    mentions: [
      { id: 'current', name: '我', type: 'user' },
      { id: 'user3', name: '王五', type: 'user' }
    ]
  }
];

export function MessageCenter({
  initialConversations = mockConversations,
  initialMessages = mockMessages,
  currentUserId = 'current',
  onlineUsers = ['user1', 'user2'],
  className
}: MessageCenterProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 当消息更新时滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 模拟连接状态变化
  useEffect(() => {
    const interval = setInterval(() => {
      // 模拟偶尔的连接问题
      if (Math.random() < 0.05) {
        setConnectionStatus('reconnecting');
        setTimeout(() => {
          setConnectionStatus('connected');
        }, 2000);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // 处理会话选择
  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    // 标记会话为已读
    setConversations(prev => prev.map(conv => 
      conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
    ));
    
    // 根据会话类型加载对应的消息
    setIsLoading(true);
    setTimeout(() => {
      // 这里应该从API加载实际的消息数据
      setMessages(mockMessages);
      setIsLoading(false);
    }, 500);
  };

  // 处理发送消息
  const handleSendMessage = (messageDraft: MessageDraft) => {
    if (!selectedConversation) return;
    
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      content: messageDraft.content,
      type: messageDraft.type,
      sender: {
        id: currentUserId,
        name: '我',
        avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20portrait%20of%20confident%20developer&image_size=square'
      },
      timestamp: new Date(),
      status: 'sending',
      isOwn: true,
      replyTo: messageDraft.replyTo,
      mentions: messageDraft.mentions
    };
    
    // 添加附件
    if (messageDraft.attachments && messageDraft.attachments.length > 0) {
      newMessage.attachments = messageDraft.attachments.map((file, index) => ({
        id: `att_${Date.now()}_${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        type: file.type
      }));
    }
    
    setMessages(prev => [...prev, newMessage]);
    setReplyTo(null);
    
    // 模拟发送状态更新
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
      ));
    }, 1000);
    
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
      ));
    }, 2000);
    
    // 更新会话的最后消息
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation.id ? {
        ...conv,
        lastMessage: {
          content: messageDraft.content,
          timestamp: new Date(),
          sender: { id: currentUserId, name: '我' },
          type: messageDraft.type
        },
        lastActivity: new Date()
      } : conv
    ));
  };

  // 处理输入状态
  const handleTyping = (isTyping: boolean) => {
    // 这里应该通过WebSocket发送输入状态
    console.log('Typing status:', isTyping);
  };

  // 处理消息操作
  const handleMessageReply = (message: Message) => {
    setReplyTo(message);
  };

  const handleMessageEdit = (message: Message) => {
    // TODO: 实现消息编辑功能
    toast.info('消息编辑功能开发中...');
  };

  const handleMessageDelete = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    toast.success('消息已删除');
  };

  const handleMessageForward = (message: Message) => {
    // TODO: 实现消息转发功能
    toast.info('消息转发功能开发中...');
  };

  const handleMessagePin = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
    ));
    toast.success('消息置顶状态已更新');
  };

  const handleMessageReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;
      
      const reactions = msg.reactions || [];
      const existingReaction = reactions.find(r => r.emoji === emoji);
      
      if (existingReaction) {
        if (existingReaction.hasReacted) {
          // 取消反应
          existingReaction.count--;
          existingReaction.hasReacted = false;
          existingReaction.users = existingReaction.users.filter(u => u.id !== currentUserId);
          
          if (existingReaction.count === 0) {
            return { ...msg, reactions: reactions.filter(r => r.emoji !== emoji) };
          }
        } else {
          // 添加反应
          existingReaction.count++;
          existingReaction.hasReacted = true;
          existingReaction.users.push({ id: currentUserId, name: '我' });
        }
      } else {
        // 新反应
        reactions.push({
          emoji,
          count: 1,
          users: [{ id: currentUserId, name: '我' }],
          hasReacted: true
        });
      }
      
      return { ...msg, reactions };
    }));
  };

  // 处理新建对话
  const handleNewConversation = () => {
    router.push('/dashboard/messages/new');
  };

  // 获取连接状态图标
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'connecting':
      case 'reconnecting':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  // 过滤消息
  const filteredMessages = messages.filter(message => {
    if (!searchQuery) return true;
    return message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
           message.sender.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className={cn('h-full flex flex-col bg-background', className)}>
      {/* 状态栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">消息中心</h1>
          {getConnectionIcon()}
          <span className="text-sm text-muted-foreground">
            {connectionStatus === 'connected' && '已连接'}
            {connectionStatus === 'connecting' && '连接中...'}
            {connectionStatus === 'reconnecting' && '重新连接中...'}
            {connectionStatus === 'disconnected' && '连接断开'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/messages/settings')}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* 主要内容区域 */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* 会话列表 */}
          <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversation?.id}
              onConversationSelect={handleConversationSelect}
              onNewConversation={handleNewConversation}
              className="h-full border-r"
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* 消息区域 */}
          <ResizablePanel defaultSize={70}>
            {selectedConversation ? (
              <div className="h-full flex flex-col">
                {/* 会话头部 */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">{selectedConversation.name}</h2>
                      {selectedConversation.type === 'group' && selectedConversation.participants && (
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {selectedConversation.participants.length} 人
                        </Badge>
                      )}
                      {selectedConversation.isMuted && (
                        <VolumeX className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* 在线状态 */}
                    {selectedConversation.type === 'private' && selectedConversation.isOnline !== undefined && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <div className={cn(
                          'h-2 w-2 rounded-full',
                          selectedConversation.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        )} />
                        <span>{selectedConversation.isOnline ? '在线' : '离线'}</span>
                      </div>
                    )}
                    
                    {/* 输入状态 */}
                    {typingUsers.length > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <div className="flex gap-1">
                          <div className="h-1 w-1 bg-current rounded-full animate-bounce" />
                          <div className="h-1 w-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="h-1 w-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <span>
                          {typingUsers.map(user => user.name).join(', ')} 正在输入...
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {selectedConversation.type === 'private' && (
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
                    <Button variant="ghost" size="sm">
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* 消息列表 */}
                <ScrollArea className="flex-1" ref={messagesContainerRef}>
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2 text-muted-foreground">加载消息中...</span>
                    </div>
                  ) : filteredMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mb-2" />
                      <p>暂无消息</p>
                      <p className="text-sm">发送第一条消息开始对话</p>
                    </div>
                  ) : (
                    <div className="py-4">
                      {filteredMessages.map((message, index) => {
                        const prevMessage = filteredMessages[index - 1];
                        const showAvatar = !prevMessage || 
                          prevMessage.sender.id !== message.sender.id ||
                          message.timestamp.getTime() - prevMessage.timestamp.getTime() > 5 * 60 * 1000;
                        
                        return (
                          <MessageBubble
                            key={message.id}
                            message={message}
                            showAvatar={showAvatar}
                            showTimestamp={showAvatar}
                            showStatus={message.isOwn}
                            compact={!showAvatar}
                            onReply={handleMessageReply}
                            onEdit={handleMessageEdit}
                            onDelete={handleMessageDelete}
                            onForward={handleMessageForward}
                            onPin={handleMessagePin}
                            onReaction={handleMessageReaction}
                          />
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
                
                {/* 消息输入 */}
                <MessageInput
                  onSendMessage={handleSendMessage}
                  onTyping={handleTyping}
                  replyTo={replyTo ? {
                    id: replyTo.id,
                    content: replyTo.content,
                    sender: replyTo.sender
                  } : undefined}
                  onCancelReply={() => setReplyTo(null)}
                  participants={selectedConversation.participants}
                  disabled={connectionStatus !== 'connected'}
                />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mb-4" />
                <h3 className="text-lg font-semibold mb-2">选择一个对话</h3>
                <p className="text-center max-w-md">
                  从左侧选择一个对话开始聊天，或者创建新的对话。
                </p>
                <Button className="mt-4" onClick={handleNewConversation}>
                  <Plus className="h-4 w-4 mr-2" />
                  新建对话
                </Button>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}