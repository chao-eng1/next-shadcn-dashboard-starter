import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  Message,
  Conversation,
  ChatSettings,
  ChatState,
  ChatActions
} from '@/types/chat';

const generateId = () => Math.random().toString(36).substr(2, 9);

const initialSettings: ChatSettings = {
  theme: 'auto',
  fontSize: 'medium',
  soundEnabled: true,
  notificationsEnabled: true,
  autoScroll: true,
  showTimestamps: true,
  compactMode: false
};

const getInitialWindowPosition = () => {
  if (typeof window === 'undefined') {
    return { x: 20, y: 20 };
  }
  return {
    x: window.innerWidth - 340,
    y: window.innerHeight - 470
  };
};

export const useChatStore = create<ChatState & ChatActions>()(
  devtools(
    persist(
      immer((set) => ({
        // 初始状态
        isVisible: false,
        isConnected: false,
        isLoading: false,
        isTyping: false,
        conversations: [],
        currentConversationId: null,
        messages: {},
        windowPosition: getInitialWindowPosition(),
        windowSize: { width: 320, height: 450 },
        triggerPosition: {
          x: window.innerWidth - 80,
          y: window.innerHeight - 80
        },
        unreadCount: 0,
        settings: initialSettings,

        // 基础操作
        toggleVisibility: () =>
          set((state) => {
            state.isVisible = !state.isVisible;
            if (state.isVisible) {
              state.unreadCount = 0;
            }
          }),

        setConnected: (connected) =>
          set((state) => {
            state.isConnected = connected;
          }),

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),

        setTyping: (typing) =>
          set((state) => {
            state.isTyping = typing;
          }),

        // 对话操作
        addConversation: (conversation) =>
          set((state) => {
            state.conversations.push(conversation);
            state.messages[conversation.id] = [];
          }),

        selectConversation: (id) =>
          set((state) => {
            state.currentConversationId = id;
          }),

        deleteConversation: (id) =>
          set((state) => {
            state.conversations = state.conversations.filter(
              (c) => c.id !== id
            );
            delete state.messages[id];
            if (state.currentConversationId === id) {
              state.currentConversationId = state.conversations[0]?.id || null;
            }
          }),

        updateConversation: (id, updates) =>
          set((state) => {
            const conversation = state.conversations.find((c) => c.id === id);
            if (conversation) {
              Object.assign(conversation, updates);
            }
          }),

        // 消息操作
        addMessage: (conversationId, message) =>
          set((state) => {
            if (!state.messages[conversationId]) {
              state.messages[conversationId] = [];
            }
            state.messages[conversationId].push(message);

            // 更新对话的最后更新时间
            const conversation = state.conversations.find(
              (c) => c.id === conversationId
            );
            if (conversation) {
              conversation.updatedAt = new Date();
              conversation.messageCount = state.messages[conversationId].length;
              conversation.lastMessage = message;
            }

            // 如果窗口不可见且是AI消息，增加未读计数
            if (!state.isVisible && message.role === 'assistant') {
              state.unreadCount += 1;
            }
          }),

        updateMessage: (conversationId, messageId, updates) =>
          set((state) => {
            const messages = state.messages[conversationId];
            if (messages) {
              const message = messages.find((m) => m.id === messageId);
              if (message) {
                Object.assign(message, updates);
              }
            }
          }),

        deleteMessage: (conversationId, messageId) =>
          set((state) => {
            const messages = state.messages[conversationId];
            if (messages) {
              state.messages[conversationId] = messages.filter(
                (m) => m.id !== messageId
              );
            }
          }),

        clearMessages: (conversationId) =>
          set((state) => {
            state.messages[conversationId] = [];
          }),

        // UI操作
        updateWindowPosition: (position) =>
          set((state) => {
            state.windowPosition = position;
          }),

        updateWindowSize: (size) =>
          set((state) => {
            state.windowSize = size;
          }),

        updateTriggerPosition: (position) =>
          set((state) => {
            state.triggerPosition = position;
          }),

        incrementUnreadCount: () =>
          set((state) => {
            state.unreadCount += 1;
          }),

        resetUnreadCount: () =>
          set((state) => {
            state.unreadCount = 0;
          }),

        // 设置操作
        updateSettings: (newSettings) =>
          set((state) => {
            Object.assign(state.settings, newSettings);
          }),

        // 新增缺少的方法
        isMaximized: false,
        toggleMaximized: () =>
          set((state) => {
            state.isMaximized = !state.isMaximized;
          }),

        createConversation: (title) => {
          const conversation = createConversation(title);
          set((state) => {
            state.conversations.push(conversation);
            state.messages[conversation.id] = [];
            state.currentConversationId = conversation.id;
          });
          return conversation.id;
        },

        setCurrentConversation: (id) =>
          set((state) => {
            state.currentConversationId = id;
          })
      })),
      {
        name: 'ai-chat-storage',
        partialize: (state) => ({
          conversations: state.conversations,
          messages: state.messages,
          windowPosition: state.windowPosition,
          windowSize: state.windowSize,
          triggerPosition: state.triggerPosition,
          settings: state.settings
        })
      }
    ),
    { name: 'ai-chat-store' }
  )
);

// 辅助函数
export const createConversation = (title: string = '新对话'): Conversation => ({
  id: generateId(),
  title,
  createdAt: new Date(),
  updatedAt: new Date(),
  messageCount: 0
});

export const createMessage = (
  content: string,
  role: 'user' | 'assistant' | 'system',
  conversationId: string
): Message => ({
  id: generateId(),
  content,
  role,
  timestamp: new Date(),
  conversationId,
  status: 'sent'
});

// 选择器
export const useCurrentConversation = () => {
  return useChatStore((state) => {
    if (!state.currentConversationId) return null;
    return (
      state.conversations.find((c) => c.id === state.currentConversationId) ||
      null
    );
  });
};

export const useCurrentMessages = () => {
  return useChatStore((state) => {
    if (!state.currentConversationId) return [];
    return state.messages[state.currentConversationId] || [];
  });
};

export const useConversationMessages = (conversationId: string) => {
  return useChatStore((state) => state.messages[conversationId] || []);
};
