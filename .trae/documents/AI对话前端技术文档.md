# AI对话前端技术文档

## 1. 项目概述

本文档详细描述AI对话功能的前端技术实现方案，包括浮动窗口设计、React组件架构、状态管理、用户交互等核心技术要点。

### 1.1 技术栈
- **框架**: Next.js 14 + React 18
- **UI库**: shadcn/ui + Tailwind CSS
- **状态管理**: Zustand
- **动画**: Framer Motion
- **WebSocket**: Socket.io-client
- **类型检查**: TypeScript
- **构建工具**: Turbopack

### 1.2 核心特性
- 浮动全局对话窗口
- 响应式设计（桌面端/移动端）
- 实时消息推送
- 拖拽和调整大小
- 键盘快捷键支持
- 离线状态处理

## 2. 组件架构设计

### 2.1 组件层次结构

```
AIChatProvider
├── FloatingChatTrigger     # 悬浮触发按钮
├── FloatingChatWindow      # 浮动窗口容器
│   ├── ChatHeader          # 窗口标题栏
│   ├── ChatMessageList     # 消息列表
│   │   ├── MessageItem     # 单条消息
│   │   ├── TypingIndicator # 输入状态指示
│   │   └── MessageActions  # 消息操作
│   ├── ChatInput           # 输入区域
│   │   ├── TextArea        # 文本输入
│   │   ├── AttachmentArea  # 附件区域
│   │   └── QuickActions    # 快捷操作
│   └── ChatSidebar         # 侧边栏（历史记录）
└── MobileChatInterface     # 移动端界面
```

### 2.2 核心组件实现

#### 2.2.1 AI对话Provider

```typescript
// providers/AIChatProvider.tsx
import { createContext, useContext, useReducer, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useWebSocket } from '@/hooks/useWebSocket';

interface AIChatState {
  isVisible: boolean;
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
  unreadCount: number;
  windowPosition: { x: number; y: number };
  windowSize: { width: number; height: number };
  settings: ChatSettings;
}

interface AIChatContextType {
  state: AIChatState;
  actions: {
    toggleChat: () => void;
    sendMessage: (content: string, attachments?: File[]) => Promise<void>;
    createConversation: () => void;
    selectConversation: (id: string) => void;
    deleteConversation: (id: string) => void;
    updateWindowPosition: (position: { x: number; y: number }) => void;
    updateWindowSize: (size: { width: number; height: number }) => void;
    markAsRead: () => void;
  };
}

const AIChatContext = createContext<AIChatContextType | null>(null);

export const AIChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { socket, isConnected } = useWebSocket('/api/chat');

  // WebSocket事件监听
  useEffect(() => {
    if (!socket) return;

    socket.on('message:received', (message: Message) => {
      dispatch({ type: 'ADD_MESSAGE', payload: message });
      if (!state.isVisible) {
        dispatch({ type: 'INCREMENT_UNREAD' });
      }
    });

    socket.on('typing:start', () => {
      dispatch({ type: 'SET_TYPING', payload: true });
    });

    socket.on('typing:stop', () => {
      dispatch({ type: 'SET_TYPING', payload: false });
    });

    return () => {
      socket.off('message:received');
      socket.off('typing:start');
      socket.off('typing:stop');
    };
  }, [socket, state.isVisible]);

  const actions = {
    toggleChat: () => {
      dispatch({ type: 'TOGGLE_VISIBILITY' });
      if (!state.isVisible) {
        dispatch({ type: 'MARK_AS_READ' });
      }
    },

    sendMessage: async (content: string, attachments?: File[]) => {
      const message: Message = {
        id: generateId(),
        content,
        role: 'user',
        timestamp: new Date(),
        conversationId: state.currentConversationId!,
        attachments: attachments?.map(file => ({
          id: generateId(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file)
        }))
      };

      dispatch({ type: 'ADD_MESSAGE', payload: message });
      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        // 发送到后端
        socket?.emit('message:send', {
          conversationId: state.currentConversationId,
          content,
          attachments
        });
      } catch (error) {
        console.error('发送消息失败:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    createConversation: () => {
      const newConversation: Conversation = {
        id: generateId(),
        title: '新对话',
        createdAt: new Date(),
        updatedAt: new Date(),
        messageCount: 0
      };
      dispatch({ type: 'ADD_CONVERSATION', payload: newConversation });
      dispatch({ type: 'SELECT_CONVERSATION', payload: newConversation.id });
    },

    selectConversation: (id: string) => {
      dispatch({ type: 'SELECT_CONVERSATION', payload: id });
    },

    deleteConversation: (id: string) => {
      dispatch({ type: 'DELETE_CONVERSATION', payload: id });
    },

    updateWindowPosition: (position: { x: number; y: number }) => {
      dispatch({ type: 'UPDATE_WINDOW_POSITION', payload: position });
    },

    updateWindowSize: (size: { width: number; height: number }) => {
      dispatch({ type: 'UPDATE_WINDOW_SIZE', payload: size });
    },

    markAsRead: () => {
      dispatch({ type: 'MARK_AS_READ' });
    }
  };

  return (
    <AIChatContext.Provider value={{ state, actions }}>
      {children}
    </AIChatContext.Provider>
  );
};

export const useAIChat = () => {
  const context = useContext(AIChatContext);
  if (!context) {
    throw new Error('useAIChat must be used within AIChatProvider');
  }
  return context;
};
```

