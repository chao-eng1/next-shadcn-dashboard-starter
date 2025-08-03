import { useEffect, useCallback, useRef } from 'react';
import { useWebSocket, WebSocketMessage } from './useWebSocket';
import { useIMStore } from '@/store/im-store';
import { imAPI } from '@/lib/api/im-api';
import { toast } from 'sonner';
import type { User, Conversation, Message, Project } from '@/store/im-store';

export const useIM = () => {
  const store = useIMStore();
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
  } = store;

  // 获取store状态的辅助函数
  const getStoreState = useCallback(() => useIMStore.getState(), []);
  
  const wsTokenRef = useRef<string>('');
  const typingTimeoutRef = useRef<{ [conversationId: string]: NodeJS.Timeout }>({});
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageTimestampRef = useRef<string>(new Date().toISOString());
  const onlineStatusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 使用refs来存储函数引用，避免useEffect依赖问题
  const startPollingRef = useRef<() => void>(() => {});
  const stopPollingRef = useRef<() => void>(() => {});
  const loadOnlineUsersRef = useRef<() => Promise<void>>(async () => {});
  const startOnlineStatusSyncRef = useRef<() => void>(() => {});
  const stopOnlineStatusSyncRef = useRef<() => void>(() => {});
  
  // WebSocket连接 - 只在客户端初始化
  const webSocketResult = typeof window !== 'undefined' ? useWebSocket({
    url: imAPI.websocket.getWebSocketUrl(),
    token: wsTokenRef.current,
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      // 连接成功后停止轮询
      stopPollingRef.current();
      // 连接成功后同步在线用户状态
      loadOnlineUsersRef.current();
      // WebSocket连接成功时使用较低频率的状态同步（因为WebSocket会实时更新）
      startOnlineStatusSyncRef.current();
    },
    onDisconnect: () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      // 断开连接后启动轮询作为备选方案
      startPollingRef.current();
      // WebSocket断开时仍然需要定期同步在线状态
      startOnlineStatusSyncRef.current();
    },
    onError: () => {
      console.warn('WebSocket连接失败，启动轮询模式');
      setConnectionStatus('error');
      setIsConnected(false);
      // WebSocket失败后启动轮询
      startPollingRef.current();
      // WebSocket失败时也需要在线状态同步
      startOnlineStatusSyncRef.current();
    },
    autoReconnect: true, // 启用自动重连
    reconnectInterval: 5000,
    maxReconnectAttempts: 10 // 增加重连次数
  }) : { sendMessage: () => false, reconnect: () => {} };
  
  const { sendMessage: sendWSMessage, reconnect } = webSocketResult;
  
  // 轮询获取新消息的函数
  const pollForNewMessages = useCallback(async () => {
    const state = getStoreState();
    if (!state.currentUser || !state.currentConversation) {
      console.log('轮询跳过：缺少用户或会话信息');
      return;
    }
    
    console.log(`轮询检查新消息 - 会话: ${state.currentConversation.id}, 用户: ${state.currentUser.name}`);
    
    try {
      // 获取最新的消息
      const result = await imAPI.message.getMessages(state.currentConversation.id, 1, 20);
      console.log(`轮询获取到 ${result.messages.length} 条消息`);
      
      // 找出新消息（基于时间戳和ID过滤）
      const currentMessageIds = new Set(state.messages.map(msg => msg.id));
      const newMessages = result.messages.filter(msg => {
        const isNewByTime = new Date(msg.createdAt) > new Date(lastMessageTimestampRef.current);
        const isNewById = !currentMessageIds.has(msg.id);
        
        console.log(`消息 ${msg.id}: 时间新=${isNewByTime}, ID新=${isNewById}, 发送者=${msg.senderName}, 当前用户=${state.currentUser?.name}`);
        
        // 移除 isNotOwnMessage 过滤条件，让所有新消息都能被显示
        return isNewByTime || isNewById;
      });
      
      if (newMessages.length > 0) {
        console.log(`轮询发现${newMessages.length}条新消息:`, newMessages.map(m => ({id: m.id, content: m.content, sender: m.senderName})));
        
        // 更新最后消息时间戳
        const latestMessage = newMessages.reduce((latest, msg) => 
          new Date(msg.createdAt) > new Date(latest.createdAt) ? msg : latest
        );
        lastMessageTimestampRef.current = latestMessage.createdAt;
        
        // 按时间顺序添加新消息
        newMessages
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .forEach(msg => {
            console.log(`添加新消息到界面: ${msg.content}`);
            addMessage(msg);
          });
      } else {
        console.log('轮询未发现新消息');
      }
    } catch (error) {
      console.error('轮询消息失败:', error);
    }
  }, [getStoreState, addMessage]);
  
  // 启动轮询
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return; // 避免重复启动
    
    console.log('启动消息轮询模式');
    // 立即执行一次轮询
    pollForNewMessages();
    // 然后每3秒轮询一次（更合理的频率）
    pollingIntervalRef.current = setInterval(pollForNewMessages, 3000);
  }, [pollForNewMessages]);
  
  // 停止轮询
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log('停止消息轮询');
    }
  }, []);
  
  // 初始化IM系统
  const initialize = useCallback(async () => {
    try {
      setLoading('projects', true);
      setError(null);
      
      console.log('开始初始化IM系统...');
      
      // 获取当前用户信息
      const user = await imAPI.user.getCurrentUser();
      console.log('获取当前用户信息:', user);
      setCurrentUser(user);
      
      // 设置用户状态为在线
      try {
        await imAPI.user.updateUserStatus('online');
        console.log('用户状态已设置为在线');
      } catch (statusError) {
        console.warn('设置用户在线状态失败:', statusError);
      }
      
      // 尝试获取WebSocket token，但不因失败而中断初始化
      try {
        const wsToken = await imAPI.websocket.getWebSocketToken();
        const previousToken = wsTokenRef.current;
        wsTokenRef.current = wsToken;
        
        // 如果token发生变化，触发重新连接
        if (previousToken !== wsToken && webSocketResult.reconnect) {
          webSocketResult.reconnect();
        }
      } catch (wsError) {
        console.warn('无法获取WebSocket token，将使用离线模式:', wsError);
        // 设置为离线模式但不阻止继续初始化
        setConnectionStatus('error');
      }
      
      // 加载用户项目
      console.log('开始加载用户项目...');
      const userProjects = await imAPI.project.getUserProjects();
      console.log('获取到的用户项目:', userProjects);
      setProjects(userProjects);
      
      // 设置默认项目 - 使用getStoreState获取当前状态
      const currentProj = getStoreState().currentProject;
      if (userProjects.length > 0 && !currentProj) {
        console.log('设置默认项目:', userProjects[0]);
        setCurrentProject(userProjects[0]);
      }
      
      // 启动在线状态同步
      startOnlineStatusSyncRef.current();
      
      console.log('IM系统初始化完成');
      
    } catch (error) {
      console.error('Failed to initialize IM:', error);
      setError('初始化IM系统失败');
      toast.error('初始化IM系统失败');
    } finally {
      setLoading('projects', false);
    }
  }, [setCurrentUser, setProjects, setCurrentProject, setLoading, setError, setConnectionStatus, getStoreState]);
  
  // 加载会话列表
  const loadConversations = useCallback(async (type?: 'project' | 'private' | 'system') => {
    try {
      setLoading('conversations', true);
      setError(null);
      
      if (type === 'system') {
        // 系统消息不需要加载会话列表，保持空数组
        setConversations([]);
      } else {
        const conversationList = await imAPI.conversation.getConversations(type);
        setConversations(conversationList);
      }
      
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
        // 更新最后消息时间戳
        if (result.messages.length > 0) {
          lastMessageTimestampRef.current = result.messages[result.messages.length - 1].createdAt;
        }
      } else {
        // 分页加载，追加到现有消息前面 - 使用getStoreState读取当前消息
        const currentMessages = getStoreState().messages;
        setMessages([...result.messages, ...currentMessages]);
      }
      
      // 标记会话为已读
      try {
        await imAPI.conversation.markConversationAsRead(conversationId);
        console.log('Successfully marked conversation as read');
      } catch (readError) {
        console.error('Failed to mark conversation as read:', readError);
        // 即使标记已读失败，也继续更新前端状态以保证用户体验
      }
      
      // 更新会话的未读数量
      updateConversation(conversationId, { unreadCount: 0 });
      
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError('加载消息失败');
      toast.error('加载消息失败');
    } finally {
      setLoading('messages', false);
    }
  }, [setMessages, setLoading, setError, updateConversation, getStoreState]);
  
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
        senderName: currentUser.name,
        senderImage: currentUser.image,
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
      
      // 更新最后消息时间戳
      lastMessageTimestampRef.current = sentMessage.createdAt;
      
      // 通过WebSocket发送消息通知（如果连接可用）
      if (isConnected) {
        const wsMessage: WebSocketMessage = {
          type: 'message',
          data: {
            conversationId: currentConversation.id,
            content,
            messageType,
            messageId: sentMessage.id,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderImage: currentUser.image,
            timestamp: sentMessage.createdAt,
            receiverId: currentConversation.type === 'private' 
              ? currentConversation.participants.find(p => p.id !== currentUser.id)?.id 
              : undefined
          }
        };
        
        sendWSMessage(wsMessage);
      } else {
        // WebSocket不可用时，仍然可以通过HTTP API发送消息
        console.log('WebSocket不可用，消息已通过HTTP API发送');
      }
      
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
      
      // 同步更新会话中参与者的状态
      const state = getStoreState();
      if (state.conversations.length > 0) {
        users.forEach(onlineUser => {
          updateUserStatus(onlineUser.id, onlineUser.status);
        });
      }
    } catch (error) {
      console.error('Failed to load online users:', error);
    }
  }, [setOnlineUsers, updateUserStatus, getStoreState]);
  
  // 启动在线状态同步
  const startOnlineStatusSync = useCallback(() => {
    if (onlineStatusIntervalRef.current) return; // 避免重复启动
    
    console.log('启动在线状态同步');
    // 立即执行一次同步
    loadOnlineUsers();
    // 然后每30秒同步一次在线状态
    onlineStatusIntervalRef.current = setInterval(loadOnlineUsers, 30000);
  }, [loadOnlineUsers]);
  
  // 停止在线状态同步
  const stopOnlineStatusSync = useCallback(() => {
    if (onlineStatusIntervalRef.current) {
      clearInterval(onlineStatusIntervalRef.current);
      onlineStatusIntervalRef.current = null;
      console.log('停止在线状态同步');
    }
  }, []);
  
  // 创建私聊会话
  const createPrivateConversation = useCallback(async (userId: string, projectId?: string) => {
    try {
      setLoading('conversations', true);
      setError(null);
      
      const conversation = await imAPI.conversation.createPrivateConversation(userId, projectId);
      
      // 添加到会话列表 - 使用getStoreState读取当前会话列表
      const currentConversations = getStoreState().conversations;
      setConversations([conversation, ...currentConversations]);
      
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
  }, [setConversations, setCurrentConversation, setLoading, setError, getStoreState]);
  
  // 加载项目成员
  const loadProjectMembers = useCallback(async (projectId: string) => {
    try {
      setLoading('members', true);
      console.log('开始加载项目成员，项目ID:', projectId);
      const members = await imAPI.project.getProjectMembers(projectId);
      console.log('获取到的项目成员:', members);
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
  
  // 选择会话
  const selectConversation = useCallback(async (conversationId: string) => {
    try {
      setError(null);
      
      // 从当前会话列表中找到选中的会话
      const currentConversations = getStoreState().conversations;
      const conversation = currentConversations.find(conv => conv.id === conversationId);
      
      if (conversation) {
        setCurrentConversation(conversation);
        // 加载会话消息
        await loadMessages(conversationId);
      } else {
        setError('会话不存在');
        toast.error('会话不存在');
      }
    } catch (error) {
      console.error('Failed to select conversation:', error);
      setError('选择会话失败');
      toast.error('选择会话失败');
    }
  }, [setCurrentConversation, loadMessages, setError, getStoreState]);

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
  
  // 更新函数refs来避免useEffect循环依赖
  useEffect(() => {
    startPollingRef.current = startPolling;
    stopPollingRef.current = stopPolling;
    loadOnlineUsersRef.current = loadOnlineUsers;
    startOnlineStatusSyncRef.current = startOnlineStatusSync;
    stopOnlineStatusSyncRef.current = stopOnlineStatusSync;
  }, [startPolling, stopPolling, loadOnlineUsers, startOnlineStatusSync, stopOnlineStatusSync]);
  
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
    selectConversation,
    sendMessage,
    sendFile,
    uploadFile,
    loadOnlineUsers,
    createPrivateConversation,
    loadProjectMembers,
    searchUsers,
    getUnreadCount,
    
    // 设置状态
    setCurrentUser,
    setCurrentProject,
    setCurrentConversation,
    setChatType,
    setSearchTerm,
    
    // WebSocket和轮询控制
    reconnect,
    startPolling,
    stopPolling,
    
    // 清理函数
    cleanup: () => {
      stopPolling();
      stopOnlineStatusSync();
      reset();
    }
  };
};