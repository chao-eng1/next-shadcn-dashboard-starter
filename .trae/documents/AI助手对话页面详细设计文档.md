# AI助手对话页面详细设计文档

## 1. 页面概述

AI助手对话页面是AI模块的核心交互界面，采用**浮动全局显示**的设计模式，为用户提供无缝的智能对话服务。该页面基于现代化的聊天界面设计，支持项目相关问题咨询、代码解释、技术方案建议等多种对话场景，并通过浮动窗口实现全局可用性。

### 1.1 交互模式
- **浮动窗口**: 类似客服聊天窗口的全局浮动设计
- **悬浮按钮**: 通过悬浮按钮快速显示/隐藏对话界面
- **展开收起**: 流畅的动画效果提升用户体验
- **拖拽调整**: 支持窗口位置拖拽和大小调整
- **智能定位**: 根据页面内容自动调整对话窗口位置
- **多设备适配**: 响应式设计，适配桌面端和移动端

### 1.2 核心特性
- **全局可用**: 在任何页面都可快速访问AI助手
- **未读提示**: 智能消息提醒和未读计数显示
- **上下文感知**: 根据当前页面内容提供相关建议
- **实时响应**: WebSocket实现实时消息推送
- **历史记录**: 保存和管理用户对话历史

## 2. 功能需求

### 2.1 核心功能
- **智能对话**: 支持多轮对话，理解上下文语境
- **历史记录**: 保存和管理用户对话历史
- **上下文管理**: 关联项目文档、代码文件等资料
- **实时响应**: WebSocket实时通信，流式响应
- **多媒体支持**: 支持文本、代码、图片等多种内容格式

### 2.2 用户角色权限
- **普通用户**: 基础对话功能，查看个人历史记录
- **项目管理员**: 查看项目相关对话统计，配置项目AI设置
- **系统管理员**: 全局对话监控，系统配置管理

## 3. 前端设计

### 3.1 浮动窗口布局

```typescript
// 浮动对话窗口布局结构
interface FloatingChatLayout {
  floatingTrigger: {
    position: 'bottom-right' | 'bottom-left' | 'custom';
    icon: React.ReactNode;
    unreadCount?: number;
    isOnline: boolean;
  };
  floatingWindow: {
    isVisible: boolean;
    position: { x: number; y: number };
    size: { width: number; height: number };
    isDraggable: boolean;
    isResizable: boolean;
    zIndex: number;
  };
  windowContent: {
    header: {
      title: string;
      actions: WindowAction[];
      dragHandle: boolean;
    };
    messageArea: {
      messageList: MessageListComponent;
      scrollToBottom: boolean;
      virtualScroll: boolean;
    };
    inputArea: {
      textInput: ChatInputComponent;
      quickActions: QuickActionComponent[];
      attachmentSupport: boolean;
    };
  };
  mobileAdaptation: {
    fullScreenMode: boolean;
    swipeGestures: boolean;
    bottomSheet: boolean;
  };
}
```

### 3.2 浮动窗口组件设计

#### 3.2.0 悬浮触发按钮
```typescript
// FloatingChatTrigger.tsx
interface FloatingChatTriggerProps {
  position?: 'bottom-right' | 'bottom-left' | 'custom';
  customPosition?: { bottom: number; right: number; left?: number };
  unreadCount?: number;
  isOnline?: boolean;
  onClick: () => void;
  className?: string;
}

const FloatingChatTrigger: React.FC<FloatingChatTriggerProps> = ({
  position = 'bottom-right',
  customPosition,
  unreadCount = 0,
  isOnline = true,
  onClick,
  className
}) => {
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
      onClick={onClick}
      className={cn(
        "fixed z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700",
        "rounded-full shadow-lg flex items-center justify-center",
        "transition-all duration-200 hover:scale-110",
        "focus:outline-none focus:ring-4 focus:ring-blue-300",
        className
      )}
      style={getPositionStyles()}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {/* AI助手图标 */}
      <MessageCircle className="w-6 h-6 text-white" />
      
      {/* 在线状态指示器 */}
      <div className={cn(
        "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
        isOnline ? "bg-green-500" : "bg-gray-400"
      )} />
      
      {/* 未读消息计数 */}
      {unreadCount > 0 && (
        <motion.div
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs"
          className="rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </motion.div>
      )}
    </motion.button>
  );
};
```

