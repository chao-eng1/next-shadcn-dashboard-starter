'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageCircle, Send, Users, Search, Plus, UserPlus, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { useTranslations } from "next-intl";
import { useIM } from '@/hooks/useIM';
import { imAPI } from '@/lib/api/im-api';
import { toast } from 'sonner';
import type { User, Project } from '@/store/im-store';



export default function IMPage() {
  const t = useTranslations();
  const {
    // 状态
    currentUser,
    isConnected,
    connectionStatus,
    currentProject,
    currentConversation,
    projects,
    conversations,
    messages,
    onlineUsers,
    chatType,
    searchTerm,
    loading,
    error,
    
    // Actions
    setCurrentProject,
    setCurrentConversation,
    setChatType,
    setSearchTerm,
    
    // 方法
    initialize,
    loadConversations,
    loadMessages,
    sendMessage,
    createPrivateConversation,
    loadProjectMembers,
    uploadFile
  } = useIM();
  
  const [newMessage, setNewMessage] = useState('');
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [showProjectMembersDialog, setShowProjectMembersDialog] = useState(false);
  const [selectedProjectForChat, setSelectedProjectForChat] = useState<Project | null>(null);
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [projectMembers, setProjectMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // 初始化IM系统
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  // 当聊天类型改变时加载对应的会话列表
  useEffect(() => {
    if (currentUser) {
      loadConversations(chatType);
    }
  }, [chatType, currentUser, loadConversations]);
  
  // 当选择会话时加载消息
  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation, loadMessages]);
  
  // 发送消息
  const handleSendMessage = async () => {
    if (!currentConversation || (!newMessage.trim() && !pastedImage)) {
      return;
    }
    
    try {
      let messageContent = newMessage.trim();
      let messageType: 'text' | 'image' | 'file' = 'text';
      
      // 处理粘贴的图片
      if (pastedImage) {
        // 将base64图片转换为文件并上传
        const response = await fetch(pastedImage);
        const blob = await response.blob();
        const file = new File([blob], 'pasted-image.png', { type: 'image/png' });
        
        const uploadResult = await uploadFile(file, currentConversation.id);
        messageContent = uploadResult.url;
        messageType = 'image';
      }
      
      await sendMessage(messageContent, messageType);
      setNewMessage('');
      setPastedImage(null);
    } catch (error) {
      console.error('发送消息失败:', error);
      toast.error('发送消息失败');
    }
  };

  // 处理粘贴图片
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            setPastedImage(result);
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  // 开始私聊
  const handleStartPrivateChat = async (member: User) => {
    if (!selectedProjectForChat) {
      toast.error('请先选择项目');
      return;
    }
    
    try {
      const conversation = await createPrivateConversation(member.id, selectedProjectForChat.id);
      setCurrentConversation(conversation);
      setShowMemberDialog(false);
      setChatType('private');
      toast.success(`已开始与${member.name}的私聊`);
    } catch (error) {
      console.error('创建私聊失败:', error);
      toast.error('创建私聊失败');
    }
  };
  
  // 加载项目成员
  const handleLoadProjectMembers = async (projectId: string) => {
    try {
      setLoadingMembers(true);
      const members = await loadProjectMembers(projectId);
      setProjectMembers(members);
    } catch (error) {
      console.error('加载项目成员失败:', error);
      toast.error('加载项目成员失败');
    } finally {
      setLoadingMembers(false);
    }
  };
  
  // 当选择项目进行私聊时，加载该项目的成员
  useEffect(() => {
    if (selectedProjectForChat && showMemberDialog) {
      handleLoadProjectMembers(selectedProjectForChat.id);
    }
  }, [selectedProjectForChat, showMemberDialog]);
  
  // 处理聊天类型切换
  const handleTabChange = (value: string) => {
    setChatType(value as 'project' | 'private');
  };
  
  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else {
      return `${days}天前`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return '在线';
      case 'away': return '离开';
      case 'offline': return '离线';
      default: return '未知';
    }
  };

  // 错误状态显示
  if (error) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">连接失败</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => initialize()} variant="outline">
                重新连接
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 过滤会话列表
  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    if (conv.type === 'project') {
      return conv.name.toLowerCase().includes(searchLower);
    } else {
      return conv.participants.some(p => 
        p.name.toLowerCase().includes(searchLower) || 
        p.email.toLowerCase().includes(searchLower)
      );
    }
  });

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-4 p-4">
      {/* 连接状态指示器 */}
      {connectionStatus !== 'connected' && (
        <div className="fixed top-4 right-4 z-50">
          <Badge variant={connectionStatus === 'connecting' ? 'secondary' : 'destructive'} className="flex items-center gap-2">
            {connectionStatus === 'connecting' && <Loader2 className="h-3 w-3 animate-spin" />}
            {connectionStatus === 'connecting' ? '连接中...' : 
             connectionStatus === 'error' ? '连接错误' : '已断开'}
          </Badge>
        </div>
      )}
      
      {/* 会话列表 */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            即时通讯
            {isConnected && <div className="h-2 w-2 bg-green-500 rounded-full" />}
          </CardTitle>
          <Tabs value={chatType} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="project" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                项目群聊
              </TabsTrigger>
              <TabsTrigger value="private" className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                私聊
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={chatType === 'project' ? '搜索项目...' : '搜索会话...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          {chatType === 'private' && (
            <Dialog open={showMemberDialog} onOpenChange={setShowMemberDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <UserPlus className="h-4 w-4 mr-2" />
                  开始新的私聊
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>选择聊天对象</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">选择项目</label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={selectedProjectForChat?.id || ''}
                      onChange={(e) => {
                        const project = projects.find(p => p.id === e.target.value);
                        if (project) setSelectedProjectForChat(project);
                      }}
                    >
                      <option value="">请选择项目</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">项目成员</label>
                    <ScrollArea className="h-64">
                      {loadingMembers ? (
                        <div className="flex items-center justify-center h-32">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {projectMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                              onClick={() => handleStartPrivateChat(member)}
                            >
                              <div className="relative">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={member.image} />
                                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div
                                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                                    getStatusColor(member.status)
                                  }`}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{member.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                              </div>
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  member.status === 'online' ? 'text-green-600' :
                                  member.status === 'away' ? 'text-yellow-600' : 'text-gray-500'
                                }`}
                              >
                                {getStatusText(member.status)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            {loading.conversations ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {filteredConversations.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>暂无{chatType === 'project' ? '项目群聊' : '私聊会话'}</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        currentConversation?.id === conversation.id ? 'bg-primary/10 border border-primary/20' : ''
                      }`}
                      onClick={() => setCurrentConversation(conversation)}
                    >
                      {conversation.type === 'project' ? (
                        // 项目群聊
                        <>
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-sm truncate">{conversation.name}</h3>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {conversation.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {conversation.participants.length}人
                            </span>
                            <span>{conversation.lastMessage ? formatTime(conversation.lastMessage.timestamp) : ''}</span>
                          </div>
                          {conversation.lastMessage && (
                            <div className="mt-2 text-xs text-muted-foreground truncate">
                              {conversation.lastMessage.senderName}: {conversation.lastMessage.content}
                            </div>
                          )}
                        </>
                      ) : (
                        // 私聊
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conversation.participants[0]?.image} />
                            <AvatarFallback>{conversation.participants[0]?.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium text-sm truncate">{conversation.participants[0]?.name}</h3>
                              {conversation.unreadCount > 0 && (
                                <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {conversation.participants[0]?.role}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="truncate flex-1">
                                {conversation.lastMessage ? 
                                  `${conversation.lastMessage.senderName}: ${conversation.lastMessage.content}` : 
                                  '暂无消息'
                                }
                              </span>
                              <span className="ml-2">
                                {conversation.lastMessage ? formatTime(conversation.lastMessage.timestamp) : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* 聊天区域 */}
      <Card className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentConversation.type === 'private' && (
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={currentConversation.participants[0]?.image} />
                      <AvatarFallback>{currentConversation.participants[0]?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <CardTitle className="text-lg">
                      {currentConversation.type === 'project' ? currentConversation.name : currentConversation.participants[0]?.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentConversation.type === 'project' 
                        ? currentConversation.description 
                        : currentConversation.participants[0]?.role
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {currentConversation.type === 'project' && (
                    <Dialog open={showProjectMembersDialog} onOpenChange={setShowProjectMembersDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          项目成员
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {currentConversation.name} - 项目成员
                          </DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="h-96">
                          <div className="space-y-2 pr-4">
                            {currentConversation.participants.map((member) => (
                              <div 
                                key={member.id} 
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => {
                                  // 点击成员可以开始私聊
                                  const project = projects.find(p => p.id === currentConversation.projectId);
                                  if (project) {
                                    setSelectedProjectForChat(project);
                                    handleStartPrivateChat(member);
                                    setShowProjectMembersDialog(false);
                                  }
                                }}
                              >
                                <div className="relative">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={member.image} />
                                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div
                                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                                      getStatusColor(member.status)
                                    }`}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{member.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    member.status === 'online' ? 'text-green-600' :
                                    member.status === 'away' ? 'text-yellow-600' : 'text-gray-500'
                                  }`}
                                >
                                  {getStatusText(member.status)}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  )}
                  <Badge variant="outline" className="flex items-center gap-1">
                    {currentConversation.type === 'project' ? (
                      <>
                        <Users className="h-3 w-3" />
                        {currentConversation.participants.length}人
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-3 w-3" />
                        私聊
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <Separator />
            
            {/* 消息列表 */}
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full p-4">
                {loading.messages ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>暂无消息，开始聊天吧！</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${message.senderId === currentUser?.id ? 'flex-row-reverse' : ''}`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.senderImage} />
                            <AvatarFallback>
                              {message.senderName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`flex-1 max-w-[70%] ${message.senderId === currentUser?.id ? 'text-right' : ''}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{message.senderName}</span>
                              <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                            </div>
                            <div
                              className={`p-3 rounded-lg text-sm ${
                                message.senderId === currentUser?.id
                                  ? 'bg-primary text-primary-foreground ml-auto'
                                  : 'bg-muted'
                              }`}
                            >
                              {message.type === 'text' ? (
                                message.content
                              ) : message.type === 'image' ? (
                                <img
                                  src={message.content}
                                  alt="Shared image"
                                  className="max-w-xs rounded-lg border"
                                />
                              ) : message.type === 'file' ? (
                                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg max-w-xs">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{message.fileName}</p>
                                    <p className="text-xs text-muted-foreground">{message.fileSize}</p>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">选择一个会话开始聊天</h3>
              <p className="text-sm">从左侧选择项目群聊或私聊会话</p>
            </div>
          </div>
        )}
        
        {currentConversation && (
          <>
            <Separator />
            
            {/* 消息输入 */}
            <div className="p-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <Textarea
                    placeholder="输入消息... (Enter发送，Shift+Enter换行)"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    onPaste={handlePaste}
                    className="min-h-[40px] max-h-[120px] resize-none"
                    rows={1}
                    disabled={loading.sending}
                  />
                  {pastedImage && (
                    <div className="mt-2 relative inline-block">
                      <img 
                        src={pastedImage} 
                        alt="Pasted image" 
                        className="max-w-[200px] max-h-[150px] rounded-lg border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => setPastedImage(null)}
                      >
                        ×
                      </Button>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleSendMessage} 
                  size="icon" 
                  className="mb-0"
                  disabled={(!newMessage.trim() && !pastedImage) || loading.sending}
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
        )}
      </Card>
    </div>
  );
}