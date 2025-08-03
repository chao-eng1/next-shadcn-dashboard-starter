import { useMessageStore } from '@/store/message-store';
import type { Message, Conversation, UserStatus } from '@/store/message-store';
import { toast } from 'sonner';

// WebSocket消息类型
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  id?: string;
}

// 消息类型定义
export const MESSAGE_TYPES = {
  // 连接相关
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  PING: 'ping',
  PONG: 'pong',
  
  // 消息相关
  MESSAGE_SEND: 'message:send',
  MESSAGE_RECEIVE: 'message:receive',
  MESSAGE_UPDATE: 'message:update',
  MESSAGE_DELETE: 'message:delete',
  MESSAGE_READ: 'message:read',
  MESSAGE_TYPING: 'message:typing',
  
  // 会话相关
  CONVERSATION_JOIN: 'conversation:join',
  CONVERSATION_LEAVE: 'conversation:leave',
  CONVERSATION_UPDATE: 'conversation:update',
  
  // 用户状态
  USER_STATUS: 'user:status',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  
  // 通知相关
  NOTIFICATION: 'notification',
  
  // 错误处理
  ERROR: 'error'
} as const;

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];

// WebSocket配置
interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  timeout: number;
  debug: boolean;
}

// 默认配置
const defaultConfig: WebSocketConfig = {
  url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws',
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  timeout: 5000,
  debug: process.env.NODE_ENV === 'development'
};