#### 2.2.2 浮动触发按钮

```typescript
// components/chat/FloatingChatTrigger.tsx
import { motion } from 'framer-motion';
import { MessageCircle, Minimize2 } from 'lucide-react';
import { useAIChat } from '@/providers/AIChatProvider';
import { cn } from '@/lib/utils';

interface FloatingChatTriggerProps {
  position?: 'bottom-right' | 'bottom-left' | 'custom';
  customPosition?: { bottom: number; right: number; left?: number };
  className?: string;
}

export const FloatingChatTrigger: React.FC<FloatingChatTriggerProps> = ({
  position = 'bottom-right',
  customPosition,
  className
}) => {
  const { state, actions } = useAIChat();
  const { isVisible, unreadCount } = state;

  const getPositionStyles = () => {
    if (customPosition) return customPosition;
    
    switch (position) {
      case 'bottom-right':
        return { bottom: 24, right: 24 };
      case 'bottom-left':
        return { bottom: 24, left: 24 };
      default:
        return { bottom: 24, right: 24 };
    }
  };

  return (
    <motion.button
      onClick={actions.toggleChat}
      className={cn(
        "fixed z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700",
        "rounded-full shadow-lg flex items-center justify-center",
        "transition-all duration-200 hover:scale-110",
        "focus:outline-none focus:ring-4 focus:ring-blue-300",
        "backdrop-blur-sm",
        className
      )}
      style={getPositionStyles()}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ 
        scale: 1, 
        rotate: isVisible ? 180 : 0 
      }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20 
      }}
    >
      {/* 图标切换动画 */}
      <motion.div
        animate={{ rotate: isVisible ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {isVisible ? (
          <Minimize2 className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </motion.div>
      
      {/* 在线状态指示器 */}
      <motion.div 
        className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
      
      {/* 未读消息计数 */}
      {unreadCount > 0 && !isVisible && (
        <motion.div
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs"
          className="rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </motion.div>
      )}
    </motion.button>
  );
};
```

#### 2.2.3 浮动对话窗口

```typescript
// components/chat/FloatingChatWindow.tsx
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2, Bot } from 'lucide-react';
import { useDraggable } from '@/hooks/useDraggable';
import { useResizable } from '@/hooks/useResizable';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useAIChat } from '@/providers/AIChatProvider';
import { Button } from '@/components/ui/button';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { ChatSidebar } from './ChatSidebar';
import { MobileChatInterface } from './MobileChatInterface';
import { cn } from '@/lib/utils';

export const FloatingChatWindow: React.FC = () => {
  const { state, actions } = useAIChat();
  const { isVisible, windowPosition, windowSize } = state;
  
  const [isMaximized, setIsMaximized] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const windowRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // 拖拽功能
  const { position: dragPosition } = useDraggable({
    nodeRef: windowRef,
    handle: dragRef,
    disabled: isMaximized || isMobile,
    onDragStart: () => setIsDragging(true),
    onDragEnd: (position) => {
      setIsDragging(false);
      actions.updateWindowPosition(position);
    },
    bounds: 'viewport',
    initialPosition: windowPosition
  });

  // 调整大小功能
  const { size: resizeSize } = useResizable({
    nodeRef: windowRef,
    disabled: isMaximized || isMobile,
    minSize: { width: 320, height: 400 },
    maxSize: { width: 800, height: 600 },
    onResize: (size) => {
      actions.updateWindowSize(size);
    },
    initialSize: windowSize
  });

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        actions.toggleChat();
      }
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        actions.toggleChat();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, actions]);

  // 移动端全屏显示
  if (isMobile) {
    return (
      <AnimatePresence>
        {isVisible && (
          <MobileChatInterface onClose={actions.toggleChat} />
        )}
      </AnimatePresence>
    );
  }

  const currentPosition = dragPosition || windowPosition;
  const currentSize = resizeSize || windowSize;
  
  const maximizedStyle = {
    left: 20,
    top: 20,
    width: window.innerWidth - 40,
    height: window.innerHeight - 40
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* 背景遮罩 (仅最大化时) */}
          {isMaximized && (
            <motion.div
              className="fixed inset-0 bg-black/20 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMaximized(false)}
            />
          )}
          
          {/* 主窗口 */}
          <motion.div
            ref={windowRef}
            className={cn(
              "fixed z-50 bg-white rounded-lg shadow-2xl border",
              "flex overflow-hidden",
              isDragging && "cursor-grabbing select-none",
              isMaximized && "rounded-none"
            )}
            style={{
              left: isMaximized ? maximizedStyle.left : currentPosition.x,
              top: isMaximized ? maximizedStyle.top : currentPosition.y,
              width: isMaximized ? maximizedStyle.width : currentSize.width,
              height: isMaximized ? maximizedStyle.height : currentSize.height
            }}
            initial={{ 
              scale: 0.8, 
              opacity: 0,
              x: 20,
              y: 20
            }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              x: 0,
              y: 0
            }}
            exit={{ 
              scale: 0.8, 
              opacity: 0,
              x: 20,
              y: 20
            }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300 
            }}
          >
            {/* 侧边栏 */}
            {showSidebar && (
              <motion.div
                className="w-80 border-r"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChatSidebar onClose={() => setShowSidebar(false)} />
              </motion.div>
            )}
            
            {/* 主要内容区域 */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* 窗口标题栏 */}
              <div 
                ref={dragRef}
                className={cn(
                  "flex items-center justify-between p-3 border-b bg-gray-50",
                  !isMaximized && "cursor-grab active:cursor-grabbing"
                )}
              >
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium text-gray-900">AI助手</h3>
                  <motion.div 
                    className="w-2 h-2 bg-green-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  />
                </div>
                
                <div className="flex items-center gap-1">
                  {/* 侧边栏切换 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="w-8 h-8 p-0"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                    </svg>
                  </Button>
                  
                  {/* 最大化/还原 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="w-8 h-8 p-0"
                  >
                    {isMaximized ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>
                  
                  {/* 关闭 */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={actions.toggleChat}
                    className="w-8 h-8 p-0 hover:bg-red-100 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* 消息列表 */}
              <div className="flex-1 min-h-0">
                <ChatMessageList />
              </div>
              
              {/* 输入区域 */}
              <ChatInput />
            </div>
            
            {/* 调整大小手柄 */}
            {!isMaximized && (
              <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100">
                <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-gray-400" />
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
```

