import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useMemo, useCallback } from 'react';

// 消息类型
export interface Message {
  id: string;
  content: string;
  type:
    | 'text'
    | 'image'
    | 'file'
    | 'voice'
    | 'video'
    | 'system'
    | 'announcement';
  sender: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isOwn: boolean;
  conversationId: string;
  replyTo?: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string;
      avatar?: string;
    };
    type: string;
  };
  mentions?: Array<{
    id: string;
    name: string;
    type: 'user' | 'all';
  }>;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    thumbnail?: string;
  }>;
  reactions?: Array<{
    emoji: string;
    count: number;
    users: Array<{ id: string; name: string }>;
    hasReacted: boolean;
  }>;
  isPinned?: boolean;
  isEdited?: boolean;
  editedAt?: Date;
  isForwarded?: boolean;
  forwardedFrom?: {
    conversationId: string;
    conversationName: string;
    originalSender: {
      id: string;
      name: string;
    };
  };
}

// 会话类型
export interface Conversation {
  id: string;
  type: 'private' | 'group' | 'system' | 'project';
  name: string;
  avatar?: string;
  description?: string;
  lastMessage?: {
    content: string;
    timestamp: Date;
    sender?: { id: string; name: string };
    type: string;
  };
  unreadCount: number;
  isOnline?: boolean;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  participants?: Array<{
    id: string;
    name: string;
    avatar?: string;
    role?: string;
    isOnline?: boolean;
    lastSeen?: Date;
  }>;
  projectId?: string;
  lastActivity: Date;
  createdAt?: Date;
  createdBy?: {
    id: string;
    name: string;
  };
  settings?: {
    allowInvites: boolean;
    allowFileSharing: boolean;
    allowVoiceCalls: boolean;
    allowVideoCalls: boolean;
    messageRetention: number; // 天数
  };
}

// 通知设置
export interface NotificationSettings {
  browserNotifications: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  vibrationEnabled: boolean;
  showPreview: boolean;
  showSender: boolean;
  doNotDisturb: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    weekdays: boolean[];
  };
  projectNotifications: {
    [projectId: string]: {
      enabled: boolean;
      types: string[];
      priority: 'all' | 'high' | 'urgent';
    };
  };
}

// 用户状态
export interface UserStatus {
  id: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  customMessage?: string;
}

// 输入状态
export interface TypingStatus {
  conversationId: string;
  userId: string;
  userName: string;
  timestamp: Date;
}

// 连接状态
export type ConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'reconnecting';

// Store状态接口
interface MessageState {
  // 基础数据
  conversations: Conversation[];
  messages: { [conversationId: string]: Message[] };
  currentUserId: string;
  selectedConversationId: string | null;

  // 连接状态
  connectionStatus: ConnectionStatus;
  lastConnectedAt: Date | null;
  reconnectAttempts: number;

  // 用户状态
  userStatuses: { [userId: string]: UserStatus };
  typingStatuses: TypingStatus[];

  // 通知设置
  notificationSettings: NotificationSettings;

  // UI状态
  isLoading: boolean;
  searchQuery: string;
  activeFilter: 'all' | 'unread' | 'private' | 'group' | 'system' | 'project';
  showArchived: boolean;

  // 草稿
  drafts: { [conversationId: string]: string };

  // 未读计数
  totalUnreadCount: number;
  unreadByType: {
    private: number;
    group: number;
    system: number;
    project: number;
  };
}

// Store动作接口
interface MessageActions {
  // 会话管理
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  removeConversation: (id: string) => void;
  selectConversation: (id: string | null) => void;

  // 消息管理
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (
    conversationId: string,
    messageId: string,
    updates: Partial<Message>
  ) => void;
  removeMessage: (conversationId: string, messageId: string) => void;
  markMessageAsRead: (conversationId: string, messageId: string) => void;
  markConversationAsRead: (conversationId: string) => void;

  // 连接管理
  setConnectionStatus: (status: ConnectionStatus) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;

  // 用户状态
  setUserStatus: (userId: string, status: UserStatus) => void;
  setUserStatuses: (statuses: { [userId: string]: UserStatus }) => void;

  // 输入状态
  setTypingStatus: (
    conversationId: string,
    userId: string,
    userName: string,
    isTyping: boolean
  ) => void;
  clearTypingStatus: (conversationId: string, userId?: string) => void;

  // 通知设置
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;

  // UI状态
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setActiveFilter: (filter: MessageState['activeFilter']) => void;
  setShowArchived: (show: boolean) => void;

  // 草稿管理
  saveDraft: (conversationId: string, content: string) => void;
  clearDraft: (conversationId: string) => void;

  // 重置
  reset: () => void;
}

type MessageStore = MessageState & MessageActions;

// 默认通知设置
const defaultNotificationSettings: NotificationSettings = {
  browserNotifications: true,
  soundEnabled: true,
  soundVolume: 0.7,
  vibrationEnabled: true,
  showPreview: true,
  showSender: true,
  doNotDisturb: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
    weekdays: [true, true, true, true, true, false, false]
  },
  projectNotifications: {}
};

