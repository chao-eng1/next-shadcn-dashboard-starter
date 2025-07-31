import { useEffect, useCallback, useRef } from 'react';
import { useWebSocket, WebSocketMessage } from './useWebSocket';
import { useIMStore } from '@/store/im-store';
import { imAPI } from '@/lib/api/im-api';
import { toast } from 'sonner';
import type { User, Conversation, Message, Project } from '@/store/im-store';

export const useIM = () => {
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
    isTyping,
    loading,
    error,
    
    // Actions
    setCurrentUser,
    setConnectionStatus,
    setIsConnected,
    setProjects,
    setCurrentProject,
    setConversations,
    setCurrentConversation,
    addConversation,
    updateConversation,
    setMessages,
    addMessage,
    updateMessage,
    updateMessageStatus,
    setOnlineUsers,
    updateUserStatus,
    setChatType,
    setSearchTerm,
    setTyping,
    setLoading,
    setError,
    handleWebSocketMessage,
    reset
  } = useIMStore();
  
  const wsTokenRef = useRef<string>('');
  const typingTimeoutRef = useRef<{ [conversationId: string]: NodeJS.Timeout }>({});
  
  // WebSocket连接 - 只在客户端初始化
  const webSocketResult = typeof window !== 'undefined' ? useWebSocket({
    url: imAPI.websocket.getWebSocketUrl(),
    token: wsTokenRef.current,
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      // 连接成功后同步在线用户状态
      loadOnlineUsers();
    },
    onDisconnect: () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    },
    onError: () => {
      setConnectionStatus('error');
    },
    autoReconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5
  }) : { sendMessage: () => false, reconnect: () => {} };
  
  const { sendMessage: sendWSMessage, reconnect } = webSocketResult;
  
  // 初始化IM系统
  const initialize = useCallback(async () => {
    try {
      setLoading('projects', true);
      setError(null);
      
      // 获取当前用户信息
      const user = await imAPI.user.getCurrentUser();
      setCurrentUser(user);
      
      // 获取WebSocket token
      const wsToken = await imAPI.websocket.getWebSocketToken();
      wsTokenRef.current = wsToken;
      
      // 加载用户项目
      const userProjects = await imAPI.project.getUserProjects();
      setProjects(userProjects);
      
      // 设置默认项目
      if (userProjects.length > 0 && !currentProject) {
        setCurrentProject(userProjects[0]);
      }
      
    } catch (error) {
      console.error('Failed to initialize IM:', error);
      setError('初始化IM系统失败');
      toast.error('初始化IM系统失败');
    } finally {
      setLoading('projects', false);
    }
  }, [currentProject, setCurrentUser, setProjects, setCurrentProject, setLoading, setError]);
  
  // 加载会话列表
  const loadConversations = useCallback(async (type?: 'project' | 'private') => {
    try {
      setLoading('conversations', true);
      setError(null);
      
      const conversationList = await imAPI.conversation.getConversations(type);
      setConversations(conversationList);
      
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setError('加载会话列表失败');
      toast.error('加载会话列表失败');
    } finally {
      setLoading('conversations', false);
    }
  }, [setConversations, setLoading, setError]);
  
  // 加载消息列表
  const loadMessages = useCallback(async (conversationId: string, page: number = 1) => {
    try {
      setLoading('messages', true);
      setError(null);
      
      const result = await imAPI.message.getMessages(conversationId, page);
      
      if (page === 1) {
        setMessages(result.messages);
      } else {
        // 分页加载，追加到现有消息前面
        setMessages([...result.messages, ...messages]);
      }
      
      // 标记会话为已读
      await imAPI.conversation.markConversationAsRead(conversationId);
      
      // 更新会话的未读数量
      updateConversation(conversationId, { unreadCount: 0 });
      
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError('加载消息失败');
      toast.error('加载消息失败');
    } finally {
      setLoading('messages', false);
    }
  }, [messages, setMessages, setLoading, setError, updateConversation]);
  
  // 发送消息
  const sendMessage = useCallback(async (
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text',
    replyToId?: string
  ) => {
    if (!currentConversation || !currentUser) {
      toast.error('请先选择会话');
      return;
    }
    
    try {
      setLoading('sending', true);
      setError(null);
      
      // 创建临时消息显示在UI中
      const tempMessage: Message = {
        id: `temp_${Date.now()}`,
        conversationId: currentConversation.id,
        senderId: currentUser.id,
        content,
        messageType,
        replyToId,
        status: 'sending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      addMessage(tempMessage);
      
      // 发送到服务器
      const sentMessage = await imAPI.message.sendMessage(
        currentConversation.id,
        content,
        messageType,
        replyToId
      );
      
      // 更新临时消息为真实消息
      updateMessage(tempMessage.id, {
        id: sentMessage.id,
        status: 'sent',
        createdAt: sentMessage.createdAt,
        updatedAt: sentMessage.updatedAt
      });
      
      // 通过WebSocket发送消息通知
      const wsMessage: WebSocketMessage = {
        type: 'message',
        data: {
          conversationId: currentConversation.id,
          content,
          messageType,
          messageId: sentMessage.id,
          timestamp: sentMessage.createdAt
        }
      };
      
      sendWSMessage(wsMessage);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('发送消息失败');
      toast.error('发送消息失败');
      
      // 更新临时消息状态为失败
      updateMessage(`temp_${Date.now()}`, { status: 'sent' }); // 暂时标记为已发送，实际应该有失败状态
    } finally {
      setLoading('sending', false);
    }
  }, [currentConversation, currentUser, addMessage, updateMessage, sendWSMessage, setLoading, setError]);
  
  // 发送文件
  const sendFile = useCallback(async (file: File) => {
    if (!currentConversation) {
      toast.error('请先选择会话');
      return;
    }
    
    try {
      setLoading('sending', true);
      
      // 上传文件
      const uploadResult = await imAPI.file.uploadFile(file);
      
      // 发送文件消息
      await sendMessage(uploadResult.url, 'file');
      
    } catch (error) {
      console.error('Failed to send file:', error);
      setError('发送文件失败');
      toast.error('发送文件失败');
    } finally {
      setLoading('sending', false);
    }
  }, [currentConversation, sendMessage, setLoading, setError]);
  
  // 加载在线用户
  const loadOnlineUsers = useCallback(async () => {
    try {
      const users = await imAPI.user.getOnlineUsers();
      setOnlineUsers(users);
    } catch (error) {
      console.error('Failed to load online users:', error);
    }
  }, [setOnlineUsers]);
  
  // 创建私聊会话
  const createPrivateConversation = useCallback(async (userId: string, projectId?: string) => {
    try {
      setLoading('conversations', true);
      setError(null);
      
      const conversation = await imAPI.conversation.createPrivateConversation(userId, projectId);
      
      // 添加到会话列表
      setConversations([conversation, ...conversations]);
      
      // 设置为当前会话
      setCurrentConversation(conversation);
      
      return conversation;
      
    } catch (error) {
      console.error('Failed to create private conversation:', error);
      setError('创建私聊失败');
      toast.error('创建私聊失败');
      throw error;
    } finally {
      setLoading('conversations', false);
    }
  }, [conversations, setConversations, setCurrentConversation, setLoading, setError]);
  
  // 加载项目成员
  const loadProjectMembers = useCallback(async (projectId: string) => {
    try {
      setLoading('members', true);
      const members = await imAPI.project.getProjectMembers(projectId);
      return members;
    } catch (error) {
      console.error('Failed to load project members:', error);
      setError('加载项目成员失败');
      toast.error('加载项目成员失败');
      return [];
    } finally {
      setLoading('members', false);
    }
  }, [setLoading, setError]);
  
  // 搜索用户
  const searchUsers = useCallback(async (query: string) => {
    try {
      const users = await imAPI.user.searchUsers(query);
      return users;
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  }, []);
  
  // 获取未读消息数量
  const getUnreadCount = useCallback(async () => {
    try {
      const count = await imAPI.message.getUnreadCount();
      return count;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }, []);
  
  // 上传文件
  const uploadFile = useCallback(async (file: File, conversationId?: string) => {
    try {
      const result = await imAPI.file.uploadFile(file);
      return result;
    } catch (error) {
      console.error('Failed to upload file:', error);
      setError('文件上传失败');
      toast.error('文件上传失败');
      throw error;
    }
  }, [setError]);
  
  return {
    // 状态
    currentUser,
    currentProject,
    currentConversation,
    projects,
    conversations,
    messages,
    onlineUsers,
    chatType,
    searchTerm,
    isConnected,
    connectionStatus,
    typing: isTyping,
    loading,
    error,
    
    // 操作
    initialize,
    loadConversations,
    loadMessages,
    sendMessage,
    sendFile,
    uploadFile,
    loadOnlineUsers,
    createPrivateConversation,
    loadProjectMembers,
    searchUsers,
    getUnreadCount,
    
    // 设置状态
    setCurrentProject,
    setCurrentConversation,
    setChatType,
    setSearchTerm,
    
    // WebSocket
    reconnect
  };
};