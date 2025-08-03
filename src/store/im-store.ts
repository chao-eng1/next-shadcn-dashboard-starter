import { create } from 'zustand';
import { WebSocketMessage } from '@/hooks/useWebSocket';
import { notificationService } from '@/lib/notification-service';

// 数据类型定义
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: string;
}

export interface Conversation {
  id: string;
  type: 'project' | 'private';
  projectId?: string;
  participants: User[];
  name: string;
  description?: string;
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    timestamp: string;
    messageType: 'text' | 'image' | 'file' | 'system';
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string; // 发送者姓名
  senderImage?: string; // 发送者头像
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyToId?: string;
  replyTo?: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
  };
  status: 'sending' | 'sent' | 'delivered' | 'read';
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  members: User[];
  createdAt: string;
}

interface IMState {
  // 用户信息
  currentUser: User | null;
  
  // WebSocket连接状态
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  
  // 当前选中的项目和会话
  currentProject: Project | null;
  currentConversation: Conversation | null;
  
  // 数据列表
  projects: Project[];
  conversations: Conversation[];
  messages: Message[];
  onlineUsers: User[];
  
  // UI状态
  chatType: 'project' | 'private' | 'system';
  searchTerm: string;
  isTyping: { [conversationId: string]: string[] }; // 正在输入的用户列表
  
  // 未读消息计数
  totalUnreadCount: number;
  conversationUnreadCounts: { [conversationId: string]: number };
  
  // 加载状态
  loading: {
    projects: boolean;
    conversations: boolean;
    messages: boolean;
    sending: boolean;
    members: boolean;
  };
  
  // 错误状态
  error: string | null;
  
  // Actions
  setCurrentUser: (user: User) => void;
  setConnectionStatus: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  setIsConnected: (connected: boolean) => void;
  
  // 项目相关
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  
  // 会话相关
  setConversations: (conversations: Conversation[]) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
  
  // 消息相关
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  updateMessageStatus: (messageId: string, status: Message['status']) => void;
  
  // 在线用户
  setOnlineUsers: (users: User[]) => void;
  updateUserStatus: (userId: string, status: User['status']) => void;
  
  // UI状态
  setChatType: (type: 'project' | 'private' | 'system') => void;
  setSearchTerm: (term: string) => void;
  setTyping: (conversationId: string, userIds: string[]) => void;
  
  // 未读消息计数
  updateUnreadCount: (conversationId: string, count: number) => void;
  incrementUnreadCount: (conversationId: string) => void;
  clearUnreadCount: (conversationId: string) => void;
  getTotalUnreadCount: () => number;
  
  // 通知相关方法
  updateTotalUnreadCount: () => void;
  triggerMessageNotification: (message: Message, conversation?: Conversation) => void;
  
