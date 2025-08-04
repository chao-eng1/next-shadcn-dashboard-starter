# AI对话后端技术文档

## 1. 项目概述

本文档详细描述AI对话功能的后端技术实现方案，包括API设计、WebSocket实时通信、数据库架构、AI模型集成、安全认证等核心技术要点。

### 1.1 技术栈
- **运行时**: Node.js 18+
- **框架**: Express.js + Socket.io
- **数据库**: PostgreSQL + Prisma ORM
- **缓存**: Redis
- **AI集成**: OpenAI API / 本地模型
- **认证**: JWT + Passport.js
- **文件存储**: AWS S3 / 本地存储
- **消息队列**: Bull Queue (Redis)
- **监控**: Winston + Prometheus

### 1.2 核心特性
- RESTful API设计
- WebSocket实时通信
- 流式响应处理
- 多模态消息支持
- 会话管理和持久化
- 安全认证和授权
- 性能优化和缓存
- 错误处理和日志记录

## 2. 系统架构设计

### 2.1 整体架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端应用      │    │   API网关       │    │   AI服务        │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (OpenAI)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WebSocket     │    │   业务逻辑      │    │   数据库        │
│   (Socket.io)   │◄──►│   (Services)    │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   消息队列      │    │   缓存层        │    │   文件存储      │
│   (Bull Queue)  │◄──►│   (Redis)       │◄──►│   (AWS S3)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2.2 目录结构

```
src/
├── controllers/          # 控制器层
│   ├── auth.controller.ts
│   ├── chat.controller.ts
│   └── conversation.controller.ts
├── services/             # 业务逻辑层
│   ├── ai.service.ts
│   ├── chat.service.ts
│   ├── conversation.service.ts
│   └── websocket.service.ts
├── models/               # 数据模型
│   ├── conversation.model.ts
│   ├── message.model.ts
│   └── user.model.ts
├── middleware/           # 中间件
│   ├── auth.middleware.ts
│   ├── validation.middleware.ts
│   └── rate-limit.middleware.ts
├── routes/               # 路由定义
│   ├── auth.routes.ts
│   ├── chat.routes.ts
│   └── conversation.routes.ts
├── utils/                # 工具函数
│   ├── logger.ts
│   ├── cache.ts
│   └── encryption.ts
├── config/               # 配置文件
│   ├── database.ts
│   ├── redis.ts
│   └── ai.ts
└── types/                # 类型定义
    ├── chat.types.ts
    └── api.types.ts
```

## 3. 数据库设计

### 3.1 Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String?  @unique
  avatar    String?
  role      UserRole @default(USER)
  
  // 认证相关
  passwordHash String?
  emailVerified Boolean @default(false)
  
  // 时间戳
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  lastActiveAt DateTime @default(now())
  
  // 关联关系
  conversations ConversationParticipant[]
  messages      Message[]
  sessions      UserSession[]
  
  @@map("users")
}

model Conversation {
  id          String   @id @default(cuid())
  title       String   @default("新对话")
  description String?
  
  // 对话设置
  isArchived  Boolean @default(false)
  isDeleted   Boolean @default(false)
  settings    Json?   // 对话特定设置
  
  // 时间戳
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  lastMessageAt DateTime?
  
  // 关联关系
  participants ConversationParticipant[]
  messages     Message[]
  
  @@map("conversations")
}

model ConversationParticipant {
  id             String   @id @default(cuid())
  conversationId String
  userId         String
  
  // 参与者设置
  role           ParticipantRole @default(MEMBER)
  joinedAt       DateTime @default(now())
  lastReadAt     DateTime @default(now())
  
  // 关联关系
  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([conversationId, userId])
  @@map("conversation_participants")
}