// 初始状态
const initialState: MessageState = {
  conversations: [],
  messages: {},
  currentUserId: '',
  selectedConversationId: null,
  connectionStatus: 'disconnected',
  lastConnectedAt: null,
  reconnectAttempts: 0,
  userStatuses: {},
  typingStatuses: [],
  notificationSettings: defaultNotificationSettings,
  isLoading: false,
  searchQuery: '',
  activeFilter: 'all',
  showArchived: false,
  drafts: {},
  totalUnreadCount: 0,
  unreadByType: {
    private: 0,
    group: 0,
    system: 0,
    project: 0
  }
};

// 辅助函数：计算未读计数
const calculateUnreadCounts = (conversations: Conversation[]) => {
  const counts = {
    private: 0,
    group: 0,
    system: 0,
    project: 0
  };

  let total = 0;

  conversations.forEach((conversation) => {
    if (!conversation.isArchived && conversation.unreadCount > 0) {
      counts[conversation.type] += conversation.unreadCount;
      total += conversation.unreadCount;
    }
  });

  return { counts, total };
};

// 辅助函数：更新未读计数（只在需要时更新）
const updateUnreadCounts = (state: any) => {
  const { counts, total } = calculateUnreadCounts(state.conversations);

  // 只有当计数真正改变时才更新
  const hasChanged =
    state.totalUnreadCount !== total ||
    state.unreadByType.private !== counts.private ||
    state.unreadByType.group !== counts.group ||
    state.unreadByType.system !== counts.system ||
    state.unreadByType.project !== counts.project;

  if (hasChanged) {
    state.unreadByType = counts;
    state.totalUnreadCount = total;
  }
};

export const useMessageStore = create<MessageStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        immer((set, get) => ({
          ...initialState,

          // 会话管理
          setConversations: (conversations) => {
            set((state) => {
              state.conversations = conversations;
              updateUnreadCounts(state);
            });
          },

          addConversation: (conversation) => {
            set((state) => {
              const existingIndex = state.conversations.findIndex(
                (c) => c.id === conversation.id
              );
              if (existingIndex >= 0) {
                state.conversations[existingIndex] = conversation;
              } else {
                state.conversations.unshift(conversation);
              }

              updateUnreadCounts(state);
            });
          },

          updateConversation: (id, updates) => {
            set((state) => {
              const conversation = state.conversations.find((c) => c.id === id);
              if (conversation) {
                Object.assign(conversation, updates);
              }

              updateUnreadCounts(state);
            });
          },

          removeConversation: (id) => {
            set((state) => {
              state.conversations = state.conversations.filter(
                (c) => c.id !== id
              );
              delete state.messages[id];
              delete state.drafts[id];
              if (state.selectedConversationId === id) {
                state.selectedConversationId = null;
              }

              updateUnreadCounts(state);
            });
          },

          selectConversation: (id) => {
            set((state) => {
              state.selectedConversationId = id;
            });
          },

          // 消息管理
          setMessages: (conversationId, messages) => {
            set((state) => {
              state.messages[conversationId] = messages;
            });
          },

          addMessage: (message) => {
            set((state) => {
              if (!state.messages[message.conversationId]) {
                state.messages[message.conversationId] = [];
              }
              state.messages[message.conversationId].push(message);

              // 更新会话的最后消息
              const conversation = state.conversations.find(
                (c) => c.id === message.conversationId
              );
              if (conversation) {
                conversation.lastMessage = {
                  content: message.content,
                  timestamp: message.timestamp,
                  sender: message.sender,
                  type: message.type
                };
                conversation.lastActivity = message.timestamp;

                // 如果不是自己发送的消息，增加未读计数
                if (
                  !message.isOwn &&
                  message.conversationId !== state.selectedConversationId
                ) {
                  conversation.unreadCount++;
                }
              }

              updateUnreadCounts(state);
            });
          },

          updateMessage: (conversationId, messageId, updates) => {
            set((state) => {
              const messages = state.messages[conversationId];
              if (messages) {
                const message = messages.find((m) => m.id === messageId);
                if (message) {
                  Object.assign(message, updates);
                }
              }
            });
          },

          removeMessage: (conversationId, messageId) => {
            set((state) => {
              const messages = state.messages[conversationId];
              if (messages) {
                state.messages[conversationId] = messages.filter(
                  (m) => m.id !== messageId
                );
              }
            });
          },

          markMessageAsRead: (conversationId, messageId) => {
            set((state) => {
              const messages = state.messages[conversationId];
              if (messages) {
                const message = messages.find((m) => m.id === messageId);
                if (message && !message.isOwn) {
                  message.status = 'read';
                }
              }
            });
          },

          markConversationAsRead: (conversationId) => {
            set((state) => {
              const conversation = state.conversations.find(
                (c) => c.id === conversationId
              );
              if (conversation) {
                conversation.unreadCount = 0;
              }

              // 标记所有消息为已读
              const messages = state.messages[conversationId];
              if (messages) {
                messages.forEach((message) => {
                  if (!message.isOwn && message.status !== 'read') {
                    message.status = 'read';
                  }
                });
              }

              updateUnreadCounts(state);
            });
          },

          // 连接管理
          setConnectionStatus: (status) => {
            set((state) => {
              state.connectionStatus = status;
              if (status === 'connected') {
                state.lastConnectedAt = new Date();
                state.reconnectAttempts = 0;
              }
            });
          },

          incrementReconnectAttempts: () => {
            set((state) => {
              state.reconnectAttempts++;
            });
          },

          resetReconnectAttempts: () => {
            set((state) => {
              state.reconnectAttempts = 0;
            });
          },

          // 用户状态
          setUserStatus: (userId, status) => {
            set((state) => {
              state.userStatuses[userId] = status;
            });
          },

          setUserStatuses: (statuses) => {
            set((state) => {
              state.userStatuses = statuses;
            });
          },

          // 输入状态
          setTypingStatus: (conversationId, userId, userName, isTyping) => {
            set((state) => {
              if (isTyping) {
                const existingIndex = state.typingStatuses.findIndex(
                  (t) =>
                    t.conversationId === conversationId && t.userId === userId
                );

                const typingStatus: TypingStatus = {
                  conversationId,
                  userId,
                  userName,
                  timestamp: new Date()
                };

                if (existingIndex >= 0) {
                  state.typingStatuses[existingIndex] = typingStatus;
                } else {
                  state.typingStatuses.push(typingStatus);
                }
              } else {
                state.typingStatuses = state.typingStatuses.filter(
                  (t) =>
                    !(
                      t.conversationId === conversationId && t.userId === userId
                    )
                );
              }
            });
          },

          clearTypingStatus: (conversationId, userId) => {
            set((state) => {
              if (userId) {
                state.typingStatuses = state.typingStatuses.filter(
                  (t) =>
                    !(
                      t.conversationId === conversationId && t.userId === userId
                    )
                );
              } else {
                state.typingStatuses = state.typingStatuses.filter(
                  (t) => t.conversationId !== conversationId
                );
              }
            });
          },

          // 通知设置
          updateNotificationSettings: (settings) => {
            set((state) => {
              Object.assign(state.notificationSettings, settings);
            });
          },

          // UI状态
          setLoading: (loading) => {
            set((state) => {
              state.isLoading = loading;
            });
          },

          setSearchQuery: (query) => {
            set((state) => {
              state.searchQuery = query;
            });
          },

          setActiveFilter: (filter) => {
            set((state) => {
              state.activeFilter = filter;
            });
          },

          setShowArchived: (show) => {
            set((state) => {
              state.showArchived = show;
            });
          },

          // 草稿管理
          saveDraft: (conversationId, content) => {
            set((state) => {
              if (content.trim()) {
                state.drafts[conversationId] = content;
              } else {
                delete state.drafts[conversationId];
              }
            });
          },

          clearDraft: (conversationId) => {
            set((state) => {
              delete state.drafts[conversationId];
            });
          },

          // 重置
          reset: () => {
            set(() => initialState);
          }
        })),
        {
          name: 'message-store',
          partialize: (state) => ({
            notificationSettings: state.notificationSettings,
            drafts: state.drafts,
            activeFilter: state.activeFilter,
            showArchived: state.showArchived
          }),
          skipHydration: true
        }
      )
    ),
    {
      name: 'message-store'
    }
  )
);

