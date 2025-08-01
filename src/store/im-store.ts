import { create } from 'zustand';
import { WebSocketMessage } from '@/hooks/useWebSocket';

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
    messageType: 'text' | 'image' | 'file';
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
  chatType: 'project' | 'private';
  searchTerm: string;
  isTyping: { [conversationId: string]: string[] }; // 正在输入的用户列表
  
  // 加载状态
  loading: {
    projects: boolean;
    conversations: boolean;
    messages: boolean;
    sending: boolean;
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
  setChatType: (type: 'project' | 'private') => void;
  setSearchTerm: (term: string) => void;
  setTyping: (conversationId: string, userIds: string[]) => void;
  
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
  loading: {
    projects: false,
    conversations: false,
    messages: false,
    sending: false,
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
  
  setConversations: (conversations) => set({ conversations }),
  
  setCurrentConversation: (conversation) => set({ 
    currentConversation: conversation,
    messages: [] // 清空消息列表，等待加载新的消息
  }),
  
  addConversation: (conversation) => set(state => ({
    conversations: [conversation, ...state.conversations]
  })),
  
  updateConversation: (conversationId, updates) => set(state => ({
    conversations: state.conversations.map(conv => 
      conv.id === conversationId ? { ...conv, ...updates } : conv
    )
  })),
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set(state => {
    // 避免重复添加消息
    const exists = state.messages.some(m => m.id === message.id);
    if (exists) return state;
    
    const newMessages = [...state.messages, message];
    
    // 更新对应会话的最后消息
    const updatedConversations = state.conversations.map(conv => {
      if (conv.id === message.conversationId) {
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
          unreadCount: state.currentUser?.id === message.senderId ? 
            conv.unreadCount : conv.unreadCount + 1,
          updatedAt: message.createdAt
        };
      }
      return conv;
    });
    
    return {
      messages: newMessages,
      conversations: updatedConversations
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
  
  updateUserStatus: (userId, status) => set(state => ({
    onlineUsers: state.onlineUsers.map(user => 
      user.id === userId ? { ...user, status } : user
    ),
    // 同时更新会话中的参与者状态
    conversations: state.conversations.map(conv => ({
      ...conv,
      participants: conv.participants.map(p => 
        p.id === userId ? { ...p, status } : p
      )
    }))
  })),
  
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
  
  handleWebSocketMessage: (message) => {
    const state = get();
    
    switch (message.type) {
      case 'message':
        if (message.data.conversationId && message.data.content) {
          // 这里需要根据实际的WebSocket消息格式来构造Message对象
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
          
          get().addMessage(newMessage);
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