  // 加载状态
  setLoading: (key: keyof IMState['loading'], loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // WebSocket消息处理
  handleWebSocketMessage: (message: WebSocketMessage) => void;
  
  // 清理函数
  reset: () => void;
}

const initialState = {
  currentUser: null,
  isConnected: false,
  connectionStatus: 'disconnected' as const,
  currentProject: null,
  currentConversation: null,
  projects: [],
  conversations: [],
  messages: [],
  onlineUsers: [],
  chatType: 'project' as const,
  searchTerm: '',
  isTyping: {},
  totalUnreadCount: 0,
  conversationUnreadCounts: {},
  loading: {
    projects: false,
    conversations: false,
    messages: false,
    sending: false,
    members: false,
  },
  error: null,
};

export const useIMStore = create<IMState>((set, get) => ({
  ...initialState,
  
  setCurrentUser: (user) => set({ currentUser: user }),
  
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  
  setIsConnected: (connected) => set({ isConnected: connected }),
  
  setProjects: (projects) => set({ projects: Array.isArray(projects) ? projects : [] }),
  
  setCurrentProject: (project) => set({ currentProject: project }),
  
  setConversations: (conversations) => set(state => {
    // 从会话列表中提取未读计数
    const newConversationUnreadCounts: { [conversationId: string]: number } = {};
    let newTotalUnreadCount = 0;
    
    conversations.forEach(conv => {
      if (conv.unreadCount > 0) {
        newConversationUnreadCounts[conv.id] = conv.unreadCount;
        newTotalUnreadCount += conv.unreadCount;
      }
    });
    
    // 更新浏览器标题栏
    notificationService.updateTitleWithUnreadCount(newTotalUnreadCount);
    
    return {
      conversations,
      conversationUnreadCounts: newConversationUnreadCounts,
      totalUnreadCount: newTotalUnreadCount
    };
  }),
  
  setCurrentConversation: (conversation) => set(state => {
    // 直接在这里清除当前会话的未读计数，避免调用其他setter
    let updatedConversations = state.conversations;
    let newConversationUnreadCounts = { ...state.conversationUnreadCounts };
    let newTotalUnreadCount = state.totalUnreadCount;
    
    if (conversation) {
      // 清除该会话的未读计数
      updatedConversations = state.conversations.map(conv => 
        conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
      );
      
      // 移除该会话的未读计数
      if (newConversationUnreadCounts[conversation.id]) {
        delete newConversationUnreadCounts[conversation.id];
        // 重新计算总未读计数
        newTotalUnreadCount = Object.values(newConversationUnreadCounts).reduce((sum, count) => sum + count, 0);
        
        // 更新浏览器标题栏
        notificationService.updateTitleWithUnreadCount(newTotalUnreadCount);
      }
    }
    
    return { 
      currentConversation: conversation,
      messages: [], // 清空消息列表，等待加载新的消息
      conversations: updatedConversations,
      conversationUnreadCounts: newConversationUnreadCounts,
      totalUnreadCount: newTotalUnreadCount
    };
  }),
  
  addConversation: (conversation) => set(state => {
    const updatedConversations = [conversation, ...state.conversations];
    
    // 重新计算总未读计数和各会话未读计数
    const newConversationUnreadCounts: { [conversationId: string]: number } = {};
    let newTotalUnreadCount = 0;
    
    updatedConversations.forEach(conv => {
      if (conv.unreadCount > 0) {
        newConversationUnreadCounts[conv.id] = conv.unreadCount;
        newTotalUnreadCount += conv.unreadCount;
      }
    });
    
    // 更新浏览器标题栏
    notificationService.updateTitleWithUnreadCount(newTotalUnreadCount);
    
    return {
      conversations: updatedConversations,
      conversationUnreadCounts: newConversationUnreadCounts,
      totalUnreadCount: newTotalUnreadCount
    };
  }),
  
  updateConversation: (conversationId, updates) => set(state => {
    const updatedConversations = state.conversations.map(conv => 
      conv.id === conversationId ? { ...conv, ...updates } : conv
    );
    
    // 重新计算总未读计数和各会话未读计数
    const newConversationUnreadCounts: { [conversationId: string]: number } = {};
    let newTotalUnreadCount = 0;
    
    updatedConversations.forEach(conv => {
      if (conv.unreadCount > 0) {
        newConversationUnreadCounts[conv.id] = conv.unreadCount;
        newTotalUnreadCount += conv.unreadCount;
      }
    });
    
    // 更新浏览器标题栏
    notificationService.updateTitleWithUnreadCount(newTotalUnreadCount);
    
    return {
      conversations: updatedConversations,
      conversationUnreadCounts: newConversationUnreadCounts,
      totalUnreadCount: newTotalUnreadCount
    };
  }),
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set(state => {
    // 避免重复添加消息
    const exists = state.messages.some(m => m.id === message.id);
    if (exists) return state;
    
    const newMessages = [...state.messages, message];
    
    // 更新对应会话的最后消息
    const updatedConversations = state.conversations.map(conv => {
      if (conv.id === message.conversationId) {
        // 只有当消息不是来自当前用户并且不在当前会话中时才增加未读计数
        const shouldIncrement = state.currentUser?.id !== message.senderId && 
                                state.currentConversation?.id !== message.conversationId;
        
        return {
          ...conv,
          lastMessage: {
            id: message.id,
            content: message.content,
            senderId: message.senderId,
            senderName: state.currentUser?.id === message.senderId ? 
              state.currentUser.name : 
              conv.participants.find(p => p.id === message.senderId)?.name || 'Unknown',
            timestamp: message.createdAt,
            messageType: message.messageType
          },
          unreadCount: shouldIncrement ? conv.unreadCount + 1 : conv.unreadCount,
          updatedAt: message.createdAt
        };
      }
      return conv;
    });
    
    // 重新计算总未读计数和各会话未读计数
    const newConversationUnreadCounts: { [conversationId: string]: number } = {};
    let newTotalUnreadCount = 0;
    
    updatedConversations.forEach(conv => {
      if (conv.unreadCount > 0) {
        newConversationUnreadCounts[conv.id] = conv.unreadCount;
        newTotalUnreadCount += conv.unreadCount;
      }
    });
    
    // 更新浏览器标题栏
    notificationService.updateTitleWithUnreadCount(newTotalUnreadCount);
    
    return {
      messages: newMessages,
      conversations: updatedConversations,
      conversationUnreadCounts: newConversationUnreadCounts,
      totalUnreadCount: newTotalUnreadCount
    };
  }),
  
  updateMessage: (messageId, updates) => set(state => ({
    messages: state.messages.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    )
  })),
  
  updateMessageStatus: (messageId, status) => set(state => ({
    messages: state.messages.map(msg => 
      msg.id === messageId ? { ...msg, status } : msg
    )
  })),
  
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  
  updateUserStatus: (userId, status) => set(state => {
    // 更新在线用户列表
    const updatedOnlineUsers = state.onlineUsers.map(user => 
      user.id === userId ? { ...user, status } : user
    );
    
    // 如果用户不在在线列表中但状态是在线，添加到在线列表
    const userExists = state.onlineUsers.some(user => user.id === userId);
    if (!userExists && status === 'online') {
      // 可以从会话参与者中找到用户信息并添加到在线列表
      const userFromConversations = state.conversations
        .flatMap(conv => conv.participants)
        .find(p => p.id === userId);
      
      if (userFromConversations) {
        updatedOnlineUsers.push({ ...userFromConversations, status });
      }
    } else if (userExists && status === 'offline') {
      // 如果用户离线，从在线列表中移除
      const filteredOnlineUsers = updatedOnlineUsers.filter(user => user.id !== userId);
      return {
        onlineUsers: filteredOnlineUsers,
        // 同时更新会话中的参与者状态
        conversations: state.conversations.map(conv => ({
          ...conv,
          participants: conv.participants.map(p => 
            p.id === userId ? { ...p, status } : p
          )
        })),
        // 更新当前会话参与者状态（如果当前会话包含该用户）
        currentConversation: state.currentConversation ? {
          ...state.currentConversation,
          participants: state.currentConversation.participants.map(p => 
            p.id === userId ? { ...p, status } : p
          )
        } : state.currentConversation
      };
    }
    
    return {
      onlineUsers: updatedOnlineUsers,
      // 同时更新会话中的参与者状态
      conversations: state.conversations.map(conv => ({
        ...conv,
        participants: conv.participants.map(p => 
          p.id === userId ? { ...p, status } : p
        )
      })),
      // 更新当前会话参与者状态（如果当前会话包含该用户）
      currentConversation: state.currentConversation ? {
        ...state.currentConversation,
        participants: state.currentConversation.participants.map(p => 
          p.id === userId ? { ...p, status } : p
        )
      } : state.currentConversation
    };
  }),
  
  setChatType: (type) => set({ chatType: type }),
  
  setSearchTerm: (term) => set({ searchTerm: term }),
  
  setTyping: (conversationId, userIds) => set(state => ({
    isTyping: {
      ...state.isTyping,
      [conversationId]: userIds
    }
  })),
  
  setLoading: (key, loading) => set(state => ({
    loading: {
      ...state.loading,
      [key]: loading
    }
  })),
  
  setError: (error) => set({ error }),
  
  // 未读消息计数方法
  updateUnreadCount: (conversationId, count) => set(state => {
    const newCounts = { ...state.conversationUnreadCounts, [conversationId]: count };
    const totalCount = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
    
    // 更新浏览器标题栏
    notificationService.updateTitleWithUnreadCount(totalCount);
    
    return {
      conversationUnreadCounts: newCounts,
      totalUnreadCount: totalCount
    };
  }),
  
  incrementUnreadCount: (conversationId) => set(state => {
    const currentCount = state.conversationUnreadCounts[conversationId] || 0;
    const newCounts = { ...state.conversationUnreadCounts, [conversationId]: currentCount + 1 };
    const totalCount = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
    
    // 更新浏览器标题栏
    notificationService.updateTitleWithUnreadCount(totalCount);
    
    return {
      conversationUnreadCounts: newCounts,
      totalUnreadCount: totalCount
    };
  }),
  
  clearUnreadCount: (conversationId) => set(state => {
    const newCounts = { ...state.conversationUnreadCounts };
    delete newCounts[conversationId];
    const totalCount = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
    
    // 更新浏览器标题栏
    notificationService.updateTitleWithUnreadCount(totalCount);
    
    return {
      conversationUnreadCounts: newCounts,
      totalUnreadCount: totalCount
    };
  }),
  
  getTotalUnreadCount: () => get().totalUnreadCount,
  
  updateTotalUnreadCount: () => set(state => {
    const totalCount = Object.values(state.conversationUnreadCounts).reduce((sum, count) => sum + count, 0);
    notificationService.updateTitleWithUnreadCount(totalCount);
    return { totalUnreadCount: totalCount };
  }),
  
  triggerMessageNotification: async (message, conversation) => {
    const state = get();
    
    // 检查是否是自己发送的消息
    if (message.senderId === state.currentUser?.id) {
      return;
    }
    
    // 检查是否在当前会话中（如果在当前会话中，不显示通知）
    if (state.currentConversation?.id === message.conversationId) {
      return;
    }
    
    // 找到会话信息
    const targetConversation = conversation || state.conversations.find(conv => conv.id === message.conversationId);
    if (!targetConversation) {
      return;
    }
    
    // 根据会话类型触发不同的通知
    if (targetConversation.type === 'private') {
      await notificationService.showPrivateMessageNotification({
        senderName: message.senderName || 'Unknown',
        senderImage: message.senderImage,
        message: message.content,
        conversationId: message.conversationId,
        onNotificationClick: () => {
          // 切换到该会话（会自动清除未读计数）
          get().setCurrentConversation(targetConversation);
          get().setChatType('private');
        }
      });
    } else if (targetConversation.type === 'project') {
      // 找到项目信息
      const project = state.projects.find(p => p.id === targetConversation.projectId);
      await notificationService.showProjectMessageNotification({
        senderName: message.senderName || 'Unknown',
        senderImage: message.senderImage,
        message: message.content,
        projectName: project?.name || targetConversation.name,
        conversationId: message.conversationId,
        onNotificationClick: () => {
          // 切换到该会话（会自动清除未读计数）
          get().setCurrentConversation(targetConversation);
          get().setChatType('project');
        }
      });
    }
  },
  
  handleWebSocketMessage: (message) => {
    const state = get();
    
    switch (message.type) {
      case 'message':
        if (message.data.conversationId && message.data.content) {
          // 检查消息是否来自当前用户，避免重复添加自己发送的消息
          const isOwnMessage = message.data.senderId === state.currentUser?.id;
          
          // 构造新消息对象
          const newMessage: Message = {
            id: message.data.messageId || Date.now().toString(),
            conversationId: message.data.conversationId,
            senderId: message.data.senderId || '',
            senderName: message.data.senderName || 'Unknown',
            senderImage: message.data.senderImage,
            content: message.data.content,
            messageType: message.data.messageType || 'text',
            status: 'delivered',
            createdAt: message.data.timestamp || new Date().toISOString(),
            updatedAt: message.data.timestamp || new Date().toISOString()
          };
          
          // 如果不是自己发送的消息，或者当前会话就是消息所在的会话，则添加消息
          if (!isOwnMessage || state.currentConversation?.id === message.data.conversationId) {
            get().addMessage(newMessage);
            
            // 如果是其他人发送的消息，触发通知
            if (!isOwnMessage) {
              // 注意：未读计数已经在addMessage中处理了，这里只需要触发通知
              get().triggerMessageNotification(newMessage);
            }
          }
        }
        break;
        
      case 'typing':
        if (message.data.conversationId && message.data.userId) {
          const currentTyping = state.isTyping[message.data.conversationId] || [];
          if (!currentTyping.includes(message.data.userId)) {
            get().setTyping(message.data.conversationId, [...currentTyping, message.data.userId]);
          }
        }
        break;
        
      case 'read':
        if (message.data.messageId) {
          get().updateMessageStatus(message.data.messageId, 'read');
        }
        break;
        
      case 'user_status':
        if (message.data.userId && message.data.status) {
          get().updateUserStatus(message.data.userId, message.data.status);
        }
        break;
        
      case 'error':
        get().setError(message.data.content || '发生未知错误');
        break;
        
      default:
        console.log('Unhandled WebSocket message type:', message.type);
    }
  },
  
  reset: () => set(initialState)
}));