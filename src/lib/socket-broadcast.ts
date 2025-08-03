import { io as ioClient, Socket } from 'socket.io-client';

// Socket.io广播服务
class SocketBroadcastService {
  private socket: Socket | null = null;
  private isConnected = false;

  constructor() {
    this.connect();
  }

  private async connect() {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

      // 获取服务端认证token
      const token = await this.getServerToken();

      this.socket = ioClient(wsUrl, {
        auth: {
          token,
          serverClient: true // 标识这是服务端客户端
        },
        transports: ['websocket']
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('Socket.io broadcast service connected');
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        console.log('Socket.io broadcast service disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.io broadcast service connection error:', error);
      });
    } catch (error) {
      console.error('Failed to connect broadcast service:', error);
    }
  }

  private async getServerToken(): Promise<string> {
    // 在服务端环境中，我们可以直接生成token或使用系统密钥
    // 这里简化处理，实际应用中应该有更安全的认证机制
    return 'server-broadcast-token';
  }

  // 广播新消息
  public broadcastMessage(data: {
    conversationId: string;
    type: 'project' | 'private';
    message: any;
    excludeUserId?: string;
  }) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket.io not connected, cannot broadcast message');
      return;
    }

    const roomName = `${data.type}:${data.conversationId}`;

    this.socket.emit('server:broadcast:message', {
      room: roomName,
      event: 'message:new',
      data: data.message,
      excludeUserId: data.excludeUserId
    });

    console.log(`Broadcasted message to room: ${roomName}`);
  }

  // 广播消息已读状态
  public broadcastMessageRead(data: {
    conversationId: string;
    type: 'project' | 'private';
    messageId: string;
    readBy: string;
    excludeUserId?: string;
  }) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket.io not connected, cannot broadcast read status');
      return;
    }

    const roomName = `${data.type}:${data.conversationId}`;

    this.socket.emit('server:broadcast:message', {
      room: roomName,
      event: 'message:read',
      data: {
        messageId: data.messageId,
        conversationId: data.conversationId,
        readBy: data.readBy,
        timestamp: new Date().toISOString()
      },
      excludeUserId: data.excludeUserId
    });
  }

  // 广播项目通知
  public broadcastProjectNotification(data: {
    projectId: string;
    notification: any;
    targetUsers?: string[];
  }) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket.io not connected, cannot broadcast notification');
      return;
    }

    this.socket.emit('server:broadcast:notification', {
      projectId: data.projectId,
      notification: data.notification,
      targetUsers: data.targetUsers
    });

    console.log(
      `Broadcasted project notification for project: ${data.projectId}`
    );
  }

  // 广播用户状态变化
  public broadcastUserStatus(data: {
    userId: string;
    status: 'online' | 'offline' | 'away' | 'busy';
    projectIds?: string[];
  }) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket.io not connected, cannot broadcast user status');
      return;
    }

    this.socket.emit('server:broadcast:user-status', {
      userId: data.userId,
      status: data.status,
      projectIds: data.projectIds,
      timestamp: new Date().toISOString()
    });
  }

  // 断开连接
  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // 获取连接状态
  public get connected(): boolean {
    return this.isConnected;
  }
}

// 单例实例
let broadcastService: SocketBroadcastService | null = null;

export function getBroadcastService(): SocketBroadcastService {
  if (!broadcastService) {
    broadcastService = new SocketBroadcastService();
  }
  return broadcastService;
}

export function destroyBroadcastService(): void {
  if (broadcastService) {
    broadcastService.disconnect();
    broadcastService = null;
  }
}

export { SocketBroadcastService };