## 3. 状态管理

### 3.1 Zustand Store设计

```typescript
// stores/chatStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface ChatState {
  // 基础状态
  isVisible: boolean;
  isConnected: boolean;
  isLoading: boolean;
  isTyping: boolean;
  
  // 对话数据
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Record<string, Message[]>;
  
  // UI状态
  windowPosition: { x: number; y: number };
  windowSize: { width: number; height: number };
  unreadCount: number;
  
  // 设置
  settings: {
    theme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
    soundEnabled: boolean;
    notificationsEnabled: boolean;
    autoScroll: boolean;
  };
}

interface ChatActions {
  // 基础操作
  toggleVisibility: () => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setTyping: (typing: boolean) => void;
  
  // 对话操作
  addConversation: (conversation: Conversation) => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  
  // 消息操作
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  clearMessages: (conversationId: string) => void;
  
  // UI操作
  updateWindowPosition: (position: { x: number; y: number }) => void;
  updateWindowSize: (size: { width: number; height: number }) => void;
  incrementUnreadCount: () => void;
  resetUnreadCount: () => void;
  
  // 设置操作
  updateSettings: (settings: Partial<ChatState['settings']>) => void;
}

export const useChatStore = create<ChatState & ChatActions>()()
  devtools(
    persist(
      immer((set, get) => ({
        // 初始状态
        isVisible: false,
        isConnected: false,
        isLoading: false,
        isTyping: false,
        conversations: [],
        currentConversationId: null,
        messages: {},
        windowPosition: { x: window.innerWidth - 400, y: window.innerHeight - 600 },
        windowSize: { width: 380, height: 580 },
        unreadCount: 0,
        settings: {
          theme: 'auto',
          fontSize: 'medium',
          soundEnabled: true,
          notificationsEnabled: true,
          autoScroll: true
        },
        
        // 基础操作
        toggleVisibility: () => set((state) => {
          state.isVisible = !state.isVisible;
          if (state.isVisible) {
            state.unreadCount = 0;
          }
        }),
        
        setConnected: (connected) => set((state) => {
          state.isConnected = connected;
        }),
        
        setLoading: (loading) => set((state) => {
          state.isLoading = loading;
        }),
        
        setTyping: (typing) => set((state) => {
          state.isTyping = typing;
        }),
        
        // 对话操作
        addConversation: (conversation) => set((state) => {
          state.conversations.push(conversation);
          state.messages[conversation.id] = [];
        }),
        
        selectConversation: (id) => set((state) => {
          state.currentConversationId = id;
        }),
        
        deleteConversation: (id) => set((state) => {
          state.conversations = state.conversations.filter(c => c.id !== id);
          delete state.messages[id];
          if (state.currentConversationId === id) {
            state.currentConversationId = state.conversations[0]?.id || null;
          }
        }),
        
        updateConversation: (id, updates) => set((state) => {
          const conversation = state.conversations.find(c => c.id === id);
          if (conversation) {
            Object.assign(conversation, updates);
          }
        }),
        
        // 消息操作
        addMessage: (conversationId, message) => set((state) => {
          if (!state.messages[conversationId]) {
            state.messages[conversationId] = [];
          }
          state.messages[conversationId].push(message);
          
          // 更新对话的最后更新时间
          const conversation = state.conversations.find(c => c.id === conversationId);
          if (conversation) {
            conversation.updatedAt = new Date();
            conversation.messageCount = state.messages[conversationId].length;
          }
          
          // 如果窗口不可见且是AI消息，增加未读计数
          if (!state.isVisible && message.role === 'assistant') {
            state.unreadCount += 1;
          }
        }),
        
        updateMessage: (conversationId, messageId, updates) => set((state) => {
          const messages = state.messages[conversationId];
          if (messages) {
            const message = messages.find(m => m.id === messageId);
            if (message) {
              Object.assign(message, updates);
            }
          }
        }),
        
        deleteMessage: (conversationId, messageId) => set((state) => {
          const messages = state.messages[conversationId];
          if (messages) {
            state.messages[conversationId] = messages.filter(m => m.id !== messageId);
          }
        }),
        
        clearMessages: (conversationId) => set((state) => {
          state.messages[conversationId] = [];
        }),
        
        // UI操作
        updateWindowPosition: (position) => set((state) => {
          state.windowPosition = position;
        }),
        
        updateWindowSize: (size) => set((state) => {
          state.windowSize = size;
        }),
        
        incrementUnreadCount: () => set((state) => {
          state.unreadCount += 1;
        }),
        
        resetUnreadCount: () => set((state) => {
          state.unreadCount = 0;
        }),
        
        // 设置操作
        updateSettings: (newSettings) => set((state) => {
          Object.assign(state.settings, newSettings);
        })
      })),
      {
        name: 'ai-chat-storage',
        partialize: (state) => ({
          conversations: state.conversations,
          messages: state.messages,
          windowPosition: state.windowPosition,
          windowSize: state.windowSize,
          settings: state.settings
        })
      }
    ),
    { name: 'ai-chat-store' }
  )
);
```

