'use client';

import { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { useMessageStore } from '@/store/message-store';
import {
  getWebSocketService,
  destroyWebSocketService
} from '@/lib/websocket-service';
import type { Message, Conversation } from '@/store/message-store';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

// 消息草稿类型
export interface MessageDraft {
  content: string;
  type: 'text' | 'image' | 'file' | 'voice';
  attachments?: File[];
  replyTo?: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
  mentions?: Array<{
    id: string;
    name: string;
    type: 'user' | 'all';
  }>;
}

// Hook选项
interface UseMessageCenterOptions {
  userId?: string;
  autoConnect?: boolean;
  enableNotifications?: boolean;
  enableTypingIndicator?: boolean;
}

// Hook返回值
interface UseMessageCenterReturn {
  // 连接状态
  isConnected: boolean;
  connectionStatus:
    | 'connected'
    | 'connecting'
    | 'disconnected'
    | 'reconnecting';

  // 数据
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messages: Message[];
  unreadCounts: {
    total: number;
    byType: {
      private: number;
      group: number;
      system: number;
      project: number;
    };
  };

  // 状态
  isLoading: boolean;
  typingUsers: Array<{ id: string; name: string }>;

  // 操作方法
  connect: () => Promise<void>;
  disconnect: () => void;
  selectConversation: (conversationId: string | null) => void;
  sendMessage: (draft: MessageDraft) => Promise<void>;
  markAsRead: (conversationId: string, messageId?: string) => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;

  // 消息操作
  replyToMessage: (message: Message) => void;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (conversationId: string, messageId: string) => Promise<void>;
  forwardMessage: (
    message: Message,
    targetConversationIds: string[]
  ) => Promise<void>;
  pinMessage: (conversationId: string, messageId: string) => Promise<void>;
  addReaction: (
    conversationId: string,
    messageId: string,
    emoji: string
  ) => Promise<void>;

  // 会话操作
  createConversation: (
    type: 'private' | 'group',
    participants: string[],
    name?: string
  ) => Promise<Conversation>;
  updateConversation: (
    conversationId: string,
    updates: Partial<Conversation>
  ) => Promise<void>;
  archiveConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;

  // 草稿管理
  saveDraft: (conversationId: string, content: string) => void;
  getDraft: (conversationId: string) => string;
  clearDraft: (conversationId: string) => void;

  // 搜索和过滤
  searchMessages: (query: string, conversationId?: string) => Message[];
  filterConversations: (
    filter: 'all' | 'unread' | 'private' | 'group' | 'system' | 'project'
  ) => Conversation[];
}

export function useMessageCenter(
  options: UseMessageCenterOptions = {}
): UseMessageCenterReturn {
  const {
    userId: providedUserId,
    autoConnect = true,
    enableNotifications = true,
    enableTypingIndicator = true
  } = options;

  const { user } = useAuth();
  const userId = providedUserId || user?.id;

  const wsService = useRef(getWebSocketService());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 如果没有用户ID，返回默认状态而不是抛出错误
  const isUserLoggedIn = !!userId;

  // Store state - 使用单独的选择器避免无限循环
  const conversations = useMessageStore((state) => state.conversations);
  const selectedConversationId = useMessageStore(
    (state) => state.selectedConversationId
  );
  const connectionStatus = useMessageStore((state) => state.connectionStatus);
  const isLoading = useMessageStore((state) => state.isLoading);
  const currentUserId = useMessageStore((state) => state.currentUserId);
  const totalUnreadCount = useMessageStore((state) => state.totalUnreadCount);
  const unreadByType = useMessageStore((state) => state.unreadByType);
  const typingStatuses = useMessageStore((state) => state.typingStatuses);

  // 选择当前会话的消息 - 使用稳定的选择器
  const allMessages = useMessageStore((state) => state.messages);
  const messages = useMemo(() => {
    return selectedConversationId
      ? allMessages[selectedConversationId] || []
      : [];
  }, [selectedConversationId, allMessages]);

  // 选择的会话 - 使用稳定的计算
  const selectedConversation = useMemo(() => {
    return selectedConversationId
      ? conversations.find((c) => c.id === selectedConversationId) || null
      : null;
  }, [selectedConversationId, conversations]);

  // 未读计数 - 使用稳定的对象
  const unreadCounts = useMemo(
    () => ({
      total: totalUnreadCount,
      byType: unreadByType
    }),
    [totalUnreadCount, unreadByType]
  );

  // 输入用户列表 - 使用稳定的计算
  const typingUsers = useMemo(() => {
    if (!selectedConversationId) return [];
    return typingStatuses
      .filter(
        (t: any) =>
          t.conversationId === selectedConversationId &&
          t.userId !== currentUserId
      )
      .map((t: any) => ({ id: t.userId, name: t.userName }));
  }, [selectedConversationId, typingStatuses, currentUserId]);

  // Store actions
  const {
    setConversations,
    addConversation,
    updateConversation,
    removeConversation,
    selectConversation: selectConv,
    setMessages,
    addMessage,
    updateMessage,
    removeMessage,
    markConversationAsRead,
    markMessageAsRead,
    setConnectionStatus,
    setLoading,
    saveDraft: saveDraftToStore,
    clearDraft: clearDraftFromStore
  } = useMessageStore();

  const getDraft = useCallback(
    (conversationId: string) =>
      useMessageStore.getState().drafts[conversationId] || '',
    []
  );

  // 初始化
  useEffect(() => {
    // 手动触发 Zustand persist hydration
    if (typeof window !== 'undefined') {
      useMessageStore.persist.rehydrate();
    }

    // 只有在用户已登录时才进行初始化
    if (!isUserLoggedIn) {
      return;
    }

    // 设置当前用户ID
    useMessageStore.setState({ currentUserId: userId });

    // 自动连接
    if (autoConnect) {
      connect();
    }

    // 请求通知权限
    if (
      enableNotifications &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission();
    }

    // 清理函数
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [userId, autoConnect, enableNotifications, isUserLoggedIn]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      wsService.current.disconnect();
    };
  }, []);

  // 连接WebSocket
  const connect = useCallback(async () => {
    try {
      await wsService.current.connect(userId);
    } catch (error) {
      toast.error('连接失败，请检查网络连接');
    }
  }, [userId]);

  // 断开连接
  const disconnect = useCallback(() => {
    wsService.current.disconnect();
  }, []);

  // 选择会话
  const selectConversation = useCallback(
    (conversationId: string | null) => {
      // 离开当前会话
      if (selectedConversationId) {
        wsService.current.leaveConversation(selectedConversationId);
      }

      // 选择新会话
      selectConv(conversationId);

      // 加入新会话
      if (conversationId) {
        wsService.current.joinConversation(conversationId);
        markConversationAsRead(conversationId);

        // 加载消息（这里应该从API加载）
        loadMessages(conversationId);
      }
    },
    [selectedConversationId, selectConv, markConversationAsRead]
  );

  // 加载消息
  const loadMessages = useCallback(
    async (conversationId: string) => {
      setLoading(true);
      try {
        // TODO: 从API加载消息
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        // const messages = await api.getMessages(conversationId);
        // setMessages(conversationId, messages);

        // 模拟加载延迟
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        toast.error('加载消息失败');
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setMessages]
  );

  // 发送消息
  const sendMessage = useCallback(
    async (draft: MessageDraft) => {
      if (!selectedConversationId) {
        throw new Error('No conversation selected');
      }

      try {
        // 创建消息对象
        const message: Message = {
          id: `temp_${Date.now()}`,
          content: draft.content,
          type: draft.type,
          sender: {
            id: userId,
            name: '我', // TODO: 从用户信息获取
            avatar: '' // TODO: 从用户信息获取
          },
          timestamp: new Date(),
          status: 'sending',
          isOwn: true,
          conversationId: selectedConversationId,
          replyTo: draft.replyTo,
          mentions: draft.mentions
        };

        // 添加附件
        if (draft.attachments && draft.attachments.length > 0) {
          // TODO: 上传附件
          message.attachments = draft.attachments.map((file, index) => ({
            id: `att_${Date.now()}_${index}`,
            name: file.name,
            url: URL.createObjectURL(file),
            size: file.size,
            type: file.type
          }));
        }

        // 立即添加到本地状态
        addMessage(message);

        // 清除草稿
        clearDraftFromStore(selectedConversationId);

        // 通过WebSocket发送
        wsService.current.sendMessage(
          selectedConversationId,
          draft.content,
          draft.type,
          message.attachments
        );

        // 更新消息状态为已发送
        setTimeout(() => {
          updateMessage(selectedConversationId, message.id, { status: 'sent' });
        }, 1000);
      } catch (error) {
        toast.error('发送消息失败');

        // 更新消息状态为失败
        if (selectedConversationId) {
          updateMessage(selectedConversationId, `temp_${Date.now()}`, {
            status: 'failed'
          });
        }
      }
    },
    [
      selectedConversationId,
      userId,
      addMessage,
      updateMessage,
      clearDraftFromStore
    ]
  );

  // 标记为已读
  const markAsRead = useCallback(
    (conversationId: string, messageId?: string) => {
      if (messageId) {
        markMessageAsRead(conversationId, messageId);
        wsService.current.markMessageAsRead(conversationId, messageId);
      } else {
        markConversationAsRead(conversationId);
      }
    },
    [markMessageAsRead, markConversationAsRead]
  );

  // 设置输入状态
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      if (!enableTypingIndicator) return;

      wsService.current.sendTypingStatus(conversationId, isTyping);

      // 自动停止输入状态
      if (isTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          wsService.current.sendTypingStatus(conversationId, false);
        }, 3000);
      }
    },
    [enableTypingIndicator]
  );

  // 回复消息
  const replyToMessage = useCallback((message: Message) => {
    // TODO: 设置回复状态
  }, []);

  // 编辑消息
  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      if (!selectedConversationId) return;

      try {
        // TODO: 调用API编辑消息
        updateMessage(selectedConversationId, messageId, {
          content,
          isEdited: true,
          editedAt: new Date()
        });

        toast.success('消息已编辑');
      } catch (error) {
        toast.error('编辑消息失败');
      }
    },
    [selectedConversationId, updateMessage]
  );

  // 删除消息
  const deleteMessage = useCallback(
    async (conversationId: string, messageId: string) => {
      try {
        // TODO: 调用API删除消息
        removeMessage(conversationId, messageId);
        toast.success('消息已删除');
      } catch (error) {
        toast.error('删除消息失败');
      }
    },
    [removeMessage]
  );

  // 转发消息
  const forwardMessage = useCallback(
    async (message: Message, targetConversationIds: string[]) => {
      try {
        // TODO: 实现消息转发
        toast.success('消息已转发');
      } catch (error) {
        toast.error('转发消息失败');
      }
    },
    []
  );

  // 置顶消息
  const pinMessage = useCallback(
    async (conversationId: string, messageId: string) => {
      try {
        // TODO: 调用API置顶消息
        const message = messages.find((m) => m.id === messageId);
        if (message) {
          updateMessage(conversationId, messageId, {
            isPinned: !message.isPinned
          });
          toast.success(message.isPinned ? '取消置顶' : '消息已置顶');
        }
      } catch (error) {
        toast.error('操作失败');
      }
    },
    [messages, updateMessage]
  );

  // 添加表情反应
  const addReaction = useCallback(
    async (conversationId: string, messageId: string, emoji: string) => {
      try {
        // TODO: 调用API添加反应
        const message = messages.find((m) => m.id === messageId);
        if (message) {
          const reactions = message.reactions || [];
          const existingReaction = reactions.find((r) => r.emoji === emoji);

          if (existingReaction) {
            if (existingReaction.hasReacted) {
              existingReaction.count--;
              existingReaction.hasReacted = false;
              existingReaction.users = existingReaction.users.filter(
                (u) => u.id !== userId
              );
            } else {
              existingReaction.count++;
              existingReaction.hasReacted = true;
              existingReaction.users.push({ id: userId, name: '我' });
            }
          } else {
            reactions.push({
              emoji,
              count: 1,
              users: [{ id: userId, name: '我' }],
              hasReacted: true
            });
          }

          updateMessage(conversationId, messageId, { reactions });
        }
      } catch (error) {
        toast.error('操作失败');
      }
    },
    [messages, updateMessage, userId]
  );

  // 创建会话
  const createConversation = useCallback(
    async (
      type: 'private' | 'group',
      participants: string[],
      name?: string
    ): Promise<Conversation> => {
      try {
        // TODO: 调用API创建会话
        const conversation: Conversation = {
          id: `conv_${Date.now()}`,
          type,
          name: name || `新${type === 'private' ? '私聊' : '群聊'}`,
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false,
          lastActivity: new Date(),
          participants: participants.map((id) => ({ id, name: `用户${id}` })) // TODO: 获取真实用户信息
        };

        addConversation(conversation);
        toast.success('会话创建成功');

        return conversation;
      } catch (error) {
        toast.error('创建会话失败');
        throw error;
      }
    },
    [addConversation]
  );

  // 更新会话
  const updateConversationData = useCallback(
    async (conversationId: string, updates: Partial<Conversation>) => {
      try {
        // TODO: 调用API更新会话
        updateConversation(conversationId, updates);
        toast.success('会话已更新');
      } catch (error) {
        toast.error('更新会话失败');
      }
    },
    [updateConversation]
  );

  // 归档会话
  const archiveConversation = useCallback(
    async (conversationId: string) => {
      try {
        // TODO: 调用API归档会话
        updateConversation(conversationId, { isArchived: true });
        toast.success('会话已归档');
      } catch (error) {
        toast.error('归档会话失败');
      }
    },
    [updateConversation]
  );

  // 删除会话
  const deleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        // TODO: 调用API删除会话
        removeConversation(conversationId);
        toast.success('会话已删除');
      } catch (error) {
        toast.error('删除会话失败');
      }
    },
    [removeConversation]
  );

  // 保存草稿
  const saveDraft = useCallback(
    (conversationId: string, content: string) => {
      saveDraftToStore(conversationId, content);
    },
    [saveDraftToStore]
  );

  // 清除草稿
  const clearDraft = useCallback(
    (conversationId: string) => {
      clearDraftFromStore(conversationId);
    },
    [clearDraftFromStore]
  );

  // 搜索消息
  const searchMessages = useCallback(
    (query: string, conversationId?: string) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const targetMessages = conversationId
        ? useMessageStore.getState().messages[conversationId] || []
        : Object.values(useMessageStore.getState().messages).flat();

      if (!query.trim()) return targetMessages;

      const lowerQuery = query.toLowerCase();
      return targetMessages.filter(
        (message) =>
          message.content.toLowerCase().includes(lowerQuery) ||
          message.sender.name.toLowerCase().includes(lowerQuery)
      );
    },
    []
  );

  // 过滤会话
  const filterConversations = useCallback(
    (filter: 'all' | 'unread' | 'private' | 'group' | 'system' | 'project') => {
      switch (filter) {
        case 'unread':
          return conversations.filter((c) => c.unreadCount > 0);
        case 'private':
        case 'group':
        case 'system':
        case 'project':
          return conversations.filter((c) => c.type === filter);
        default:
          return conversations;
      }
    },
    [conversations]
  );

  // 如果用户未登录，返回默认状态
  if (!isUserLoggedIn) {
    return {
      // 连接状态
      isConnected: false,
      connectionStatus: 'disconnected' as const,

      // 数据
      conversations: [],
      selectedConversation: null,
      messages: [],
      unreadCounts: {
        total: 0,
        byType: {
          private: 0,
          group: 0,
          system: 0,
          project: 0
        }
      },

      // 状态
      isLoading: false,
      typingUsers: [],

      // 操作方法（空实现）
      connect: async () => {},
      disconnect: () => {},
      selectConversation: () => {},
      sendMessage: async () => {},
      markAsRead: () => {},
      setTyping: () => {},

      // 消息操作（空实现）
      replyToMessage: () => {},
      editMessage: async () => {},
      deleteMessage: async () => {},
      forwardMessage: async () => {},
      pinMessage: async () => {},
      addReaction: async () => {},

      // 会话操作（空实现）
      createConversation: async () => ({
        id: '',
        name: '',
        type: 'private',
        participants: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }),
      updateConversation: async () => {},
      archiveConversation: async () => {},
      deleteConversation: async () => {},

      // 草稿管理（空实现）
      saveDraft: () => {},
      getDraft: () => '',
      clearDraft: () => {},

      // 搜索和过滤（空实现）
      searchMessages: () => [],
      filterConversations: () => []
    };
  }

  return {
    // 连接状态
    isConnected: wsService.current.isConnected,
    connectionStatus,

    // 数据
    conversations,
    selectedConversation,
    messages,
    unreadCounts,

    // 状态
    isLoading,
    typingUsers,

    // 操作方法
    connect,
    disconnect,
    selectConversation,
    sendMessage,
    markAsRead,
    setTyping,

    // 消息操作
    replyToMessage,
    editMessage,
    deleteMessage,
    forwardMessage,
    pinMessage,
    addReaction,

    // 会话操作
    createConversation,
    updateConversation: updateConversationData,
    archiveConversation,
    deleteConversation,

    // 草稿管理
    saveDraft,
    getDraft,
    clearDraft,

    // 搜索和过滤
    searchMessages,
    filterConversations
  };
}