model Message {
  id             String   @id @default(cuid())
  conversationId String
  userId         String?
  
  // 消息内容
  content        String
  role           MessageRole
  type           MessageType @default(TEXT)
  
  // 消息元数据
  metadata       Json?    // 扩展数据
  parentId       String?  // 回复消息ID
  threadId       String?  // 线程ID
  
  // 状态
  status         MessageStatus @default(SENT)
  isEdited       Boolean @default(false)
  isDeleted      Boolean @default(false)
  
  // 时间戳
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  editedAt  DateTime?
  
  // 关联关系
  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user         User?        @relation(fields: [userId], references: [id], onDelete: SetNull)
  parent       Message?     @relation("MessageReplies", fields: [parentId], references: [id])
  replies      Message[]    @relation("MessageReplies")
  attachments  Attachment[]
  reactions    MessageReaction[]
  
  @@index([conversationId, createdAt])
  @@index([userId])
  @@map("messages")
}

model Attachment {
  id        String   @id @default(cuid())
  messageId String
  
  // 文件信息
  filename     String
  originalName String
  mimeType     String
  size         Int
  url          String
  
  // 元数据
  metadata Json? // 图片尺寸、视频时长等
  
  // 时间戳
  createdAt DateTime @default(now())
  
  // 关联关系
  message Message @relation(fields: [messageId], references: [id], onDelete: Cascade)
  
  @@map("attachments")
}

model MessageReaction {
  id        String   @id @default(cuid())
  messageId String
  userId    String
  emoji     String
  
  // 时间戳
  createdAt DateTime @default(now())
  
  // 关联关系
  message Message @relation(fields: [messageId], references: [id], onDelete: Cascade)
  
  @@unique([messageId, userId, emoji])
  @@map("message_reactions")
}

model UserSession {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  
  // 会话信息
  userAgent String?
  ipAddress String?
  
  // 时间戳
  createdAt DateTime @default(now())
  expiresAt DateTime
  lastUsedAt DateTime @default(now())
  
  // 关联关系
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("user_sessions")
}

// 枚举类型
enum UserRole {
  USER
  ADMIN
  MODERATOR
}

enum ParticipantRole {
  OWNER
  ADMIN
  MEMBER
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}

enum MessageType {
  TEXT
  IMAGE
  FILE
  AUDIO
  VIDEO
  CODE
  MARKDOWN
}

enum MessageStatus {
  SENDING
  SENT
  DELIVERED
  READ
  FAILED
}
```

### 3.2 数据库配置

```typescript
// src/config/database.ts
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

class DatabaseService {
  private static instance: PrismaClient;
  
  static getInstance(): PrismaClient {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new PrismaClient({
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'info' },
          { emit: 'event', level: 'warn' },
        ],
        errorFormat: 'pretty',
      });
      
      // 日志记录
      DatabaseService.instance.$on('query', (e) => {
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Database Query', {
            query: e.query,
            params: e.params,
            duration: e.duration
          });
        }
      });
      
      DatabaseService.instance.$on('error', (e) => {
        logger.error('Database Error', e);
      });
    }
    
    return DatabaseService.instance;
  }
  
  static async connect(): Promise<void> {
    try {
      await DatabaseService.getInstance().$connect();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Database connection failed', error);
      throw error;
    }
  }
  
  static async disconnect(): Promise<void> {
    try {
      await DatabaseService.getInstance().$disconnect();
      logger.info('Database disconnected');
    } catch (error) {
      logger.error('Database disconnection failed', error);
    }
  }
  
  static async healthCheck(): Promise<boolean> {
    try {
      await DatabaseService.getInstance().$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed', error);
      return false;
    }
  }
}

export const prisma = DatabaseService.getInstance();
export { DatabaseService };
```

## 4. API设计

### 4.1 RESTful API路由

```typescript
// src/routes/chat.routes.ts
import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';
import { 
  sendMessageSchema, 
  getMessagesSchema,
  updateMessageSchema 
} from '../schemas/chat.schemas';

const router = Router();
const chatController = new ChatController();

// 应用认证中间件
router.use(authMiddleware);

// 发送消息
router.post(
  '/conversations/:conversationId/messages',
  rateLimitMiddleware({ windowMs: 60000, max: 30 }), // 每分钟30条消息
  validateRequest(sendMessageSchema),
  chatController.sendMessage
);

// 获取消息列表
router.get(
  '/conversations/:conversationId/messages',
  validateRequest(getMessagesSchema),
  chatController.getMessages
);