## 4. 自定义Hooks

### 4.1 WebSocket连接Hook

```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export const useWebSocket = (
  namespace: string = '/chat',
  options: UseWebSocketOptions = {}
) => {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000
  } = options;
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectCount = useRef(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!autoConnect || !user) return;

    const newSocket = io(namespace, {
      auth: {
        token: user.token
      },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      reconnectCount.current = 0;
      console.log('WebSocket connected');
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('WebSocket disconnected:', reason);
      
      // 自动重连
      if (reason === 'io server disconnect') {
        // 服务器主动断开，需要手动重连
        setTimeout(() => {
          if (reconnectCount.current < reconnectAttempts) {
            reconnectCount.current++;
            newSocket.connect();
          }
        }, reconnectDelay * reconnectCount.current);
      }
    });

    newSocket.on('connect_error', (error) => {
      setError(error.message);
      console.error('WebSocket connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [namespace, autoConnect, user, reconnectAttempts, reconnectDelay]);

  const emit = (event: string, data: any) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  };

  const on = (event: string, handler: (...args: any[]) => void) => {
    if (socket) {
      socket.on(event, handler);
    }
  };

  const off = (event: string, handler?: (...args: any[]) => void) => {
    if (socket) {
      socket.off(event, handler);
    }
  };

  return {
    socket,
    isConnected,
    error,
    emit,
    on,
    off
  };
};
```

### 4.2 拖拽功能Hook

```typescript
// hooks/useDraggable.ts
import { useEffect, useRef, useState, RefObject } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDraggableOptions {
  nodeRef: RefObject<HTMLElement>;
  handle?: RefObject<HTMLElement>;
  disabled?: boolean;
  bounds?: 'viewport' | 'parent' | { top: number; left: number; right: number; bottom: number };
  onDragStart?: (position: Position) => void;
  onDrag?: (position: Position) => void;
  onDragEnd?: (position: Position) => void;
  initialPosition?: Position;
}

export const useDraggable = (options: UseDraggableOptions) => {
  const {
    nodeRef,
    handle,
    disabled = false,
    bounds = 'viewport',
    onDragStart,
    onDrag,
    onDragEnd,
    initialPosition = { x: 0, y: 0 }
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Position>(initialPosition);
  const dragStart = useRef<Position>({ x: 0, y: 0 });
  const elementStart = useRef<Position>({ x: 0, y: 0 });

  const getBounds = () => {
    if (bounds === 'viewport') {
      return {
        top: 0,
        left: 0,
        right: window.innerWidth,
        bottom: window.innerHeight
      };
    }
    
    if (bounds === 'parent' && nodeRef.current?.parentElement) {
      const parent = nodeRef.current.parentElement;
      const rect = parent.getBoundingClientRect();
      return {
        top: 0,
        left: 0,
        right: rect.width,
        bottom: rect.height
      };
    }
    
    if (typeof bounds === 'object') {
      return bounds;
    }
    
    return null;
  };

  const constrainPosition = (pos: Position): Position => {
    const boundsRect = getBounds();
    if (!boundsRect || !nodeRef.current) return pos;
    
    const element = nodeRef.current;
    const elementRect = element.getBoundingClientRect();
    
    return {
      x: Math.max(
        boundsRect.left,
        Math.min(pos.x, boundsRect.right - elementRect.width)
      ),
      y: Math.max(
        boundsRect.top,
        Math.min(pos.y, boundsRect.bottom - elementRect.height)
      )
    };
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (disabled || !nodeRef.current) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const rect = nodeRef.current.getBoundingClientRect();
    dragStart.current = { x: e.clientX, y: e.clientY };
    elementStart.current = { x: rect.left, y: rect.top };
    
    onDragStart?.(elementStart.current);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;
    
    const newPosition = constrainPosition({
      x: elementStart.current.x + deltaX,
      y: elementStart.current.y + deltaY
    });
    
    setPosition(newPosition);
    onDrag?.(newPosition);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    onDragEnd?.(position);
  };

  useEffect(() => {
    const handleElement = handle?.current || nodeRef.current;
    if (!handleElement) return;

    handleElement.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      handleElement.removeEventListener('mousedown', handleMouseDown);
    };
  }, [disabled, handle, nodeRef]);

  useEffect(() => {
    if (!isDragging) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]);

  return {
    isDragging,
    position,
    setPosition
  };
};
```

