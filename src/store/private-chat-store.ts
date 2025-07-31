import { create } from 'zustand';
import { 
  PrivateConversation, 
  PrivateMessage, 
  ProjectMember,
  getPrivateConversations,
  createPrivateConversation,
  getPrivateMessages,
  sendPrivateMessage,
  getProjectMembers
} from '@/lib/api/private-chat';

interface PrivateChatState {
  // 当前选中的项目ID
  currentProjectId: string | null;
  
  // 私聊会话列表
  conversations: PrivateConversation[];
  
  // 当前选中的会话
  selectedConversation: PrivateConversation | null;
  
  // 当前会话的消息列表
  messages: PrivateMessage[];
  
  // 项目成员列表
  projectMembers: ProjectMember[];
  
  // 加载状态
  loading: {
    conversations: boolean;
    messages: boolean;
    members: boolean;
    sending: boolean;
  };
  
  // 错误状态
  error: string | null;
  
  // Actions
  setCurrentProject: (projectId: string) => void;
  loadConversations: (projectId: string) => Promise<void>;
  selectConversation: (conversation: PrivateConversation) => void;
  loadMessages: (projectId: string, conversationId: string) => Promise<void>;
  sendMessage: (projectId: string, conversationId: string, content: string, replyToId?: string) => Promise<void>;
  loadProjectMembers: (projectId: string, search?: string) => Promise<void>;
  startPrivateChat: (projectId: string, participantId: string) => Promise<void>;
  clearError: () => void;
  addMessage: (message: PrivateMessage) => void;
  updateConversationLastMessage: (conversationId: string, message: PrivateMessage) => void;
}

export const usePrivateChatStore = create<PrivateChatState>((set, get) => ({
  currentProjectId: null,
  conversations: [],
  selectedConversation: null,
  messages: [],
  projectMembers: [],
  loading: {
    conversations: false,
    messages: false,
    members: false,
    sending: false,
  },
  error: null,

  setCurrentProject: (projectId: string) => {
    set({ currentProjectId: projectId });
  },

  loadConversations: async (projectId: string) => {
    set(state => ({ 
      loading: { ...state.loading, conversations: true },
      error: null 
    }));
    
    try {
      const conversations = await getPrivateConversations(projectId);
      set({ 
        conversations,
        loading: { ...get().loading, conversations: false }
      });
    } catch (error) {
      set({ 
        error: '加载私聊会话失败',
        loading: { ...get().loading, conversations: false }
      });
    }
  },

  selectConversation: (conversation: PrivateConversation) => {
    set({ selectedConversation: conversation, messages: [] });
  },

  loadMessages: async (projectId: string, conversationId: string) => {
    set(state => ({ 
      loading: { ...state.loading, messages: true },
      error: null 
    }));
    
    try {
      const result = await getPrivateMessages(projectId, conversationId);
      set({ 
        messages: result.messages,
        loading: { ...get().loading, messages: false }
      });
    } catch (error) {
      set({ 
        error: '加载消息失败',
        loading: { ...get().loading, messages: false }
      });
    }
  },

  sendMessage: async (projectId: string, conversationId: string, content: string, replyToId?: string) => {
    set(state => ({ 
      loading: { ...state.loading, sending: true },
      error: null 
    }));
    
    try {
      const message = await sendPrivateMessage(projectId, conversationId, content, 'TEXT', replyToId);
      if (message) {
        // 添加消息到当前消息列表
        set(state => ({ 
          messages: [...state.messages, message],
          loading: { ...state.loading, sending: false }
        }));
        
        // 更新会话的最后消息
        get().updateConversationLastMessage(conversationId, message);
      } else {
        throw new Error('发送消息失败');
      }
    } catch (error) {
      set({ 
        error: '发送消息失败',
        loading: { ...get().loading, sending: false }
      });
    }
  },

  loadProjectMembers: async (projectId: string, search?: string) => {
    set(state => ({ 
      loading: { ...state.loading, members: true },
      error: null 
    }));
    
    try {
      const members = await getProjectMembers(projectId, search, true);
      set({ 
        projectMembers: members,
        loading: { ...get().loading, members: false }
      });
    } catch (error) {
      set({ 
        error: '加载项目成员失败',
        loading: { ...get().loading, members: false }
      });
    }
  },

  startPrivateChat: async (projectId: string, participantId: string) => {
    set({ error: null });
    
    try {
      const conversation = await createPrivateConversation(projectId, participantId);
      if (conversation) {
        // 检查会话是否已存在于列表中
        const existingIndex = get().conversations.findIndex(c => c.id === conversation.id);
        
        if (existingIndex >= 0) {
          // 会话已存在，选择它
          set({ selectedConversation: conversation });
        } else {
          // 新会话，添加到列表并选择
          set(state => ({ 
            conversations: [conversation, ...state.conversations],
            selectedConversation: conversation
          }));
        }
        
        // 加载消息
        await get().loadMessages(projectId, conversation.id);
      } else {
        throw new Error('创建私聊会话失败');
      }
    } catch (error) {
      set({ error: '开始私聊失败' });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  addMessage: (message: PrivateMessage) => {
    set(state => ({ 
      messages: [...state.messages, message]
    }));
  },

  updateConversationLastMessage: (conversationId: string, message: PrivateMessage) => {
    set(state => ({
      conversations: state.conversations.map(conv => 
        conv.id === conversationId 
          ? {
              ...conv,
              lastMessage: {
                content: message.content,
                sender: message.sender.name,
                timestamp: new Date(message.createdAt).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              }
            }
          : conv
      )
    }));
  },
}));