// 更新消息
router.patch(
  '/messages/:messageId',
  validateRequest(updateMessageSchema),
  chatController.updateMessage
);

// 删除消息
router.delete(
  '/messages/:messageId',
  chatController.deleteMessage
);

// 消息反应
router.post(
  '/messages/:messageId/reactions',
  chatController.addReaction
);

router.delete(
  '/messages/:messageId/reactions/:emoji',
  chatController.removeReaction
);

// 标记消息为已读
router.post(
  '/conversations/:conversationId/read',
  chatController.markAsRead
);

// 搜索消息
router.get(
  '/conversations/:conversationId/search',
  chatController.searchMessages
);

export { router as chatRoutes };
```

### 4.2 对话管理API

```typescript
// src/routes/conversation.routes.ts
import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { 
  createConversationSchema,
  updateConversationSchema,
  addParticipantSchema 
} from '../schemas/conversation.schemas';

const router = Router();
const conversationController = new ConversationController();

router.use(authMiddleware);

// 创建对话
router.post(
  '/',
  validateRequest(createConversationSchema),
  conversationController.createConversation
);

// 获取用户对话列表
router.get(
  '/',
  conversationController.getUserConversations
);

// 获取对话详情
router.get(
  '/:conversationId',
  conversationController.getConversation
);

// 更新对话
router.patch(
  '/:conversationId',
  validateRequest(updateConversationSchema),
  conversationController.updateConversation
);

// 删除对话
router.delete(
  '/:conversationId',
  conversationController.deleteConversation
);

// 归档对话
router.post(
  '/:conversationId/archive',
  conversationController.archiveConversation
);

// 添加参与者
router.post(
  '/:conversationId/participants',
  validateRequest(addParticipantSchema),
  conversationController.addParticipant
);

// 移除参与者
router.delete(
  '/:conversationId/participants/:userId',
  conversationController.removeParticipant
);

export { router as conversationRoutes };
```

### 4.3 控制器实现

```typescript
// src/controllers/chat.controller.ts
import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service';
import { WebSocketService } from '../services/websocket.service';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types/api.types';
import { AuthenticatedRequest } from '../types/auth.types';

export class ChatController {
  private chatService: ChatService;
  private wsService: WebSocketService;
  
  constructor() {
    this.chatService = new ChatService();
    this.wsService = WebSocketService.getInstance();
  }
  
  sendMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { conversationId } = req.params;
      const { content, type = 'TEXT', attachments = [] } = req.body;
      const userId = req.user!.id;
      
      logger.info('Sending message', {
        userId,
        conversationId,
        contentLength: content.length,
        type
      });
      