#### 3.2.1 浮动对话窗口容器
```typescript
// FloatingChatWindow.tsx
interface FloatingChatWindowProps {
  isVisible: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  isDraggable?: boolean;
  isResizable?: boolean;
  children: React.ReactNode;
}

const FloatingChatWindow: React.FC<FloatingChatWindowProps> = ({
  isVisible,
  onClose,
  position = { x: window.innerWidth - 400, y: window.innerHeight - 600 },
  size = { width: 380, height: 580 },
  isDraggable = true,
  isResizable = true,
  children
}) => {
  const [windowPosition, setWindowPosition] = useState(position);
  const [windowSize, setWindowSize] = useState(size);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  // 拖拽逻辑
  const { isDragging: dragState, position: dragPosition } = useDraggable({
    nodeRef: windowRef,
    handle: dragRef,
    disabled: !isDraggable,
    onDragStart: () => setIsDragging(true),
    onDragEnd: () => setIsDragging(false),
    bounds: 'parent'
  });

  // 窗口大小调整
  const { size: resizeSize } = useResizable({
    nodeRef: windowRef,
    disabled: !isResizable,
    minSize: { width: 320, height: 400 },
    maxSize: { width: 600, height: 800 }
  });

  // 移动端适配
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  if (isMobile) {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="fixed inset-0 z-50 bg-white"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <MobileChatInterface onClose={onClose}>
              {children}
            </MobileChatInterface>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={windowRef}
          className={cn(
            "fixed z-50 bg-white rounded-lg shadow-2xl border",
            "flex flex-col overflow-hidden",
            isDragging && "cursor-grabbing select-none"
          )}
          style={{
            left: dragPosition?.x ?? windowPosition.x,
            top: dragPosition?.y ?? windowPosition.y,
            width: resizeSize?.width ?? windowSize.width,
            height: resizeSize?.height ?? windowSize.height
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
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* 窗口标题栏 */}
          <div 
            ref={dragRef}
            className={cn(
              "flex items-center justify-between p-3 border-b bg-gray-50",
              isDraggable && "cursor-grab active:cursor-grabbing"
            )}
          >
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-gray-900">AI助手</h3>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWindowSize(prev => ({
                  width: prev.width === 380 ? 480 : 380,
                  height: prev.height
                }))}
                className="w-8 h-8 p-0"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="w-8 h-8 p-0 hover:bg-red-100 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* 窗口内容 */}
          <div className="flex-1 flex flex-col min-h-0">
            {children}
          </div>
          
          {/* 调整大小手柄 */}
          {isResizable && (
            <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize">
              <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-gray-400" />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

### 3.3 UI组件设计

#### 3.2.1 对话消息组件
```typescript
// MessageComponent.tsx
interface MessageProps {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokenUsage?: number;
    processingTime?: number;
  };
  attachments?: Attachment[];
}

const MessageComponent: React.FC<MessageProps> = ({
  id,
  role,
  content,
  timestamp,
  metadata,
  attachments
}) => {
  return (
    <div className={cn(
      "flex gap-3 p-4 rounded-lg",
      role === 'user' 
        ? "bg-blue-50 ml-8" 
        : "bg-gray-50 mr-8"
    )}>
      <Avatar className="w-8 h-8">
        {role === 'user' ? (
          <UserIcon className="w-4 h-4" />
        ) : (
          <BotIcon className="w-4 h-4" />
        )}
      </Avatar>
      
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {role === 'user' ? '您' : 'AI助手'}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(timestamp)}
          </span>
        </div>
        
        <div className="prose prose-sm max-w-none">
          <MarkdownRenderer content={content} />
        </div>
        
        {attachments && (
          <AttachmentList attachments={attachments} />
        )}
        
        {metadata && role === 'assistant' && (
          <MessageMetadata metadata={metadata} />
        )}
      </div>
      
      <MessageActions messageId={id} role={role} />
    </div>
  );
};
```

#### 3.2.2 输入区域组件
```typescript
// ChatInputComponent.tsx
interface ChatInputProps {
  onSendMessage: (message: string, attachments?: File[]) => void;
  isLoading: boolean;
  placeholder?: string;
}

const ChatInputComponent: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  placeholder = "输入您的问题..."
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
    }
  }, [message, attachments, isLoading, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  return (
    <form onSubmit={handleSubmit} className="border-t bg-white p-4">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[60px] max-h-[200px] resize-none"
            disabled={isLoading}
          />
          
          {attachments.length > 0 && (
            <AttachmentPreview 
              attachments={attachments}
              onRemove={setAttachments}
            />
          )}
        </div>
        
        <div className="flex gap-2">
          <FileUploadButton
            onFilesSelected={setAttachments}
            accept=".txt,.md,.js,.ts,.py,.java,.cpp,.c,.json,.xml"
            multiple
          />
          
          <Button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="px-4 py-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};
```

#### 3.2.3 对话历史侧边栏
```typescript
// ConversationSidebar.tsx
interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => 
      conv.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, searchTerm]);

  return (
    <div className="w-80 border-r bg-gray-50 flex flex-col h-full">
      <div className="p-4 border-b">
        <Button 
          onClick={onNewConversation}
          className="w-full mb-4"
          variant="default"
        >
          <Plus className="w-4 h-4 mr-2" />
          新建对话
        </Button>
        
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索对话历史..."
        />
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === currentConversationId}
              onClick={() => onSelectConversation(conversation.id)}
              onDelete={() => onDeleteConversation(conversation.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
```

### 3.3 移动端适配组件

```typescript
// MobileChatInterface.tsx
interface MobileChatInterfaceProps {
  onClose: () => void;
  children: React.ReactNode;
}

const MobileChatInterface: React.FC<MobileChatInterfaceProps> = ({ onClose, children }) => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  
  // 检测虚拟键盘
  useEffect(() => {
    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      setIsKeyboardOpen(viewportHeight < windowHeight * 0.75);
    };
    
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div className="flex flex-col h-full bg-white">
      {/* 移动端标题栏 */}
      <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="font-semibold text-gray-900">AI助手</h2>
            <p className="text-sm text-green-600">在线</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="w-10 h-10 p-0">
            <MoreVertical className="w-5 h-5" />
          </Button>
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
      
      {/* 对话内容区域 */}
      <div className={cn(
        "flex-1 flex flex-col min-h-0",
        isKeyboardOpen && "pb-safe-area-inset-bottom"
      )}>
        {children}
      </div>
    </div>
  );
};
```

### 3.4 键盘快捷键支持

```typescript
// useKeyboardShortcuts.ts
interface KeyboardShortcuts {
  toggleChat: string;
  newConversation: string;
  focusInput: string;
  sendMessage: string;
  closeChat: string;
}

const useKeyboardShortcuts = ({
  onToggleChat,
  onNewConversation,
  onFocusInput,
  onSendMessage,
  onCloseChat
}: {
  onToggleChat: () => void;
  onNewConversation: () => void;
  onFocusInput: () => void;
  onSendMessage: () => void;
  onCloseChat: () => void;
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K: 切换聊天窗口
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        onToggleChat();
        return;
      }
      
      // Ctrl/Cmd + Shift + N: 新建对话
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'N') {
        event.preventDefault();
        onNewConversation();
        return;
      }
      
      // Ctrl/Cmd + /: 聚焦输入框
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        onFocusInput();
        return;
      }
      
      // Enter: 发送消息 (在输入框聚焦时)
      if (event.key === 'Enter' && !event.shiftKey) {
        const target = event.target as HTMLElement;
        if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
          event.preventDefault();
          onSendMessage();
          return;
        }
      }
      
      // Escape: 关闭聊天窗口
      if (event.key === 'Escape') {
        onCloseChat();
        return;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onToggleChat, onNewConversation, onFocusInput, onSendMessage, onCloseChat]);
};
```

### 3.5 未读消息管理

```typescript
// useUnreadMessages.ts
interface UnreadMessage {
  id: string;
  conversationId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
}