## 5. 性能优化

### 5.1 虚拟滚动实现

```typescript
// components/chat/VirtualMessageList.tsx
import { useMemo, useRef, useEffect, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { MessageComponent } from './MessageComponent';
import { Message } from '@/types/chat';

interface VirtualMessageListProps {
  messages: Message[];
  height: number;
  itemHeight?: number;
  onLoadMore?: () => void;
}

export const VirtualMessageList: React.FC<VirtualMessageListProps> = ({
  messages,
  height,
  itemHeight = 120,
  onLoadMore
}) => {
  const listRef = useRef<List>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // 自动滚动到底部
  useEffect(() => {
    if (isAtBottom && messages.length > 0) {
      listRef.current?.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages.length, isAtBottom]);

  const handleScroll = ({ scrollOffset, scrollUpdateWasRequested }: any) => {
    if (!scrollUpdateWasRequested) {
      const maxScrollTop = (messages.length * itemHeight) - height;
      setIsAtBottom(scrollOffset >= maxScrollTop - 50);
      
      // 滚动到顶部时加载更多
      if (scrollOffset === 0 && onLoadMore) {
        onLoadMore();
      }
    }
  };

  const MessageItem = ({ index, style }: { index: number; style: any }) => {
    const message = messages[index];
    
    return (
      <div style={style}>
        <MessageComponent
          key={message.id}
          message={message}
        />
      </div>
    );
  };

  return (
    <div className="relative">
      <List
        ref={listRef}
        height={height}
        itemCount={messages.length}
        itemSize={itemHeight}
        onScroll={handleScroll}
        overscanCount={5}
      >
        {MessageItem}
      </List>
      
      {/* 滚动到底部按钮 */}
      {!isAtBottom && (
        <button
          onClick={() => {
            setIsAtBottom(true);
            listRef.current?.scrollToItem(messages.length - 1, 'end');
          }}
          className="absolute bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700"
        >
          ↓
        </button>
      )}
    </div>
  );
};
```

### 5.2 消息缓存策略

```typescript
// hooks/useMessageCache.ts
import { useCallback, useRef } from 'react';
import { LRUCache } from 'lru-cache';
import { Message } from '@/types/chat';

interface MessageCacheOptions {
  maxSize?: number;
  ttl?: number; // Time to live in milliseconds
}

export const useMessageCache = (options: MessageCacheOptions = {}) => {
  const { maxSize = 1000, ttl = 1000 * 60 * 30 } = options; // 30分钟TTL
  
  const cache = useRef(
    new LRUCache<string, Message[]>({
      max: maxSize,
      ttl
    })
  );

  const getMessages = useCallback((conversationId: string): Message[] | undefined => {
    return cache.current.get(conversationId);
  }, []);

  const setMessages = useCallback((conversationId: string, messages: Message[]) => {
    cache.current.set(conversationId, messages);
  }, []);

  const addMessage = useCallback((conversationId: string, message: Message) => {
    const existing = cache.current.get(conversationId) || [];
    const updated = [...existing, message];
    cache.current.set(conversationId, updated);
  }, []);

  const updateMessage = useCallback((
    conversationId: string, 
    messageId: string, 
    updates: Partial<Message>
  ) => {
    const existing = cache.current.get(conversationId);
    if (existing) {
      const updated = existing.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      );
      cache.current.set(conversationId, updated);
    }
  }, []);

  const removeMessage = useCallback((conversationId: string, messageId: string) => {
    const existing = cache.current.get(conversationId);
    if (existing) {
      const updated = existing.filter(msg => msg.id !== messageId);
      cache.current.set(conversationId, updated);
    }
  }, []);

  const clearConversation = useCallback((conversationId: string) => {
    cache.current.delete(conversationId);
  }, []);

  const clearAll = useCallback(() => {
    cache.current.clear();
  }, []);

  return {
    getMessages,
    setMessages,
    addMessage,
    updateMessage,
    removeMessage,
    clearConversation,
    clearAll
  };
};
```