      // 验证用户是否有权限发送消息
      const hasPermission = await this.chatService.checkSendPermission(
        userId,
        conversationId
      );
      
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: 'No permission to send message in this conversation'
        } as ApiResponse);
        return;
      }
      
      // 创建消息
      const message = await this.chatService.createMessage({
        conversationId,
        userId,
        content,
        type,
        attachments
      });
      
      // 通过WebSocket广播消息
      this.wsService.broadcastToConversation(conversationId, 'message:new', {
        message,
        conversationId
      });
      
      // 如果是用户消息，触发AI回复
      if (message.role === 'USER') {
        // 异步处理AI回复，不阻塞响应
        this.chatService.generateAIResponse(conversationId, message.id)
          .catch(error => {
            logger.error('AI response generation failed', {
              error,
              conversationId,
              messageId: message.id
            });
          });
      }
      
      res.status(201).json({
        success: true,
        data: message
      } as ApiResponse);
      
    } catch (error) {
      logger.error('Send message failed', {
        error,
        userId: req.user?.id,
        conversationId: req.params.conversationId
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to send message'
      } as ApiResponse);
    }
  };
  
  getMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { conversationId } = req.params;
      const { 
        page = 1, 
        limit = 50, 
        before, 
        after 
      } = req.query;
      
      const userId = req.user!.id;
      
      // 验证用户是否有权限查看消息
      const hasPermission = await this.chatService.checkReadPermission(
        userId,
        conversationId
      );
      
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: 'No permission to read messages in this conversation'
        } as ApiResponse);
        return;
      }
      
      const result = await this.chatService.getMessages({
        conversationId,
        page: Number(page),
        limit: Math.min(Number(limit), 100), // 限制最大50条
        before: before as string,
        after: after as string
      });
      
      res.json({
        success: true,
        data: result
      } as ApiResponse);
      
    } catch (error) {
      logger.error('Get messages failed', {
        error,
        userId: req.user?.id,
        conversationId: req.params.conversationId
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to get messages'
      } as ApiResponse);
    }
  };
  
  updateMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { messageId } = req.params;
      const { content } = req.body;
      const userId = req.user!.id;
      
      // 验证消息所有权
      const message = await this.chatService.getMessage(messageId);
      if (!message || message.userId !== userId) {
        res.status(403).json({
          success: false,
          error: 'No permission to update this message'
        } as ApiResponse);
        return;
      }
      
      const updatedMessage = await this.chatService.updateMessage(messageId, {
        content,
        isEdited: true,
        editedAt: new Date()
      });
      
      // 广播消息更新
      this.wsService.broadcastToConversation(
        message.conversationId,
        'message:updated',
        { message: updatedMessage }
      );
      
      res.json({
        success: true,
        data: updatedMessage
      } as ApiResponse);
      
    } catch (error) {
      logger.error('Update message failed', {
        error,
        userId: req.user?.id,
        messageId: req.params.messageId
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to update message'
      } as ApiResponse);
    }
  };
  
  deleteMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { messageId } = req.params;
      const userId = req.user!.id;
      
      // 验证消息所有权或管理员权限
      const message = await this.chatService.getMessage(messageId);
      if (!message) {
        res.status(404).json({
          success: false,
          error: 'Message not found'
        } as ApiResponse);
        return;
      }
      
      const hasPermission = message.userId === userId || 
                           req.user!.role === 'ADMIN';
      
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: 'No permission to delete this message'
        } as ApiResponse);
        return;
      }
      
      await this.chatService.deleteMessage(messageId);
      
      // 广播消息删除
      this.wsService.broadcastToConversation(
        message.conversationId,
        'message:deleted',
        { messageId }
      );
      
      res.json({
        success: true,
        message: 'Message deleted successfully'
      } as ApiResponse);
      
    } catch (error) {
      logger.error('Delete message failed', {
        error,
        userId: req.user?.id,
        messageId: req.params.messageId
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to delete message'
      } as ApiResponse);
    }
  };
  
  markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { conversationId } = req.params;
      const userId = req.user!.id;
      
      await this.chatService.markConversationAsRead(userId, conversationId);
      
      // 广播已读状态
      this.wsService.broadcastToConversation(
        conversationId,
        'conversation:read',
        { userId, conversationId, readAt: new Date() }
      );
      
      res.json({
        success: true,
        message: 'Conversation marked as read'
      } as ApiResponse);
      
    } catch (error) {
      logger.error('Mark as read failed', {
        error,
        userId: req.user?.id,
        conversationId: req.params.conversationId
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to mark as read'
      } as ApiResponse);
    }
  };
  
  addReaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      const userId = req.user!.id;
      
      const reaction = await this.chatService.addMessageReaction({
        messageId,
        userId,
        emoji
      });
      
      // 获取消息信息用于广播
      const message = await this.chatService.getMessage(messageId);
      if (message) {
        this.wsService.broadcastToConversation(
          message.conversationId,
          'message:reaction:added',
          { messageId, reaction }
        );
      }
      
      res.status(201).json({
        success: true,
        data: reaction
      } as ApiResponse);
      
    } catch (error) {
      logger.error('Add reaction failed', {
        error,
        userId: req.user?.id,
        messageId: req.params.messageId
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to add reaction'
      } as ApiResponse);
    }
  };
  
  removeReaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { messageId, emoji } = req.params;
      const userId = req.user!.id;
      
      await this.chatService.removeMessageReaction({
        messageId,
        userId,
        emoji
      });
      
      // 获取消息信息用于广播
      const message = await this.chatService.getMessage(messageId);
      if (message) {
        this.wsService.broadcastToConversation(
          message.conversationId,
          'message:reaction:removed',
          { messageId, emoji, userId }
        );
      }
      
      res.json({
        success: true,
        message: 'Reaction removed successfully'
      } as ApiResponse);
      
    } catch (error) {
      logger.error('Remove reaction failed', {
        error,
        userId: req.user?.id,
        messageId: req.params.messageId
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to remove reaction'
      } as ApiResponse);
    }
  };
  
  searchMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { conversationId } = req.params;
      const { q: query, page = 1, limit = 20 } = req.query;
      const userId = req.user!.id;
      
      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Search query is required'
        } as ApiResponse);
        return;
      }
      
      // 验证权限
      const hasPermission = await this.chatService.checkReadPermission(
        userId,
        conversationId
      );
      
      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: 'No permission to search messages in this conversation'
        } as ApiResponse);
        return;
      }
      
      const results = await this.chatService.searchMessages({
        conversationId,
        query,
        page: Number(page),
        limit: Math.min(Number(limit), 50)
      });
      
      res.json({
        success: true,
        data: results
      } as ApiResponse);
      
    } catch (error) {
      logger.error('Search messages failed', {
        error,
        userId: req.user?.id,
        conversationId: req.params.conversationId
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to search messages'
      } as ApiResponse);
    }
  };
}
```

## 5. WebSocket实时通信

### 5.1 WebSocket服务实现

```typescript
// src/services/websocket.service.ts
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { ChatService } from './chat.service';
import { RedisService } from './redis.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    email: string;
    username?: string;
  };
}