interface UnreadMessagesState {
  unreadMessages: UnreadMessage[];
  unreadCount: number;
  lastReadTimestamp: Record<string, Date>;
  
  // Actions
  addUnreadMessage: (message: UnreadMessage) => void;
  markAsRead: (conversationId: string) => void;
  markAllAsRead: () => void;
  getUnreadCount: (conversationId?: string) => number;
}

const useUnreadMessagesStore = create<UnreadMessagesState>((set, get) => ({
  unreadMessages: [],
  unreadCount: 0,
  lastReadTimestamp: {},
  
  addUnreadMessage: (message) => {
    set(state => {
      const newUnreadMessages = [...state.unreadMessages, message];
      return {
        unreadMessages: newUnreadMessages,
        unreadCount: newUnreadMessages.length
      };
    });
    
    // 显示桌面通知
    if (Notification.permission === 'granted') {
      new Notification('AI助手新消息', {
        body: message.content.slice(0, 100),
        icon: '/icons/ai-assistant.png',
        tag: message.conversationId
      });
    }
  },
  
  markAsRead: (conversationId) => {
    const now = new Date();
    set(state => {
      const filteredMessages = state.unreadMessages.filter(
        msg => msg.conversationId !== conversationId
      );
      
      return {
        unreadMessages: filteredMessages,
        unreadCount: filteredMessages.length,
        lastReadTimestamp: {
          ...state.lastReadTimestamp,
          [conversationId]: now
        }
      };
    });
  },
  
  markAllAsRead: () => {
    set({
      unreadMessages: [],
      unreadCount: 0
    });
  },
  
  getUnreadCount: (conversationId) => {
    const { unreadMessages } = get();
    if (conversationId) {
      return unreadMessages.filter(msg => msg.conversationId === conversationId).length;
    }
    return unreadMessages.length;
  }
}));
```

### 3.6 状态管理

```typescript
// useChatStore.ts
interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

interface ChatActions {
  loadConversations: () => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  createNewConversation: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,

  loadConversations: async () => {
    try {
      const response = await fetch('/api/ai/conversations');
      const conversations = await response.json();
      set({ conversations });
    } catch (error) {
      set({ error: '加载对话历史失败' });
    }
  },

  selectConversation: async (id: string) => {
    try {
      set({ isLoading: true });
      const [conversationRes, messagesRes] = await Promise.all([
        fetch(`/api/ai/conversations/${id}`),
        fetch(`/api/ai/conversations/${id}/messages`)
      ]);
      
      const conversation = await conversationRes.json();
      const messages = await messagesRes.json();
      
      set({ 
        currentConversation: conversation,
        messages,
        isLoading: false 
      });
    } catch (error) {
      set({ error: '加载对话失败', isLoading: false });
    }
  },

  sendMessage: async (content: string, attachments?: File[]) => {
    const { currentConversation } = get();
    if (!currentConversation) return;

    try {
      set({ isLoading: true });
      
      // 添加用户消息到本地状态
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: new Date(),
        attachments: attachments?.map(file => ({
          id: generateId(),
          name: file.name,
          type: file.type,
          size: file.size
        }))
      };
      
      set(state => ({
        messages: [...state.messages, userMessage]
      }));

      // 发送消息到后端
      const formData = new FormData();
      formData.append('message', content);
      formData.append('conversationId', currentConversation.id);
      attachments?.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('发送消息失败');
      }

      // WebSocket会处理AI响应的实时更新
      set({ isLoading: false });
    } catch (error) {
      set({ error: '发送消息失败', isLoading: false });
    }
  }
}));
```

### 3.7 多窗口管理系统

```typescript
// MultiWindowManager.ts
interface ChatWindow {
  id: string;
  conversationId: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
  isActive: boolean;
  lastActiveTime: Date;
}

interface MultiWindowState {
  windows: ChatWindow[];
  activeWindowId: string | null;
  maxWindows: number;
  baseZIndex: number;
  
  // Actions
  createWindow: (conversationId: string, title: string) => string;
  closeWindow: (windowId: string) => void;
  activateWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  updateWindowPosition: (windowId: string, position: { x: number; y: number }) => void;
  updateWindowSize: (windowId: string, size: { width: number; height: number }) => void;
  cascadeWindows: () => void;
  tileWindows: () => void;
}