// 选择器
export const useConversations = () => {
  const selector = useMemo(
    () => (state: MessageStore) => state.conversations,
    []
  );
  return useMessageStore(selector);
};

export const useSelectedConversation = () => {
  const selector = useMemo(
    () => (state: MessageStore) => {
      const selectedId = state.selectedConversationId;
      return selectedId
        ? state.conversations.find((c) => c.id === selectedId) || null
        : null;
    },
    []
  );
  return useMessageStore(selector);
};

export const useMessages = (conversationId: string) => {
  const selector = useMemo(
    () => (state: MessageStore) => state.messages[conversationId] || [],
    [conversationId]
  );
  return useMessageStore(selector);
};

export const useConnectionStatus = () => {
  const selector = useMemo(
    () => (state: MessageStore) => state.connectionStatus,
    []
  );
  return useMessageStore(selector);
};

export const useUnreadCounts = () => {
  const selector = useCallback(
    (state: MessageStore) => ({
      total: state.totalUnreadCount,
      byType: state.unreadByType
    }),
    []
  );
  return useMessageStore(selector);
};

export const useTypingUsers = (conversationId: string) => {
  const selector = useMemo(
    () => (state: MessageStore) =>
      state.typingStatuses
        .filter((t) => t.conversationId === conversationId)
        .map((t) => ({ id: t.userId, name: t.userName })),
    [conversationId]
  );
  return useMessageStore(selector);
};

export const useDraft = (conversationId: string) => {
  const selector = useMemo(
    () => (state: MessageStore) => state.drafts[conversationId] || '',
    [conversationId]
  );
  return useMessageStore(selector);
};

export const useNotificationSettings = () => {
  const selector = useMemo(
    () => (state: MessageStore) => state.notificationSettings,
    []
  );
  return useMessageStore(selector);
};