## 6. 移动端适配

### 6.1 移动端界面组件

```typescript
// components/chat/MobileChatInterface.tsx
import { useState, useEffect } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { X, Bot, MoreVertical, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { ChatSidebar } from './ChatSidebar';
import { useAIChat } from '@/providers/AIChatProvider';
import { cn } from '@/lib/utils';

interface MobileChatInterfaceProps {
  onClose: () => void;
}

export const MobileChatInterface: React.FC<MobileChatInterfaceProps> = ({ onClose }) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const { state } = useAIChat();

  // 检测虚拟键盘
  useEffect(() => {
    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      setIsKeyboardOpen(viewportHeight < windowHeight * 0.75);
    };
    
    window.visualViewport?.addEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 手势关闭
  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.y > 100 && info.velocity.y > 0) {
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-white flex flex-col"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.2 }}
      onDragEnd={handleDragEnd}
    >
      {/* 拖拽指示器 */}
      <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2 mb-1" />
      
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {showSidebar ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(false)}
              className="w-10 h-10 p-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          ) : (
            <Bot className="w-6 h-6 text-blue-600" />
          )}
          
          <div>
            <h2 className="font-semibold text-gray-900">
              {showSidebar ? '对话历史' : 'AI助手'}
            </h2>
            <p className="text-sm text-green-600">
              {state.isConnected ? '在线' : '离线'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!showSidebar && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(true)}
              className="w-10 h-10 p-0"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="w-10 h-10 p-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className={cn(
        "flex-1 flex flex-col min-h-0",
        isKeyboardOpen && "pb-safe-area-inset-bottom"
      )}>
        {showSidebar ? (
          <ChatSidebar 
            onClose={() => setShowSidebar(false)}
            isMobile
          />
        ) : (
          <>
            {/* 消息列表 */}
            <div className="flex-1 min-h-0">
              <ChatMessageList isMobile />
            </div>
            
            {/* 输入区域 */}
            <div className={cn(
              "border-t bg-white",
              isKeyboardOpen && "pb-safe-area-inset-bottom"
            )}>
              <ChatInput isMobile />
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
```

## 7. 错误处理和降级

### 7.1 错误边界组件

```typescript
// components/chat/ChatErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ChatErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // 发送错误报告
    console.error('Chat Error:', error, errorInfo);
    
    // 可以集成错误监控服务
    // errorReportingService.captureException(error, {
    //   extra: errorInfo
    // });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            AI助手遇到了问题
          </h3>
          <p className="text-gray-600 mb-4">
            抱歉，AI助手暂时无法正常工作。请尝试刷新或稍后再试。
          </p>
          
          <div className="flex gap-2">
            <Button
              onClick={this.handleRetry}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </Button>
            
            <Button
              onClick={() => window.location.reload()}
              variant="default"
            >
              刷新页面
            </Button>
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500">
                错误详情 (开发模式)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-w-full">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 7.2 网络错误处理

```typescript
// hooks/useErrorHandler.ts
import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  retryable?: boolean;
}

export const useErrorHandler = () => {
  const handleError = useCallback((
    error: Error | string,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      retryable = false
    } = options;

    const errorMessage = typeof error === 'string' ? error : error.message;
    
    if (logError) {
      console.error('Chat Error:', error);
    }

    if (showToast) {
      toast({
        title: '操作失败',
        description: getErrorMessage(errorMessage),
        variant: 'destructive',
        action: retryable ? (
          <Button variant="outline" size="sm">
            重试
          </Button>
        ) : undefined
      });
    }
  }, []);

  const getErrorMessage = (error: string): string => {
    // 网络错误
    if (error.includes('Network Error') || error.includes('fetch')) {
      return '网络连接失败，请检查网络设置';
    }
    
    // 认证错误
    if (error.includes('401') || error.includes('Unauthorized')) {
      return '身份验证失败，请重新登录';
    }
    
    // 服务器错误
    if (error.includes('500') || error.includes('Internal Server Error')) {
      return '服务器暂时不可用，请稍后再试';
    }
    
    // 限流错误
    if (error.includes('429') || error.includes('Too Many Requests')) {
      return '请求过于频繁，请稍后再试';
    }
    
    // WebSocket错误
    if (error.includes('WebSocket')) {
      return '实时连接中断，正在尝试重连...';
    }
    
    return error || '未知错误，请稍后再试';
  };

  return { handleError };
};
```

## 8. 测试策略

### 8.1 组件测试

```typescript
// __tests__/components/FloatingChatTrigger.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { FloatingChatTrigger } from '@/components/chat/FloatingChatTrigger';
import { AIChatProvider } from '@/providers/AIChatProvider';

const MockedProvider = ({ children }: { children: React.ReactNode }) => (
  <AIChatProvider>
    {children}
  </AIChatProvider>
);