const useMultiWindowStore = create<MultiWindowState>((set, get) => ({
  windows: [],
  activeWindowId: null,
  maxWindows: 3,
  baseZIndex: 1000,
  
  createWindow: (conversationId, title) => {
    const { windows, maxWindows } = get();
    
    // 检查是否已存在该对话的窗口
    const existingWindow = windows.find(w => w.conversationId === conversationId);
    if (existingWindow) {
      get().activateWindow(existingWindow.id);
      return existingWindow.id;
    }
    
    // 如果达到最大窗口数，关闭最旧的窗口
    if (windows.length >= maxWindows) {
      const oldestWindow = windows.reduce((oldest, current) => 
        current.lastActiveTime < oldest.lastActiveTime ? current : oldest
      );
      get().closeWindow(oldestWindow.id);
    }
    
    const windowId = generateId();
    const newWindow: ChatWindow = {
      id: windowId,
      conversationId,
      title,
      position: {
        x: 100 + (windows.length * 30),
        y: 100 + (windows.length * 30)
      },
      size: { width: 380, height: 580 },
      zIndex: get().baseZIndex + windows.length + 1,
      isMinimized: false,
      isActive: true,
      lastActiveTime: new Date()
    };
    
    set(state => ({
      windows: [...state.windows, newWindow],
      activeWindowId: windowId
    }));
    
    return windowId;
  },
  
  activateWindow: (windowId) => {
    set(state => {
      const maxZIndex = Math.max(...state.windows.map(w => w.zIndex));
      
      return {
        windows: state.windows.map(w => ({
          ...w,
          isActive: w.id === windowId,
          zIndex: w.id === windowId ? maxZIndex + 1 : w.zIndex,
          lastActiveTime: w.id === windowId ? new Date() : w.lastActiveTime
        })),
        activeWindowId: windowId
      };
    });
  },
  
  cascadeWindows: () => {
    set(state => ({
      windows: state.windows.map((window, index) => ({
        ...window,
        position: {
          x: 100 + (index * 30),
          y: 100 + (index * 30)
        }
      }))
    }));
  },
  
  tileWindows: () => {
    const { windows } = get();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const cols = Math.ceil(Math.sqrt(windows.length));
    const rows = Math.ceil(windows.length / cols);
    const windowWidth = Math.floor(screenWidth / cols) - 20;
    const windowHeight = Math.floor(screenHeight / rows) - 20;
    
    set(state => ({
      windows: state.windows.map((window, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        return {
          ...window,
          position: {
            x: col * (windowWidth + 10) + 10,
            y: row * (windowHeight + 10) + 10
          },
          size: { width: windowWidth, height: windowHeight }
        };
      })
    }));
  }
}));
```

### 3.8 上下文感知系统

```typescript
// ContextAwareChat.ts
interface PageContext {
  route: string;
  pageTitle: string;
  projectId?: string;
  taskId?: string;
  documentId?: string;
  selectedText?: string;
  pageContent?: string;
  userRole?: string;
}

interface ContextualSuggestion {
  id: string;
  text: string;
  type: 'question' | 'action' | 'help';
  context: string;
  priority: number;
}

const useContextAwareChat = () => {
  const [pageContext, setPageContext] = useState<PageContext | null>(null);
  const [suggestions, setSuggestions] = useState<ContextualSuggestion[]>([]);
  const router = useRouter();
  
  // 监听路由变化，更新页面上下文
  useEffect(() => {
    const updateContext = () => {
      const context: PageContext = {
        route: router.pathname,
        pageTitle: document.title,
        projectId: router.query.projectId as string,
        taskId: router.query.taskId as string,
        documentId: router.query.documentId as string
      };
      
      // 获取选中的文本
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        context.selectedText = selection.toString().trim();
      }
      
      setPageContext(context);
      generateContextualSuggestions(context);
    };
    
    updateContext();
    
    // 监听选择变化
    document.addEventListener('selectionchange', updateContext);
    
    return () => {
      document.removeEventListener('selectionchange', updateContext);
    };
  }, [router]);
  
  const generateContextualSuggestions = async (context: PageContext) => {
    try {
      const response = await fetch('/api/ai/context-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context })
      });
      
      const { suggestions } = await response.json();
      setSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to generate contextual suggestions:', error);
    }
  };
  
  const getContextualPrompt = (userMessage: string): string => {
    if (!pageContext) return userMessage;
    
    let contextPrompt = `当前页面上下文：\n`;
    contextPrompt += `- 页面：${pageContext.pageTitle}\n`;
    contextPrompt += `- 路由：${pageContext.route}\n`;
    
    if (pageContext.projectId) {
      contextPrompt += `- 项目ID：${pageContext.projectId}\n`;
    }
    
    if (pageContext.taskId) {
      contextPrompt += `- 任务ID：${pageContext.taskId}\n`;
    }
    
    if (pageContext.selectedText) {
      contextPrompt += `- 选中文本："${pageContext.selectedText}"\n`;
    }
    
    contextPrompt += `\n用户问题：${userMessage}`;
    
    return contextPrompt;
  };
  
  return {
    pageContext,
    suggestions,
    getContextualPrompt
  };
};
```

### 3.10 智能提示系统

```typescript
// SmartSuggestions.tsx
interface SmartSuggestion {
  id: string;
  text: string;
  type: 'quick_reply' | 'template' | 'context' | 'action';
  category: string;
  confidence: number;
  metadata?: Record<string, any>;
}