export class WebSocketService {
  private static instance: WebSocketService;
  private io: SocketIOServer;
  private chatService: ChatService;
  private redisService: RedisService;
  
  private constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });
    
    this.chatService = new ChatService();
    this.redisService = RedisService.getInstance();
    
    this.setupMiddleware();
    this.setupEventHandlers();
  }
  
  static getInstance(server?: HTTPServer): WebSocketService {
    if (!WebSocketService.instance && server) {
      WebSocketService.instance = new WebSocketService(server);
    }
    return WebSocketService.instance;
  }
  
  private setupMiddleware(): void {
    // 认证中间件
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || 
                     socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, username: true }
        });
        
        if (!user) {
          return next(new Error('User not found'));
        }
        
        socket.userId = user.id;
        socket.user = user;
        
        logger.info('WebSocket user authenticated', {
          userId: user.id,
          socketId: socket.id
        });
        
        next();
      } catch (error) {
        logger.error('WebSocket authentication failed', {
          error,
          socketId: socket.id
        });
        next(new Error('Authentication failed'));
      }
    });
  }
  
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info('WebSocket client connected', {
        userId: socket.userId,
        socketId: socket.id
      });
      
      // 用户上线
      this.handleUserOnline(socket);
      
      // 加入对话房间
      socket.on('conversation:join', (data) => {
        this.handleJoinConversation(socket, data);
      });
      
      // 离开对话房间
      socket.on('conversation:leave', (data) => {
        this.handleLeaveConversation(socket, data);
      });
      
      // 发送消息
      socket.on('message:send', (data) => {
        this.handleSendMessage(socket, data);
      });
      
      // 输入状态
      socket.on('typing:start', (data) => {
        this.handleTypingStart(socket, data);
      });
      
      socket.on('typing:stop', (data) => {
        this.handleTypingStop(socket, data);
      });
      
      // 消息已读
      socket.on('message:read', (data) => {
        this.handleMessageRead(socket, data);
      });
      
      // 断开连接
      socket.on('disconnect', (reason) => {
        this.handleDisconnect(socket, reason);
      });
      
      // 错误处理
      socket.on('error', (error) => {
        logger.error('WebSocket error', {
          error,
          userId: socket.userId,
          socketId: socket.id
        });
      });
    });
  }
  
  private async handleUserOnline(socket: AuthenticatedSocket): Promise<void> {
    if (!socket.userId) return;
    
    try {
      // 更新用户在线状态
      await prisma.user.update({
        where: { id: socket.userId },
        data: { lastActiveAt: new Date() }
      });
      
      // 缓存用户socket映射
      await this.redisService.setUserSocket(socket.userId, socket.id);
      
      // 获取用户的对话列表并加入房间
      const conversations = await this.chatService.getUserConversations(socket.userId);
      for (const conversation of conversations) {
        socket.join(`conversation:${conversation.id}`);
      }
      
      // 广播用户上线状态
      socket.broadcast.emit('user:online', {
        userId: socket.userId,
        timestamp: new Date()
      });
      
    } catch (error) {
      logger.error('Handle user online failed', {
        error,
        userId: socket.userId
      });
    }
  }
  
  private async handleJoinConversation(
    socket: AuthenticatedSocket, 
    data: { conversationId: string }
  ): Promise<void> {
    if (!socket.userId) return;
    
    try {
      const { conversationId } = data;
      
      // 验证用户是否有权限加入对话
      const hasPermission = await this.chatService.checkReadPermission(
        socket.userId,
        conversationId
      );
      
      if (!hasPermission) {
        socket.emit('error', {
          message: 'No permission to join this conversation',
          code: 'PERMISSION_DENIED'
        });
        return;
      }
      
      // 加入房间
      socket.join(`conversation:${conversationId}`);
      
      // 通知其他用户
      socket.to(`conversation:${conversationId}`).emit('user:joined', {
        userId: socket.userId,
        conversationId,
        timestamp: new Date()
      });
      
      logger.info('User joined conversation', {
        userId: socket.userId,
        conversationId,
        socketId: socket.id
      });
      
    } catch (error) {
      logger.error('Handle join conversation failed', {
        error,
        userId: socket.userId,
        data
      });
      
      socket.emit('error', {
        message: 'Failed to join conversation',
        code: 'JOIN_FAILED'
      });
    }
  }
  
  private handleLeaveConversation(
    socket: AuthenticatedSocket,
    data: { conversationId: string }
  ): void {
    if (!socket.userId) return;
    
    const { conversationId } = data;
    
    // 离开房间
    socket.leave(`conversation:${conversationId}`);
    
    // 通知其他用户
    socket.to(`conversation:${conversationId}`).emit('user:left', {
      userId: socket.userId,
      conversationId,
      timestamp: new Date()
    });
    
    logger.info('User left conversation', {
      userId: socket.userId,
      conversationId,
      socketId: socket.id
    });
  }
  
  private async handleSendMessage(
    socket: AuthenticatedSocket,
    data: {
      conversationId: string;
      content: string;
      type?: string;
      attachments?: any[];
    }
  ): Promise<void> {
    if (!socket.userId) return;
    
    try {
      const { conversationId, content, type = 'TEXT', attachments = [] } = data;
      
      // 验证权限
      const hasPermission = await this.chatService.checkSendPermission(
        socket.userId,
        conversationId
      );
      
      if (!hasPermission) {
        socket.emit('error', {
          message: 'No permission to send message',
          code: 'PERMISSION_DENIED'
        });
        return;
      }
      
      // 创建消息
      const message = await this.chatService.createMessage({
        conversationId,
        userId: socket.userId,
        content,
        type,
        attachments
      });
      
      // 广播消息到对话房间
      this.io.to(`conversation:${conversationId}`).emit('message:received', {
        message,
        conversationId
      });
      
      // 如果是用户消息，触发AI回复
      if (message.role === 'USER') {
        this.generateAIResponse(conversationId, message.id);
      }
      
    } catch (error) {
      logger.error('Handle send message failed', {
        error,
        userId: socket.userId,
        data
      });
      
      socket.emit('error', {
        message: 'Failed to send message',
        code: 'SEND_FAILED'
      });
    }
  }
  
  private handleTypingStart(
    socket: AuthenticatedSocket,
    data: { conversationId: string }
  ): void {
    if (!socket.userId) return;
    
    const { conversationId } = data;
    
    // 广播输入状态到对话房间（除了发送者）
    socket.to(`conversation:${conversationId}`).emit('typing:start', {
      userId: socket.userId,
      conversationId,
      timestamp: new Date()
    });
  }
  
  private handleTypingStop(
    socket: AuthenticatedSocket,
    data: { conversationId: string }
  ): void {
    if (!socket.userId) return;
    
    const { conversationId } = data;
    
    // 广播停止输入状态
    socket.to(`conversation:${conversationId}`).emit('typing:stop', {
      userId: socket.userId,
      conversationId,
      timestamp: new Date()
    });
  }
  
  private async handleMessageRead(
    socket: AuthenticatedSocket,
    data: { conversationId: string; messageId?: string }
  ): Promise<void> {
    if (!socket.userId) return;
    
    try {
      const { conversationId, messageId } = data;
      
      if (messageId) {
        // 标记特定消息为已读
        await this.chatService.markMessageAsRead(socket.userId, messageId);
      } else {
        // 标记整个对话为已读
        await this.chatService.markConversationAsRead(socket.userId, conversationId);
      }
      
      // 广播已读状态
      socket.to(`conversation:${conversationId}`).emit('message:read', {
        userId: socket.userId,
        conversationId,
        messageId,
        timestamp: new Date()
      });
      
    } catch (error) {
      logger.error('Handle message read failed', {
        error,
        userId: socket.userId,
        data
      });
    }
  }
  
  private async handleDisconnect(
    socket: AuthenticatedSocket,
    reason: string
  ): Promise<void> {
    if (!socket.userId) return;
    
    try {
      // 清除用户socket映射
      await this.redisService.removeUserSocket(socket.userId);
      
      // 广播用户离线状态
      socket.broadcast.emit('user:offline', {
        userId: socket.userId,
        timestamp: new Date(),
        reason
      });
      
      logger.info('WebSocket client disconnected', {
        userId: socket.userId,
        socketId: socket.id,
        reason
      });
      
    } catch (error) {
      logger.error('Handle disconnect failed', {
        error,
        userId: socket.userId,
        reason
      });
    }
  }
  
  // 公共方法：广播消息到对话
  public broadcastToConversation(
    conversationId: string,
    event: string,
    data: any
  ): void {
    this.io.to(`conversation:${conversationId}`).emit(event, data);
  }
  
  // 公共方法：发送消息给特定用户
  public async sendToUser(
    userId: string,
    event: string,
    data: any
  ): Promise<void> {
    try {
      const socketId = await this.redisService.getUserSocket(userId);
      if (socketId) {
        this.io.to(socketId).emit(event, data);
      }
    } catch (error) {
      logger.error('Send to user failed', {
        error,
        userId,
        event
      });
    }
  }
  
  // AI回复生成（异步）
  private async generateAIResponse(
    conversationId: string,
    userMessageId: string
  ): Promise<void> {
    try {
      // 发送输入状态
      this.broadcastToConversation(conversationId, 'typing:start', {
        userId: 'ai-assistant',
        conversationId,
        timestamp: new Date()
      });
      
      // 生成AI回复
      const aiResponse = await this.chatService.generateAIResponse(
        conversationId,
        userMessageId
      );
      
      // 停止输入状态
      this.broadcastToConversation(conversationId, 'typing:stop', {
        userId: 'ai-assistant',
        conversationId,
        timestamp: new Date()
      });
      
      // 广播AI回复
      this.broadcastToConversation(conversationId, 'message:received', {
        message: aiResponse,
        conversationId
      });
      
    } catch (error) {
      logger.error('Generate AI response failed', {
        error,
        conversationId,
        userMessageId
      });
      
      // 发送错误消息
      this.broadcastToConversation(conversationId, 'ai:error', {
        error: 'AI response generation failed',
        conversationId,
        timestamp: new Date()
      });
    }
  }
  
  // 获取在线用户数
  public getOnlineUsersCount(): number {
    return this.io.sockets.sockets.size;
  }
  
  // 获取对话房间用户数
  public getConversationUsersCount(conversationId: string): number {
    const room = this.io.sockets.adapter.rooms.get(`conversation:${conversationId}`);
    return room ? room.size : 0;
  }
}
```