export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  conversationId: string;
  attachments?: Attachment[];
  metadata?: Record<string, any>;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  lastMessage?: Message;
  isArchived?: boolean;
  tags?: string[];
}

export interface ChatSettings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  autoScroll: boolean;
  showTimestamps: boolean;
  compactMode: boolean;
}

export interface ChatState {
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
  settings: ChatSettings;
}

export interface ChatActions {
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
  updateMessage: (
    conversationId: string,
    messageId: string,
    updates: Partial<Message>
  ) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  clearMessages: (conversationId: string) => void;

  // UI操作
  updateWindowPosition: (position: { x: number; y: number }) => void;
  updateWindowSize: (size: { width: number; height: number }) => void;
  incrementUnreadCount: () => void;
  resetUnreadCount: () => void;

  // 设置操作
  updateSettings: (settings: Partial<ChatSettings>) => void;
}

export type ChatStore = ChatState & ChatActions;

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'read' | 'error' | 'connected';
  data: {
    conversationId?: string;
    content?: string;
    messageType?: 'text' | 'image' | 'file';
    timestamp?: string;
    messageId?: string;
    senderId?: string;
    senderName?: string;
    metadata?: any;
  };
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface DragBounds {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export interface UseDraggableOptions {
  nodeRef: React.RefObject<HTMLElement>;
  handle?: React.RefObject<HTMLElement>;
  disabled?: boolean;
  bounds?: 'viewport' | 'parent' | DragBounds;
  onDragStart?: (position: Position) => void;
  onDrag?: (position: Position) => void;
  onDragEnd?: (position: Position) => void;
  initialPosition?: Position;
}

export interface UseResizableOptions {
  nodeRef: React.RefObject<HTMLElement>;
  disabled?: boolean;
  minSize?: Size;
  maxSize?: Size;
  onResize?: (size: Size) => void;
  initialSize?: Size;
}

export interface ChatErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export interface MessageCacheOptions {
  maxSize?: number;
  ttl?: number; // Time to live in milliseconds
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  retryable?: boolean;
}

export interface FloatingChatTriggerProps {
  position?: Position;
  size?: 'small' | 'default' | 'large';
  className?: string;
  draggable?: boolean;
  snapToEdge?: boolean;
  onPositionChange?: (position: Position) => void;
}

export interface MobileChatInterfaceProps {
  onClose: () => void;
}

export interface VirtualMessageListProps {
  messages: Message[];
  height: number;
  itemHeight?: number;
  onLoadMore?: () => void;
}

export interface ChatDevToolsProps {
  enabled?: boolean;
}

export interface UseWebSocketChatOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}