const SmartSuggestionsPanel: React.FC = () => {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { pageContext } = useContextAwareChat();
  const { sendMessage } = useChatStore();
  
  // 获取智能建议
  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.length < 2) {
      setSuggestions([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/smart-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          context: pageContext,
          limit: 5
        })
      });
      
      const { suggestions } = await response.json();
      setSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pageContext]);
  
  // 防抖处理
  const debouncedFetchSuggestions = useMemo(
    () => debounce(fetchSuggestions, 300),
    [fetchSuggestions]
  );
  
  const handleSuggestionClick = (suggestion: SmartSuggestion) => {
    sendMessage({
      content: suggestion.text,
      type: 'user',
      metadata: {
        source: 'smart_suggestion',
        suggestionId: suggestion.id
      }
    });
    setSuggestions([]);
  };
  
  return (
    <div className="smart-suggestions-panel">
      {isLoading && (
        <div className="flex items-center gap-2 p-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          正在生成建议...
        </div>
      )}
      
      {suggestions.length > 0 && (
        <div className="suggestions-list max-h-48 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
            >
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-1">
                  {suggestion.type === 'quick_reply' && <MessageSquare className="w-4 h-4 text-blue-500" />}
                  {suggestion.type === 'template' && <FileText className="w-4 h-4 text-green-500" />}
                  {suggestion.type === 'context' && <Brain className="w-4 h-4 text-purple-500" />}
                  {suggestion.type === 'action' && <Zap className="w-4 h-4 text-orange-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.text}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {suggestion.category} • 置信度: {Math.round(suggestion.confidence * 100)}%
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 3.11 性能监控组件

```typescript
// PerformanceMonitor.tsx
interface PerformanceMetrics {
  messageLatency: number;
  renderTime: number;
  memoryUsage: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  errorRate: number;
}

const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    messageLatency: 0,
    renderTime: 0,
    memoryUsage: 0,
    connectionQuality: 'excellent',
    errorRate: 0
  });
  
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceMetrics[]>([]);
  
  // 测量消息延迟
  const measureMessageLatency = useCallback((startTime: number) => {
    const latency = Date.now() - startTime;
    setMetrics(prev => ({ ...prev, messageLatency: latency }));
    
    // 记录到历史
    setPerformanceHistory(prev => {
      const newHistory = [...prev, { ...metrics, messageLatency: latency }];
      return newHistory.slice(-100); // 保留最近100条记录
    });
  }, [metrics]);
  
  // 测量渲染时间
  const measureRenderTime = useCallback(() => {
    const startTime = performance.now();
    
    requestAnimationFrame(() => {
      const renderTime = performance.now() - startTime;
      setMetrics(prev => ({ ...prev, renderTime }));
    });
  }, []);
  
  // 监控内存使用
  useEffect(() => {
    const monitorMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        setMetrics(prev => ({ ...prev, memoryUsage: usagePercent }));
      }
    };
    
    const interval = setInterval(monitorMemory, 5000);
    return () => clearInterval(interval);
  }, []);
  
  // 评估连接质量
  const assessConnectionQuality = useCallback((latency: number, errorCount: number) => {
    let quality: PerformanceMetrics['connectionQuality'];
    
    if (errorCount > 5) {
      quality = 'disconnected';
    } else if (latency > 2000 || errorCount > 2) {
      quality = 'poor';
    } else if (latency > 1000 || errorCount > 0) {
      quality = 'good';
    } else {
      quality = 'excellent';
    }
    
    setMetrics(prev => ({ ...prev, connectionQuality: quality }));
  }, []);
  
  return {
    metrics,
    performanceHistory,
    measureMessageLatency,
    measureRenderTime,
    assessConnectionQuality
  };
};

// 性能指标显示组件
const PerformanceIndicator: React.FC = () => {
  const { metrics } = usePerformanceMonitor();
  const [showDetails, setShowDetails] = useState(false);
  
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'poor': return 'text-orange-500';
      case 'disconnected': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };
  
  return (
    <div className="performance-indicator">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${getQualityColor(metrics.connectionQuality)}`}
      >
        <Activity className="w-3 h-3" />
        {metrics.connectionQuality}
      </button>
      
      {showDetails && (
        <div className="absolute bottom-full right-0 mb-2 p-3 bg-white border rounded-lg shadow-lg text-xs min-w-48">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>消息延迟:</span>
              <span className={metrics.messageLatency > 1000 ? 'text-red-500' : 'text-green-500'}>
                {metrics.messageLatency}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span>渲染时间:</span>
              <span className={metrics.renderTime > 16 ? 'text-orange-500' : 'text-green-500'}>
                {metrics.renderTime.toFixed(1)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span>内存使用:</span>
              <span className={metrics.memoryUsage > 80 ? 'text-red-500' : 'text-green-500'}>
                {metrics.memoryUsage.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>错误率:</span>
              <span className={metrics.errorRate > 5 ? 'text-red-500' : 'text-green-500'}>
                {metrics.errorRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

### 3.12 错误恢复系统

```typescript
// ErrorRecovery.tsx
interface ErrorState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  retryCount: number;
  lastErrorTime: Date | null;
}

class ChatErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error, errorInfo: any) => void },
  ErrorState
> {
  private maxRetries = 3;
  private retryDelay = 1000;
  
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastErrorTime: null
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<ErrorState> {
    return {
      hasError: true,
      error,
      lastErrorTime: new Date()
    };
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ errorInfo });
    
    // 报告错误
    this.props.onError?.(error, errorInfo);
    
    // 记录错误日志
    console.error('Chat Error Boundary caught an error:', error, errorInfo);
    
    // 发送错误报告到监控服务
    this.reportError(error, errorInfo);
  }
  
  private reportError = async (error: Error, errorInfo: any) => {
    try {
      await fetch('/api/error-reporting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          },
          errorInfo,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };
  
  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: this.state.retryCount + 1
        });
      }, this.retryDelay * Math.pow(2, this.state.retryCount));
    }
  };
  
  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastErrorTime: null
    });
  };
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback p-6 text-center">
          <div className="mb-4">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              聊天功能遇到问题
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {this.state.error?.message || '发生了未知错误'}
            </p>
          </div>
          
          <div className="space-y-2">
            {this.state.retryCount < this.maxRetries && (
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                重试 ({this.maxRetries - this.state.retryCount} 次机会)
              </button>
            )}
            
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors ml-2"
            >
              重置聊天
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500">
                错误详情 (开发模式)
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {this.state.error?.stack}
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

### 3.4 WebSocket集成

```typescript
// useWebSocketChat.ts
export const useWebSocketChat = (conversationId?: string) => {
  const { addMessage, updateMessage } = useChatStore();
  const { socket, isConnected } = useWebSocket();

  useEffect(() => {
    if (!socket || !conversationId) return;

    // 加入对话房间
    socket.emit('join_conversation', { conversationId });

    // 监听AI响应
    socket.on('ai_message_start', (data: { messageId: string }) => {
      const assistantMessage: Message = {
        id: data.messageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      };
      addMessage(assistantMessage);
    });

    socket.on('ai_message_chunk', (data: { 
      messageId: string; 
      chunk: string; 
      isComplete: boolean;
    }) => {
      updateMessage(data.messageId, {
        content: data.chunk,
        isStreaming: !data.isComplete
      });
    });

    socket.on('ai_message_complete', (data: {
      messageId: string;
      metadata: MessageMetadata;
    }) => {
      updateMessage(data.messageId, {
        metadata: data.metadata,
        isStreaming: false
      });
    });

    return () => {
      socket.off('ai_message_start');
      socket.off('ai_message_chunk');
      socket.off('ai_message_complete');
      socket.emit('leave_conversation', { conversationId });
    };
  }, [socket, conversationId]);

  return { isConnected };
};
```

## 4. 后端API设计

### 4.1 API接口定义

#### 4.1.1 对话管理接口
```typescript
// /api/ai/conversations - GET
// 获取用户对话列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.aIConversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    });

    return NextResponse.json(conversations);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load conversations' },
      { status: 500 }
    );
  }
}

// /api/ai/conversations - POST
// 创建新对话
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const { title, projectId } = await request.json();

    const conversation = await prisma.aIConversation.create({
      data: {
        userId: user.id,
        projectId,
        title: title || '新对话',
        metadata: {}
      }
    });

    return NextResponse.json(conversation);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
```

#### 4.1.2 消息发送接口
```typescript
// /api/ai/chat - POST
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const formData = await request.formData();
    
    const message = formData.get('message') as string;
    const conversationId = formData.get('conversationId') as string;
    const attachments = formData.getAll('attachments') as File[];

    // 验证权限
    await requireAIPermission(AI_PERMISSIONS.AI_CHAT)(request);

    // 保存用户消息
    const userMessage = await prisma.aIMessage.create({
      data: {
        conversationId,
        role: 'USER',
        content: message,
        metadata: {
          attachments: await processAttachments(attachments)
        }
      }
    });

    // 异步处理AI响应
    processAIResponse(conversationId, message, user.id, attachments);

    return NextResponse.json({ 
      messageId: userMessage.id,
      status: 'processing'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
```

### 4.2 LangChain集成

#### 4.2.1 对话链配置
```typescript
// lib/ai/chat-chain.ts
import { ConversationChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { ConversationBufferWindowMemory } from 'langchain/memory';
import { ChatPromptTemplate } from 'langchain/prompts';

export class AIChatChain {
  private chain: ConversationChain;
  private memory: ConversationBufferWindowMemory;

  constructor(conversationId: string) {
    this.memory = new ConversationBufferWindowMemory({
      k: 10,
      returnMessages: true,
      memoryKey: 'history'
    });

    const llm = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0.7,
      streaming: true,
      callbacks: [
        {
          handleLLMNewToken: (token: string) => {
            this.streamToken(conversationId, token);
          }
        }
      ]
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', this.getSystemPrompt()],
      ['placeholder', '{history}'],
      ['human', '{input}']
    ]);

    this.chain = new ConversationChain({
      llm,
      memory: this.memory,
      prompt
    });
  }

  private getSystemPrompt(): string {
    return `你是一个专业的项目管理AI助手，具备以下能力：
1. 代码分析和解释
2. 技术方案建议
3. 项目管理咨询
4. 文档生成协助
5. 任务规划建议

请始终保持专业、友好的语调，提供准确、有用的信息。
如果遇到不确定的问题，请诚实说明并建议用户寻求更专业的帮助。`;
  }

  private streamToken(conversationId: string, token: string) {
    // 通过WebSocket发送流式响应
    broadcastToConversation(conversationId, 'ai_message_chunk', {
      chunk: token,
      timestamp: new Date()
    });
  }

  async processMessage(
    message: string, 
    context?: {
      projectId?: string;
      fileContext?: string;
      userPreferences?: object;
    }
  ): Promise<string> {
    try {
      // 构建增强的输入
      let enhancedInput = message;
      
      if (context?.fileContext) {
        enhancedInput = `文件上下文：\n${context.fileContext}\n\n用户问题：${message}`;
      }
      
      if (context?.projectId) {
        const projectInfo = await this.getProjectContext(context.projectId);
        enhancedInput = `项目信息：\n${projectInfo}\n\n${enhancedInput}`;
      }

      const response = await this.chain.call({
        input: enhancedInput
      });

      return response.response;
    } catch (error) {
      console.error('AI处理错误:', error);
      throw new Error('AI处理失败，请稍后重试');
    }
  }

  private async getProjectContext(projectId: string): Promise<string> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: { take: 5, orderBy: { updatedAt: 'desc' } },
        members: { include: { user: true } }
      }
    });

    if (!project) return '';

    return `项目名称: ${project.name}
项目描述: ${project.description}
最近任务: ${project.tasks.map(t => t.title).join(', ')}
团队成员: ${project.members.map(m => m.user.name).join(', ')}`;
  }

  async loadConversationHistory(conversationId: string) {
    const messages = await prisma.aIMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    });

    for (const message of messages) {
      if (message.role === 'USER') {
        await this.memory.chatMemory.addUserMessage(message.content);
      } else {
        await this.memory.chatMemory.addAIChatMessage(message.content);
      }
    }
  }
}
```

#### 4.2.2 消息处理服务
```typescript
// lib/ai/message-processor.ts
export async function processAIResponse(
  conversationId: string,
  userMessage: string,
  userId: string,
  attachments?: File[]
) {
  try {
    // 创建AI消息记录
    const aiMessage = await prisma.aIMessage.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: '',
        metadata: { status: 'processing' }
      }
    });

    // 广播开始处理
    broadcastToConversation(conversationId, 'ai_message_start', {
      messageId: aiMessage.id
    });

    // 初始化对话链
    const chatChain = new AIChatChain(conversationId);
    await chatChain.loadConversationHistory(conversationId);

    // 处理附件
    let fileContext = '';
    if (attachments && attachments.length > 0) {
      fileContext = await processFileAttachments(attachments);
    }

    // 获取项目上下文
    const conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId }
    });

    const context = {
      projectId: conversation?.projectId,
      fileContext,
      userPreferences: await getUserPreferences(userId)
    };

    // 处理AI响应
    const response = await chatChain.processMessage(userMessage, context);

    // 更新消息内容
    await prisma.aIMessage.update({
      where: { id: aiMessage.id },
      data: {
        content: response,
        metadata: {
          status: 'completed',
          model: 'gpt-4',
          tokenUsage: calculateTokenUsage(userMessage, response),
          processingTime: Date.now() - aiMessage.createdAt.getTime()
        }
      }
    });

    // 广播完成
    broadcastToConversation(conversationId, 'ai_message_complete', {
      messageId: aiMessage.id,
      content: response
    });

  } catch (error) {
    console.error('AI响应处理失败:', error);
    
    // 广播错误
    broadcastToConversation(conversationId, 'ai_message_error', {
      error: '处理失败，请稍后重试'
    });
  }
}
```

## 5. 数据库设计

### 5.1 数据表结构

```prisma
// 对话表
model AIConversation {
  id          String   @id @default(cuid())
  userId      String
  projectId   String?
  title       String
  metadata    Json?    // 存储对话配置、标签等
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  project     Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)
  messages    AIMessage[]
  
  @@map("ai_conversations")
}