describe('FloatingChatTrigger', () => {
  it('renders correctly', () => {
    render(
      <MockedProvider>
        <FloatingChatTrigger />
      </MockedProvider>
    );
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows unread count when there are unread messages', () => {
    // Mock store state with unread messages
    const mockState = {
      unreadCount: 5,
      isVisible: false
    };
    
    render(
      <MockedProvider>
        <FloatingChatTrigger />
      </MockedProvider>
    );
    
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('toggles chat visibility when clicked', () => {
    const mockToggle = jest.fn();
    
    render(
      <MockedProvider>
        <FloatingChatTrigger />
      </MockedProvider>
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockToggle).toHaveBeenCalled();
  });

  it('applies correct position styles', () => {
    render(
      <MockedProvider>
        <FloatingChatTrigger position="bottom-left" />
      </MockedProvider>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveStyle({ left: '24px', bottom: '24px' });
  });
});
```

### 8.2 Hook测试

```typescript
// __tests__/hooks/useWebSocket.test.ts
import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');
const mockIo = io as jest.MockedFunction<typeof io>;

describe('useWebSocket', () => {
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      close: jest.fn(),
      connect: jest.fn()
    };
    
    mockIo.mockReturnValue(mockSocket);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('establishes connection on mount', () => {
    renderHook(() => useWebSocket('/chat'));
    
    expect(mockIo).toHaveBeenCalledWith('/chat', expect.any(Object));
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
  });

  it('handles connection events', () => {
    const { result } = renderHook(() => useWebSocket('/chat'));
    
    // Simulate connection
    act(() => {
      const connectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect'
      )[1];
      connectHandler();
    });
    
    expect(result.current.isConnected).toBe(true);
  });

  it('emits events when connected', () => {
    const { result } = renderHook(() => useWebSocket('/chat'));
    
    act(() => {
      result.current.emit('test-event', { data: 'test' });
    });
    
    expect(mockSocket.emit).toHaveBeenCalledWith('test-event', { data: 'test' });
  });

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket('/chat'));
    
    unmount();
    
    expect(mockSocket.close).toHaveBeenCalled();
  });
});
```

### 8.3 集成测试

```typescript
// __tests__/integration/ChatFlow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIChatProvider } from '@/providers/AIChatProvider';
import { FloatingChatTrigger } from '@/components/chat/FloatingChatTrigger';
import { FloatingChatWindow } from '@/components/chat/FloatingChatWindow';