// 事件监听器类型
type EventListener = (data: any) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private isConnecting = false;
  private isDestroyed = false;
  private messageQueue: WebSocketMessage[] = [];
  private eventListeners: Map<string, EventListener[]> = new Map();
  private pendingMessages: Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }> = new Map();
  
  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.setupStoreListeners();
  }
  
  // 设置store监听器
  private setupStoreListeners() {
    // 监听store状态变化，自动处理连接
    const store = useMessageStore.getState();
    if (store.currentUserId) {
      this.connect();
    }
  }
  
  // 连接WebSocket
  public async connect(userId?: string): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('WebSocket service has been destroyed');
    }
    
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }
    
    this.isConnecting = true;
    const store = useMessageStore.getState();
    store.setConnectionStatus('connecting');
    
    try {
      const wsUrl = userId ? `${this.config.url}?userId=${userId}` : this.config.url;
      this.ws = new WebSocket(wsUrl, this.config.protocols);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      
      this.log('Connecting to WebSocket...', wsUrl);
      
    } catch (error) {
      this.isConnecting = false;
      this.handleError(error);
      throw error;
    }
  }
  
  // 断开连接
  public disconnect(): void {
    this.clearTimers();
    
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Client disconnect');
      }
      
      this.ws = null;
    }
    
    this.isConnecting = false;
    const store = useMessageStore.getState();
    store.setConnectionStatus('disconnected');
    
    this.log('Disconnected from WebSocket');
  }
  
  // 销毁服务
  public destroy(): void {
    this.isDestroyed = true;
    this.disconnect();
    this.eventListeners.clear();
    this.pendingMessages.forEach(({ timeout }) => clearTimeout(timeout));
    this.pendingMessages.clear();
    this.messageQueue = [];
  }
  
  // 发送消息
  public async send(type: MessageType, data: any, expectResponse = false): Promise<any> {
    const message: WebSocketMessage = {
      type,
      data,
      timestamp: Date.now(),
      id: expectResponse ? this.generateMessageId() : undefined
    };
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      this.log('Sent message:', message);
      
      if (expectResponse && message.id) {
        return this.waitForResponse(message.id);
      }
    } else {
      // 如果连接断开，将消息加入队列
      this.messageQueue.push(message);
      this.log('Message queued:', message);
      
      // 尝试重连
      if (!this.isConnecting) {
        this.reconnect();
      }
      
      if (expectResponse) {
        throw new Error('Cannot send message: WebSocket not connected');
      }
    }
  }
  
  // 等待响应
  private waitForResponse(messageId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingMessages.delete(messageId);
        reject(new Error('Message timeout'));
      }, this.config.timeout);
      
      this.pendingMessages.set(messageId, { resolve, reject, timeout });
    });
  }
  
  // 处理连接打开
  private handleOpen(event: Event): void {
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    const store = useMessageStore.getState();
    store.setConnectionStatus('connected');
    store.resetReconnectAttempts();
    
    this.log('WebSocket connected');
    
    // 开始心跳
    this.startHeartbeat();
    
    // 发送队列中的消息
    this.flushMessageQueue();
    
    // 触发连接事件
    this.emit('connected', event);
    
    // 加入当前选中的会话
    const selectedConversationId = store.selectedConversationId;
    if (selectedConversationId) {
      this.joinConversation(selectedConversationId);
    }
  }
  
  // 处理消息接收
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.log('Received message:', message);
      
      // 处理响应消息
      if (message.id && this.pendingMessages.has(message.id)) {
        const pending = this.pendingMessages.get(message.id)!;
        clearTimeout(pending.timeout);
        this.pendingMessages.delete(message.id);
        pending.resolve(message.data);
        return;
      }
      
      // 处理不同类型的消息
      switch (message.type) {
        case MESSAGE_TYPES.PONG:
          this.log('Received pong');
          break;
          
        case MESSAGE_TYPES.MESSAGE_RECEIVE:
          this.handleMessageReceive(message.data);
          break;
          
        case MESSAGE_TYPES.MESSAGE_UPDATE:
          this.handleMessageUpdate(message.data);
          break;
          
        case MESSAGE_TYPES.MESSAGE_DELETE:
          this.handleMessageDelete(message.data);
          break;
          
        case MESSAGE_TYPES.MESSAGE_READ:
          this.handleMessageRead(message.data);
          break;
          
        case MESSAGE_TYPES.MESSAGE_TYPING:
          this.handleTypingStatus(message.data);
          break;
          
        case MESSAGE_TYPES.CONVERSATION_UPDATE:
          this.handleConversationUpdate(message.data);
          break;
          
        case MESSAGE_TYPES.USER_STATUS:
          this.handleUserStatus(message.data);
          break;
          
        case MESSAGE_TYPES.NOTIFICATION:
          this.handleNotification(message.data);
          break;
          
        case MESSAGE_TYPES.ERROR:
          this.handleServerError(message.data);
          break;
          
        default:
          this.log('Unknown message type:', message.type);
      }
      
      // 触发通用消息事件
      this.emit('message', message);
      this.emit(message.type, message.data);
      
    } catch (error) {
      this.log('Error parsing message:', error);
    }
  }
  
  // 处理连接关闭
  private handleClose(event: CloseEvent): void {
    this.isConnecting = false;
    this.clearTimers();
    
    const store = useMessageStore.getState();
    
    this.log('WebSocket closed:', event.code, event.reason);
    
    // 触发断开事件
    this.emit('disconnected', event);
    
    // 如果不是正常关闭且未被销毁，尝试重连
    if (event.code !== 1000 && !this.isDestroyed) {
      store.setConnectionStatus('reconnecting');
      this.reconnect();
    } else {
      store.setConnectionStatus('disconnected');
    }
  }
  
  // 处理错误
  private handleError(error: any): void {
    this.log('WebSocket error:', error);
    this.emit('error', error);
    
    const store = useMessageStore.getState();
    store.setConnectionStatus('disconnected');
  }
  
  // 重连
  private reconnect(): void {
    if (this.isDestroyed || this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log('Max reconnect attempts reached or service destroyed');
      return;
    }
    
    this.reconnectAttempts++;
    const store = useMessageStore.getState();
    store.incrementReconnectAttempts();
    
    this.log(`Reconnecting... (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.config.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1));
  }
  
  // 开始心跳
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send(MESSAGE_TYPES.PING, {});
      }
    }, this.config.heartbeatInterval);
  }
  
  // 清除定时器
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  // 发送队列中的消息
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()!;
      this.ws.send(JSON.stringify(message));
      this.log('Sent queued message:', message);
    }
  }
  
  // 生成消息ID
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // 日志输出
  private log(...args: any[]): void {
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.log('[WebSocket]', ...args);
    }
  }
  
  // 事件监听
  public on(event: string, listener: EventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }
  
  // 移除事件监听
  public off(event: string, listener: EventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  // 触发事件
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          this.log('Error in event listener:', error);
        }
      });
    }
  }
  
  // 消息处理方法
  private handleMessageReceive(data: Message): void {
    const store = useMessageStore.getState();
    store.addMessage(data);
    
    // 如果不是当前选中的会话，显示通知
    if (data.conversationId !== store.selectedConversationId) {
      this.showNotification(data);
    }
  }
  
  private handleMessageUpdate(data: { conversationId: string; messageId: string; updates: Partial<Message> }): void {
    const store = useMessageStore.getState();
    store.updateMessage(data.conversationId, data.messageId, data.updates);
  }
  
  private handleMessageDelete(data: { conversationId: string; messageId: string }): void {
    const store = useMessageStore.getState();
    store.removeMessage(data.conversationId, data.messageId);
  }
  
  private handleMessageRead(data: { conversationId: string; messageId: string; userId: string }): void {
    const store = useMessageStore.getState();
    if (data.userId !== store.currentUserId) {
      store.markMessageAsRead(data.conversationId, data.messageId);
    }
  }
  
  private handleTypingStatus(data: { conversationId: string; userId: string; userName: string; isTyping: boolean }): void {
    const store = useMessageStore.getState();
    if (data.userId !== store.currentUserId) {
      store.setTypingStatus(data.conversationId, data.userId, data.userName, data.isTyping);
    }
  }
  
  private handleConversationUpdate(data: { conversationId: string; updates: Partial<Conversation> }): void {
    const store = useMessageStore.getState();
    store.updateConversation(data.conversationId, data.updates);
  }
  
  private handleUserStatus(data: UserStatus): void {
    const store = useMessageStore.getState();
    store.setUserStatus(data.id, data);
  }
  
  private handleNotification(data: any): void {
    toast.info(data.message || '您有新的通知');
  }
  
  private handleServerError(data: { code: string; message: string }): void {
    this.log('Server error:', data);
    toast.error(data.message || '服务器错误');
  }
  
  private showNotification(message: Message): void {
    const store = useMessageStore.getState();
    const settings = store.notificationSettings;
    
    if (!settings.browserNotifications) return;
    
    // 检查免打扰模式
    if (settings.doNotDisturb.enabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const startTime = this.parseTime(settings.doNotDisturb.startTime);
      const endTime = this.parseTime(settings.doNotDisturb.endTime);
      
      if (this.isInDoNotDisturbTime(currentTime, startTime, endTime)) {
        return;
      }
    }
    
    // 显示通知
    const title = settings.showSender ? message.sender.name : '新消息';
    const body = settings.showPreview ? message.content : '您有一条新消息';
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: message.sender.avatar || '/favicon.ico',
        tag: message.conversationId
      });
    }
    
    // 播放提示音
    if (settings.soundEnabled) {
      this.playNotificationSound();
    }
  }
  
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  private isInDoNotDisturbTime(currentTime: number, startTime: number, endTime: number): boolean {
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  }
  
  private playNotificationSound(): void {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      const store = useMessageStore.getState();
      audio.volume = store.notificationSettings.soundVolume;
      audio.play().catch(error => {
        this.log('Error playing notification sound:', error);
      });
    } catch (error) {
      this.log('Error creating audio:', error);
    }
  }
  
  // 公共API方法
  public sendMessage(conversationId: string, content: string, type: string = 'text', attachments?: any[]): void {
    this.send(MESSAGE_TYPES.MESSAGE_SEND, {
      conversationId,
      content,
      type,
      attachments
    });
  }
  
  public joinConversation(conversationId: string): void {
    this.send(MESSAGE_TYPES.CONVERSATION_JOIN, { conversationId });
  }
  
  public leaveConversation(conversationId: string): void {
    this.send(MESSAGE_TYPES.CONVERSATION_LEAVE, { conversationId });
  }
  
  public sendTypingStatus(conversationId: string, isTyping: boolean): void {
    this.send(MESSAGE_TYPES.MESSAGE_TYPING, { conversationId, isTyping });
  }
  
  public updateUserStatus(status: 'online' | 'away' | 'busy' | 'offline', customMessage?: string): void {
    this.send(MESSAGE_TYPES.USER_STATUS, { status, customMessage });
  }
  
  public markMessageAsRead(conversationId: string, messageId: string): void {
    this.send(MESSAGE_TYPES.MESSAGE_READ, { conversationId, messageId });
  }
  
  // 获取连接状态
  public get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
  
  public get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

// 单例实例
let wsService: WebSocketService | null = null;

export function getWebSocketService(): WebSocketService {
  if (!wsService) {
    wsService = new WebSocketService();
  }
  return wsService;
}

export function destroyWebSocketService(): void {
  if (wsService) {
    wsService.destroy();
    wsService = null;
  }
}