// 消息表
model AIMessage {
  id             String         @id @default(cuid())
  conversationId String
  role           MessageRole
  content        String         @db.Text
  metadata       Json?          // 存储token使用量、处理时间、附件等
  createdAt      DateTime       @default(now())
  
  conversation   AIConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  @@map("ai_messages")
}

// 消息角色枚举
enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}

// AI配置表
model AIConfiguration {
  id          String   @id @default(cuid())
  userId      String?
  projectId   String?
  type        ConfigType
  settings    Json     // 存储模型参数、API配置等
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  project     Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@map("ai_configurations")
}

enum ConfigType {
  GLOBAL
  PROJECT
  USER
}
```

### 5.2 数据访问层

```typescript
// lib/db/ai-repository.ts
export class AIRepository {
  // 对话相关操作
  static async createConversation(data: {
    userId: string;
    projectId?: string;
    title: string;
  }) {
    return prisma.aIConversation.create({
      data,
      include: {
        _count: {
          select: { messages: true }
        }
      }
    });
  }

  static async getConversationsByUser(userId: string) {
    return prisma.aIConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true }
        },
        project: {
          select: { id: true, name: true }
        }
      }
    });
  }

  static async getConversationMessages(conversationId: string) {
    return prisma.aIMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    });
  }

  // 消息相关操作
  static async createMessage(data: {
    conversationId: string;
    role: MessageRole;
    content: string;
    metadata?: object;
  }) {
    const message = await prisma.aIMessage.create({ data });
    
    // 更新对话的最后更新时间
    await prisma.aIConversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() }
    });
    
    return message;
  }

  static async updateMessage(id: string, data: {
    content?: string;
    metadata?: object;
  }) {
    return prisma.aIMessage.update({
      where: { id },
      data
    });
  }

  // 配置相关操作
  static async getAIConfiguration(params: {
    userId?: string;
    projectId?: string;
    type: ConfigType;
  }) {
    return prisma.aIConfiguration.findFirst({
      where: {
        ...params,
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async updateAIConfiguration(id: string, settings: object) {
    return prisma.aIConfiguration.update({
      where: { id },
      data: { settings }
    });
  }
}
```

## 6. 性能优化

### 6.1 前端优化

```typescript
// 消息列表虚拟化
import { FixedSizeList as List } from 'react-window';

const VirtualizedMessageList: React.FC<{
  messages: Message[];
  height: number;
}> = ({ messages, height }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <MessageComponent message={messages[index]} />
    </div>
  );

  return (
    <List
      height={height}
      itemCount={messages.length}
      itemSize={120}
      overscanCount={5}
    >
      {Row}
    </List>
  );
};

// 消息内容懒加载
const LazyMarkdownRenderer = React.lazy(() => import('./MarkdownRenderer'));

const MessageContent: React.FC<{ content: string }> = ({ content }) => {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <LazyMarkdownRenderer content={content} />
    </Suspense>
  );
};
```

### 6.2 后端优化

```typescript
// Redis缓存策略
export class ChatCacheService {
  private redis = new Redis(process.env.REDIS_URL!);

  // 缓存对话历史
  async cacheConversationMessages(conversationId: string, messages: Message[]) {
    const key = `conversation:${conversationId}:messages`;
    await this.redis.setex(key, 3600, JSON.stringify(messages)); // 1小时缓存
  }

  async getCachedMessages(conversationId: string): Promise<Message[] | null> {
    const key = `conversation:${conversationId}:messages`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // 缓存用户配置
  async cacheUserAIConfig(userId: string, config: object) {
    const key = `user:${userId}:ai_config`;
    await this.redis.setex(key, 1800, JSON.stringify(config)); // 30分钟缓存
  }

  // 限流控制
  async checkRateLimit(userId: string): Promise<boolean> {
    const key = `rate_limit:${userId}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, 60); // 1分钟窗口
    }
    
    return current <= 30; // 每分钟最多30次请求
  }
}
```

## 7. 错误处理和监控

### 7.1 错误处理策略

```typescript
// 错误边界组件
class ChatErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chat Error:', error, errorInfo);
    // 发送错误报告到监控服务
    reportError(error, { context: 'chat_component', ...errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h3 className="text-lg font-medium mb-2">对话出现问题</h3>
          <p className="text-gray-600 mb-4">请刷新页面重试，如果问题持续存在请联系技术支持。</p>
          <Button onClick={() => window.location.reload()}>
            刷新页面
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// API错误处理
export function handleAPIError(error: unknown): APIResponse {
  if (error instanceof Error) {
    // 记录错误日志
    logger.error('API Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // 根据错误类型返回不同响应
    if (error.message.includes('rate limit')) {
      return {
        success: false,
        error: '请求过于频繁，请稍后重试',
        code: 'RATE_LIMIT_EXCEEDED'
      };
    }

    if (error.message.includes('unauthorized')) {
      return {
        success: false,
        error: '权限不足',
        code: 'UNAUTHORIZED'
      };
    }
  }

  return {
    success: false,
    error: '服务暂时不可用，请稍后重试',
    code: 'INTERNAL_ERROR'
  };
}
```

### 7.2 监控指标

```typescript
// 性能监控
export class ChatMetrics {
  static recordMessageSent(userId: string, messageLength: number) {
    metrics.increment('chat.messages.sent', {
      userId,
      messageLength: this.categorizeLength(messageLength)
    });
  }

  static recordResponseTime(duration: number, model: string) {
    metrics.histogram('chat.response_time', duration, {
      model,
      duration_category: this.categorizeDuration(duration)
    });
  }

  static recordTokenUsage(tokens: number, model: string) {
    metrics.histogram('chat.token_usage', tokens, { model });
  }

  static recordError(errorType: string, context: string) {
    metrics.increment('chat.errors', {
      error_type: errorType,
      context
    });
  }

  private static categorizeLength(length: number): string {
    if (length < 100) return 'short';
    if (length < 500) return 'medium';
    return 'long';
  }

  private static categorizeDuration(duration: number): string {
    if (duration < 1000) return 'fast';
    if (duration < 5000) return 'normal';
    return 'slow';
  }
}
```

## 8. 测试策略

### 8.1 单元测试

```typescript
// __tests__/components/MessageComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MessageComponent } from '../MessageComponent';

describe('MessageComponent', () => {
  const mockMessage = {
    id: '1',
    role: 'user' as const,
    content: 'Hello, AI!',
    timestamp: new Date('2024-01-01T10:00:00Z')
  };

  it('renders user message correctly', () => {
    render(<MessageComponent {...mockMessage} />);
    
    expect(screen.getByText('您')).toBeInTheDocument();
    expect(screen.getByText('Hello, AI!')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('renders assistant message correctly', () => {
    const assistantMessage = {
      ...mockMessage,
      role: 'assistant' as const
    };
    
    render(<MessageComponent {...assistantMessage} />);
    
    expect(screen.getByText('AI助手')).toBeInTheDocument();
    expect(screen.getByTestId('bot-icon')).toBeInTheDocument();
  });
});
```

### 8.2 集成测试

```typescript
// __tests__/api/chat.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/ai/chat';

describe('/api/ai/chat', () => {
  it('should handle chat message successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        message: 'Hello',
        conversationId: 'test-conversation'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('messageId');
    expect(data.status).toBe('processing');
  });

  it('should handle unauthorized requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { message: 'Hello' }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });
});
```

## 9. 部署配置

### 9.1 环境变量

```bash
# .env.local
# AI服务配置
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
AI_MODEL_DEFAULT=gpt-4
AI_TEMPERATURE=0.7

# Redis配置
REDIS_URL=redis://localhost:6379

# WebSocket配置
WS_PORT=3001
WS_CORS_ORIGIN=http://localhost:3000

# 监控配置
SENTRY_DSN=https://...
METRICS_ENDPOINT=http://localhost:9090
```

### 9.2 Docker配置

```dockerfile
# Dockerfile.ai-service
FROM node:18-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制源码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000 3001

# 启动命令
CMD ["npm", "start"]
```

这个详细设计文档涵盖了AI助手对话页面的完整实现方案，包括前端组件设计、后端API实现、数据库设计、性能优化、错误处理和部署配置等各个方面。文档提供了具体的代码示例和最佳实践，可以直接用于指导开发工作。