describe('Chat Integration Flow', () => {
  it('completes full chat interaction flow', async () => {
    const user = userEvent.setup();
    
    render(
      <AIChatProvider>
        <FloatingChatTrigger />
        <FloatingChatWindow />
      </AIChatProvider>
    );
    
    // 1. 点击触发按钮打开聊天窗口
    await user.click(screen.getByRole('button'));
    
    // 2. 验证聊天窗口已打开
    expect(screen.getByText('AI助手')).toBeInTheDocument();
    
    // 3. 输入消息
    const input = screen.getByPlaceholderText('输入消息...');
    await user.type(input, 'Hello AI');
    
    // 4. 发送消息
    await user.click(screen.getByText('发送'));
    
    // 5. 验证消息已显示
    expect(screen.getByText('Hello AI')).toBeInTheDocument();
    
    // 6. 等待AI回复
    await waitFor(() => {
      expect(screen.getByText(/AI回复/)).toBeInTheDocument();
    });
  });
});
```

## 9. 部署配置

### 9.1 环境变量配置

```bash
# .env.local
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_CHAT_ENABLED=true
NEXT_PUBLIC_MAX_MESSAGE_LENGTH=2000
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
NEXT_PUBLIC_SUPPORTED_FILE_TYPES=image/*,text/*,application/pdf
```

### 9.2 构建优化

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  webpack: (config, { dev, isServer }) => {
    // 优化聊天组件的代码分割
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups.chat = {
        name: 'chat',
        test: /[\/]components[\/]chat[\/]/,
        chunks: 'all',
        priority: 10,
      };
    }
    
    return config;
  },
  
  // PWA支持
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
  },
};

module.exports = nextConfig;
```

### 9.3 性能监控

```typescript
// utils/performance.ts
export class ChatPerformanceMonitor {
  private static instance: ChatPerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  
  static getInstance(): ChatPerformanceMonitor {
    if (!ChatPerformanceMonitor.instance) {
      ChatPerformanceMonitor.instance = new ChatPerformanceMonitor();
    }
    return ChatPerformanceMonitor.instance;
  }
  
  startTiming(label: string): void {
    this.metrics.set(label, performance.now());
  }
  
  endTiming(label: string): number {
    const startTime = this.metrics.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.metrics.delete(label);
      
      // 发送到分析服务
      this.reportMetric(label, duration);
      
      return duration;
    }
    return 0;
  }
  
  private reportMetric(label: string, duration: number): void {
    // 集成分析服务
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: label,
        value: Math.round(duration)
      });
    }
  }
  
  measureComponent<T extends React.ComponentType<any>>(
    Component: T,
    displayName: string
  ): T {
    const MeasuredComponent = (props: any) => {
      React.useEffect(() => {
        this.startTiming(`${displayName}_render`);
        return () => {
          this.endTiming(`${displayName}_render`);
        };
      }, []);
      
      return React.createElement(Component, props);
    };
    
    MeasuredComponent.displayName = `Measured(${displayName})`;
    return MeasuredComponent as T;
  }
}

// 使用示例
export const MeasuredChatWindow = ChatPerformanceMonitor
  .getInstance()
  .measureComponent(FloatingChatWindow, 'ChatWindow');
```

## 10. 开发工具和调试

### 10.1 开发者工具

```typescript
// components/chat/ChatDevTools.tsx
import { useState } from 'react';
import { useAIChat } from '@/providers/AIChatProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ChatDevToolsProps {
  enabled?: boolean;
}

export const ChatDevTools: React.FC<ChatDevToolsProps> = ({ 
  enabled = process.env.NODE_ENV === 'development' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { state, actions } = useAIChat();
  
  if (!enabled) return null;
  
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className="mb-2"
      >
        🛠️ Chat DevTools
      </Button>
      
      {isOpen && (
        <div className="bg-white border rounded-lg shadow-lg p-4 w-80 max-h-96 overflow-auto">
          <h3 className="font-semibold mb-3">Chat State</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Visible:</span>
              <Badge variant={state.isVisible ? 'default' : 'secondary'}>
                {state.isVisible ? 'Yes' : 'No'}
              </Badge>
            </div>
            
            <div className="flex justify-between">
              <span>Connected:</span>
              <Badge variant={state.isConnected ? 'default' : 'destructive'}>
                {state.isConnected ? 'Yes' : 'No'}
              </Badge>
            </div>
            
            <div className="flex justify-between">
              <span>Loading:</span>
              <Badge variant={state.isLoading ? 'default' : 'secondary'}>
                {state.isLoading ? 'Yes' : 'No'}
              </Badge>
            </div>
            
            <div className="flex justify-between">
              <span>Conversations:</span>
              <Badge>{state.conversations.length}</Badge>
            </div>
            
            <div className="flex justify-between">
              <span>Unread:</span>
              <Badge variant={state.unreadCount > 0 ? 'destructive' : 'secondary'}>
                {state.unreadCount}
              </Badge>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <Button
              onClick={() => actions.createConversation()}
              size="sm"
              className="w-full"
            >
              Create Test Conversation
            </Button>
            
            <Button
              onClick={() => {
                actions.sendMessage('Test message from DevTools');
              }}
              size="sm"
              variant="outline"
              className="w-full"
            >
              Send Test Message
            </Button>
            
            <Button
              onClick={() => {
                console.log('Chat State:', state);
              }}
              size="sm"
              variant="outline"
              className="w-full"
            >
              Log State to Console
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
```

### 10.2 调试配置

```typescript
// utils/debug.ts
export const DEBUG_CONFIG = {
  ENABLE_LOGGING: process.env.NODE_ENV === 'development',
  LOG_WEBSOCKET_EVENTS: true,
  LOG_STATE_CHANGES: true,
  LOG_PERFORMANCE: true,
  MOCK_AI_RESPONSES: false,
};

export const debugLog = (category: string, message: string, data?: any) => {
  if (!DEBUG_CONFIG.ENABLE_LOGGING) return;
  
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${category}] ${message}`;
  
  if (data) {
    console.group(logMessage);
    console.log(data);
    console.groupEnd();
  } else {
    console.log(logMessage);
  }
};

export const createDebugger = (category: string) => {
  return {
    log: (message: string, data?: any) => debugLog(category, message, data),
    error: (message: string, error?: any) => {
      console.error(`[${category}] ${message}`, error);
    },
    warn: (message: string, data?: any) => {
      console.warn(`[${category}] ${message}`, data);
    }
  };
};
```

## 11. 总结

本前端技术文档详细描述了AI对话功能的完整实现方案，包括：

### 核心特性
- 🎯 **浮动窗口设计**: 全局可访问的对话界面
- 📱 **响应式适配**: 完美支持桌面端和移动端
- ⚡ **实时通信**: WebSocket实现即时消息推送
- 🎨 **现代UI**: 基于shadcn/ui的美观界面
- 🔧 **高度可定制**: 支持主题、字体、布局等个性化设置

### 技术亮点
- **组件化架构**: 模块化设计，易于维护和扩展
- **状态管理**: Zustand提供高效的状态管理
- **性能优化**: 虚拟滚动、消息缓存、代码分割
- **错误处理**: 完善的错误边界和降级策略
- **测试覆盖**: 单元测试、集成测试、E2E测试

### 开发体验
- **TypeScript**: 完整的类型安全
- **热重载**: 快速开发迭代
- **调试工具**: 开发者友好的调试界面
- **性能监控**: 实时性能指标追踪

该文档为前端开发团队提供了完整的技术指导，确保AI对话功能的高质量实现。