# AI对话前后端联调指南

## 1. 联调概述

本文档详细说明AI对话功能前后端开发过程中的协作流程、联调步骤、测试方法和问题排查，确保前后端团队能够高效协作，顺利完成功能开发。

### 1.1 联调目标

- 🎯 **接口对接**: 确保前后端API接口完全匹配
- 🔄 **实时通信**: 验证WebSocket连接和消息推送
- 📱 **功能验证**: 测试完整的用户交互流程
- 🐛 **问题排查**: 快速定位和解决联调问题
- 📊 **性能优化**: 监控和优化接口性能

### 1.2 联调环境

- **开发环境**: 本地开发和测试
- **集成环境**: 前后端集成测试
- **预发布环境**: 生产环境模拟测试

## 2. 开发环境搭建

### 2.1 后端环境配置

```bash
# 1. 克隆项目
git clone <repository-url>
cd ai-chat-backend

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local

# 编辑 .env.local
DATABASE_URL="postgresql://username:password@localhost:5432/ai_chat_dev"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-jwt-secret-key"
OPENAI_API_KEY="your-openai-api-key"
FRONTEND_URL="http://localhost:3000"
PORT=3001

# 4. 启动数据库服务
docker-compose up -d postgres redis

# 5. 运行数据库迁移
npx prisma migrate dev
npx prisma generate

# 6. 启动开发服务器
npm run dev
```

### 2.2 前端环境配置

```bash
# 1. 进入前端目录
cd ai-chat-frontend

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local

# 编辑 .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_CHAT_ENABLED=true

# 4. 启动开发服务器
npm run dev
```

### 2.3 Docker Compose配置

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ai_chat_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - '3001:3001'
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/ai_chat_dev
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
    command: npm run dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - '3000:3000'
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001/api
      - NEXT_PUBLIC_WS_URL=ws://localhost:3001
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    command: npm run dev

volumes:
  postgres_data:
  redis_data:
```

## 3. API接口联调

### 3.1 接口文档规范

#### 3.1.1 API响应格式

```typescript
// 统一响应格式
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 成功响应示例
{
  "success": true,
  "data": {
    "id": "msg_123",
    "content": "Hello, AI!",
    "role": "USER",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}

// 错误响应示例
{
  "success": false,
  "error": "Validation failed",
  "message": "Content is required"
}
```

#### 3.1.2 核心API接口

```typescript
// 1. 认证接口
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
POST /api/auth/logout

// 2. 对话管理
GET    /api/conversations              # 获取对话列表
POST   /api/conversations              # 创建对话
GET    /api/conversations/:id          # 获取对话详情
PATCH  /api/conversations/:id          # 更新对话
DELETE /api/conversations/:id          # 删除对话

// 3. 消息管理
GET    /api/conversations/:id/messages # 获取消息列表
POST   /api/conversations/:id/messages # 发送消息
PATCH  /api/messages/:id               # 更新消息
DELETE /api/messages/:id               # 删除消息

// 4. 实时功能
POST   /api/conversations/:id/read     # 标记已读
POST   /api/messages/:id/reactions     # 添加反应
GET    /api/conversations/:id/search   # 搜索消息
```

### 3.2 接口测试工具

#### 3.2.1 Postman集合配置

```json
{
  "info": {
    "name": "AI Chat API",
    "description": "AI对话功能API测试集合"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3001/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{token}}",
        "type": "string"
      }
    ]
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseUrl}}/auth/login",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "login"]
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 200) {",
                  "    const response = pm.response.json();",
                  "    if (response.success && response.data.token) {",
                  "        pm.collectionVariables.set('token', response.data.token);",
                  "    }",
                  "}"
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

#### 3.2.2 自动化测试脚本

```typescript
// tests/api/chat.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/config/database';
import { generateTestUser, generateTestToken } from '../helpers/auth';

describe('Chat API', () => {
  let testUser: any;
  let authToken: string;
  let conversationId: string;

  beforeAll(async () => {
    testUser = await generateTestUser();
    authToken = generateTestToken(testUser.id);
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: testUser.id } });
  });

  describe('POST /api/conversations', () => {
    it('should create a new conversation', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Conversation'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe('Test Conversation');

      conversationId = response.body.data.id;
    });
  });

  describe('POST /api/conversations/:id/messages', () => {
    it('should send a message', async () => {
      const response = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Hello, AI!',
          type: 'TEXT'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.content).toBe('Hello, AI!');
      expect(response.body.data.role).toBe('USER');
    });

    it('should validate message content', async () => {
      const response = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '', // 空内容
          type: 'TEXT'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Content is required');
    });
  });

  describe('GET /api/conversations/:id/messages', () => {
    it('should get messages with pagination', async () => {
      const response = await request(app)
        .get(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          page: 1,
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('messages');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.messages)).toBe(true);
    });
  });
});
```

### 3.3 前端API调用实现

#### 3.3.1 API客户端封装

```typescript
// src/lib/api-client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from '@/hooks/use-toast';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiClient {
  private instance: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 添加认证token
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加请求ID用于追踪
        config.headers['X-Request-ID'] = this.generateRequestId();

        console.log('API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data,
          headers: config.headers
        });

        return config;
      },
      (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        console.log('API Response:', {
          status: response.status,
          data: response.data,
          headers: response.headers
        });

        // 检查业务逻辑错误
        if (!response.data.success) {
          const error = new Error(response.data.error || 'API request failed');
          (error as any).response = response;
          throw error;
        }

        return response;
      },
      (error) => {
        console.error('Response Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });

        // 处理不同类型的错误
        this.handleError(error);

        return Promise.reject(error);
      }
    );
  }

  private handleError(error: any): void {
    const status = error.response?.status;
    const message = error.response?.data?.error || error.message;

    switch (status) {
      case 401:
        // 未授权，清除token并跳转登录
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
        break;

      case 403:
        toast({
          title: '权限不足',
          description: '您没有权限执行此操作',
          variant: 'destructive'
        });
        break;

      case 429:
        toast({
          title: '请求过于频繁',
          description: '请稍后再试',
          variant: 'destructive'
        });
        break;

      case 500:
        toast({
          title: '服务器错误',
          description: '服务器暂时不可用，请稍后再试',
          variant: 'destructive'
        });
        break;

      default:
        if (message) {
          toast({
            title: '操作失败',
            description: message,
            variant: 'destructive'
          });
        }
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 通用请求方法
  public async request<T = any>(
    config: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.request<ApiResponse<T>>(config);
    return response.data;
  }

  // GET请求
  public async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  // POST请求
  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  // PUT请求
  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  // PATCH请求
  public async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  // DELETE请求
  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  // 文件上传
  public async upload<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<T>({
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      }
    });
  }

  // 健康检查
  public async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  }
}

// 导出单例实例
export const apiClient = new ApiClient();
```

#### 3.3.2 聊天API服务

```typescript
// src/services/chat-api.service.ts
import { apiClient } from '@/lib/api-client';
import {
  Conversation,
  Message,
  CreateMessageRequest,
  GetMessagesRequest,
  SearchMessagesRequest
} from '@/types/chat.types';

export class ChatApiService {
  // 对话管理
  async getConversations(): Promise<Conversation[]> {
    const response = await apiClient.get<Conversation[]>('/conversations');
    return response.data || [];
  }

  async createConversation(data: { title?: string }): Promise<Conversation> {
    const response = await apiClient.post<Conversation>('/conversations', data);
    return response.data!;
  }

  async getConversation(id: string): Promise<Conversation> {
    const response = await apiClient.get<Conversation>(`/conversations/${id}`);
    return response.data!;
  }

  async updateConversation(
    id: string,
    data: Partial<Conversation>
  ): Promise<Conversation> {
    const response = await apiClient.patch<Conversation>(
      `/conversations/${id}`,
      data
    );
    return response.data!;
  }

  async deleteConversation(id: string): Promise<void> {
    await apiClient.delete(`/conversations/${id}`);
  }

  async archiveConversation(id: string): Promise<void> {
    await apiClient.post(`/conversations/${id}/archive`);
  }

  // 消息管理
  async getMessages(request: GetMessagesRequest): Promise<{
    messages: Message[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { conversationId, ...params } = request;
    const response = await apiClient.get(
      `/conversations/${conversationId}/messages`,
      { params }
    );
    return response.data!;
  }

  async sendMessage(request: CreateMessageRequest): Promise<Message> {
    const { conversationId, ...data } = request;
    const response = await apiClient.post<Message>(
      `/conversations/${conversationId}/messages`,
      data
    );
    return response.data!;
  }

  async updateMessage(
    messageId: string,
    data: { content: string }
  ): Promise<Message> {
    const response = await apiClient.patch<Message>(
      `/messages/${messageId}`,
      data
    );
    return response.data!;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await apiClient.delete(`/messages/${messageId}`);
  }

  async markAsRead(conversationId: string): Promise<void> {
    await apiClient.post(`/conversations/${conversationId}/read`);
  }

  async addReaction(
    messageId: string,
    emoji: string
  ): Promise<{ id: string; emoji: string }> {
    const response = await apiClient.post(`/messages/${messageId}/reactions`, {
      emoji
    });
    return response.data!;
  }

  async removeReaction(messageId: string, emoji: string): Promise<void> {
    await apiClient.delete(`/messages/${messageId}/reactions/${emoji}`);
  }

  async searchMessages(request: SearchMessagesRequest): Promise<{
    messages: Message[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { conversationId, ...params } = request;
    const response = await apiClient.get(
      `/conversations/${conversationId}/search`,
      { params }
    );
    return response.data!;
  }

  // 文件上传
  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ url: string; filename: string }> {
    const response = await apiClient.upload('/upload', file, onProgress);
    return response.data!;
  }
}

// 导出单例实例
export const chatApiService = new ChatApiService();
```

## 4. WebSocket实时通信联调

### 4.1 WebSocket连接测试

#### 4.1.1 连接状态监控

```typescript
// src/hooks/useWebSocketDebug.ts
import { useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface WebSocketDebugInfo {
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastConnectedAt?: Date;
  lastDisconnectedAt?: Date;
  reconnectAttempts: number;
  messagesSent: number;
  messagesReceived: number;
  latency?: number;
  errors: Array<{
    timestamp: Date;
    error: string;
    type: 'connection' | 'message' | 'auth';
  }>;
}

export const useWebSocketDebug = () => {
  const { socket, isConnected, error } = useWebSocket();
  const [debugInfo, setDebugInfo] = useState<WebSocketDebugInfo>({
    connectionState: 'disconnected',
    reconnectAttempts: 0,
    messagesSent: 0,
    messagesReceived: 0,
    errors: []
  });

  useEffect(() => {
    if (!socket) return;

    // 连接状态监听
    socket.on('connect', () => {
      setDebugInfo((prev) => ({
        ...prev,
        connectionState: 'connected',
        lastConnectedAt: new Date(),
        reconnectAttempts: 0
      }));

      console.log('🟢 WebSocket Connected', {
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('disconnect', (reason) => {
      setDebugInfo((prev) => ({
        ...prev,
        connectionState: 'disconnected',
        lastDisconnectedAt: new Date()
      }));

      console.log('🔴 WebSocket Disconnected', {
        reason,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('connect_error', (error) => {
      setDebugInfo((prev) => ({
        ...prev,
        connectionState: 'error',
        reconnectAttempts: prev.reconnectAttempts + 1,
        errors: [
          ...prev.errors,
          {
            timestamp: new Date(),
            error: error.message,
            type: 'connection'
          }
        ]
      }));

      console.error('❌ WebSocket Connection Error', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
    });

    // 消息监听
    const originalEmit = socket.emit;
    socket.emit = function (...args) {
      setDebugInfo((prev) => ({
        ...prev,
        messagesSent: prev.messagesSent + 1
      }));

      console.log('📤 WebSocket Message Sent', {
        event: args[0],
        data: args[1],
        timestamp: new Date().toISOString()
      });

      return originalEmit.apply(this, args);
    };

    // 通用消息接收监听
    const originalOn = socket.on;
    socket.on = function (event, handler) {
      const wrappedHandler = (...args: any[]) => {
        setDebugInfo((prev) => ({
          ...prev,
          messagesReceived: prev.messagesReceived + 1
        }));

        console.log('📥 WebSocket Message Received', {
          event,
          data: args[0],
          timestamp: new Date().toISOString()
        });

        return handler(...args);
      };

      return originalOn.call(this, event, wrappedHandler);
    };

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [socket]);

  // 延迟测试
  const testLatency = async (): Promise<number> => {
    if (!socket || !isConnected) return -1;

    return new Promise((resolve) => {
      const startTime = Date.now();

      socket.emit('ping', startTime);

      socket.once('pong', (timestamp) => {
        const latency = Date.now() - timestamp;
        setDebugInfo((prev) => ({ ...prev, latency }));
        resolve(latency);
      });

      // 超时处理
      setTimeout(() => resolve(-1), 5000);
    });
  };

  // 发送测试消息
  const sendTestMessage = (conversationId: string) => {
    if (!socket || !isConnected) return;

    socket.emit('message:send', {
      conversationId,
      content: `Test message at ${new Date().toISOString()}`,
      type: 'TEXT'
    });
  };

  return {
    debugInfo,
    testLatency,
    sendTestMessage,
    isConnected
  };
};
```

#### 4.1.2 WebSocket调试面板

```typescript
// src/components/debug/WebSocketDebugPanel.tsx
import { useState, useEffect } from 'react';
import { useWebSocketDebug } from '@/hooks/useWebSocketDebug';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WebSocketDebugPanelProps {
  conversationId?: string;
}

export const WebSocketDebugPanel: React.FC<WebSocketDebugPanelProps> = ({
  conversationId
}) => {
  const { debugInfo, testLatency, sendTestMessage, isConnected } = useWebSocketDebug();
  const [latencyResult, setLatencyResult] = useState<number | null>(null);
  const [isTestingLatency, setIsTestingLatency] = useState(false);

  const handleLatencyTest = async () => {
    setIsTestingLatency(true);
    const result = await testLatency();
    setLatencyResult(result);
    setIsTestingLatency(false);
  };

  const getConnectionStatusColor = () => {
    switch (debugInfo.connectionState) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (debugInfo.connectionState) {
      case 'connected': return '已连接';
      case 'connecting': return '连接中';
      case 'disconnected': return '已断开';
      case 'error': return '连接错误';
      default: return '未知状态';
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔌 WebSocket 调试面板
          <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`} />
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {getConnectionStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="status">连接状态</TabsTrigger>
            <TabsTrigger value="messages">消息统计</TabsTrigger>
            <TabsTrigger value="errors">错误日志</TabsTrigger>
            <TabsTrigger value="tools">调试工具</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">连接状态</label>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`} />
                  <span className="text-sm">{getConnectionStatusText()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">重连次数</label>
                <span className="text-sm">{debugInfo.reconnectAttempts}</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">最后连接时间</label>
                <span className="text-sm">
                  {debugInfo.lastConnectedAt?.toLocaleString() || '未连接'}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">最后断开时间</label>
                <span className="text-sm">
                  {debugInfo.lastDisconnectedAt?.toLocaleString() || '未断开'}
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {debugInfo.messagesSent}
                </div>
                <div className="text-sm text-gray-600">已发送消息</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {debugInfo.messagesReceived}
                </div>
                <div className="text-sm text-gray-600">已接收消息</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {debugInfo.latency ? `${debugInfo.latency}ms` : '-'}
                </div>
                <div className="text-sm text-gray-600">网络延迟</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <ScrollArea className="h-48">
              {debugInfo.errors.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  暂无错误记录
                </div>
              ) : (
                <div className="space-y-2">
                  {debugInfo.errors.map((error, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-red-800">
                            {error.error}
                          </div>
                          <div className="text-xs text-red-600">
                            类型: {error.type}
                          </div>
                        </div>
                        <div className="text-xs text-red-500">
                          {error.timestamp.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleLatencyTest}
                  disabled={!isConnected || isTestingLatency}
                  size="sm"
                >
                  {isTestingLatency ? '测试中...' : '测试延迟'}
                </Button>

                {latencyResult !== null && (
                  <Badge variant={latencyResult > 0 ? 'default' : 'destructive'}>
                    {latencyResult > 0 ? `${latencyResult}ms` : '测试失败'}
                  </Badge>
                )}
              </div>

              {conversationId && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => sendTestMessage(conversationId)}
                    disabled={!isConnected}
                    size="sm"
                    variant="outline"
                  >
                    发送测试消息
                  </Button>
                  <span className="text-sm text-gray-600">
                    对话ID: {conversationId.slice(0, 8)}...
                  </span>
                </div>
              )}

              <div className="p-3 bg-gray-50 rounded text-sm">
                <div className="font-medium mb-2">调试说明:</div>
                <ul className="space-y-1 text-gray-600">
                  <li>• 绿色状态表示连接正常</li>
                  <li>• 延迟测试可检查网络质量</li>
                  <li>• 测试消息会发送到当前对话</li>
                  <li>• 错误日志记录连接问题</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
```

### 4.2 消息流测试

#### 4.2.1 消息发送流程测试

```typescript
// tests/integration/websocket-flow.test.ts
import { io, Socket } from 'socket.io-client';
import { generateTestToken, generateTestUser } from '../helpers/auth';
import { prisma } from '../../src/config/database';

describe('WebSocket Message Flow', () => {
  let clientSocket: Socket;
  let testUser: any;
  let authToken: string;
  let conversationId: string;

  beforeAll(async () => {
    testUser = await generateTestUser();
    authToken = generateTestToken(testUser.id);

    // 创建测试对话
    const conversation = await prisma.conversation.create({
      data: {
        title: 'Test Conversation',
        participants: {
          create: {
            userId: testUser.id,
            role: 'OWNER'
          }
        }
      }
    });
    conversationId = conversation.id;
  });

  afterAll(async () => {
    if (clientSocket) {
      clientSocket.close();
    }
    await prisma.user.delete({ where: { id: testUser.id } });
  });

  beforeEach((done) => {
    clientSocket = io('http://localhost:3001', {
      auth: {
        token: authToken
      }
    });

    clientSocket.on('connect', () => {
      done();
    });

    clientSocket.on('connect_error', (error) => {
      done(error);
    });
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.close();
    }
  });

  it('should connect with valid token', (done) => {
    expect(clientSocket.connected).toBe(true);
    done();
  });

  it('should join conversation room', (done) => {
    clientSocket.emit('conversation:join', { conversationId });

    clientSocket.on('user:joined', (data) => {
      expect(data.userId).toBe(testUser.id);
      expect(data.conversationId).toBe(conversationId);
      done();
    });
  });

  it('should send and receive messages', (done) => {
    const testMessage = {
      conversationId,
      content: 'Hello, WebSocket!',
      type: 'TEXT'
    };

    // 监听消息接收
    clientSocket.on('message:received', (data) => {
      expect(data.message.content).toBe(testMessage.content);
      expect(data.message.role).toBe('USER');
      expect(data.conversationId).toBe(conversationId);
      done();
    });

    // 发送消息
    clientSocket.emit('message:send', testMessage);
  });

  it('should handle typing indicators', (done) => {
    let typingStartReceived = false;

    clientSocket.on('typing:start', (data) => {
      expect(data.userId).toBe(testUser.id);
      expect(data.conversationId).toBe(conversationId);
      typingStartReceived = true;
    });

    clientSocket.on('typing:stop', (data) => {
      expect(data.userId).toBe(testUser.id);
      expect(data.conversationId).toBe(conversationId);
      expect(typingStartReceived).toBe(true);
      done();
    });

    // 发送输入状态
    clientSocket.emit('typing:start', { conversationId });

    setTimeout(() => {
      clientSocket.emit('typing:stop', { conversationId });
    }, 100);
  });

  it('should handle message read status', (done) => {
    clientSocket.on('message:read', (data) => {
      expect(data.userId).toBe(testUser.id);
      expect(data.conversationId).toBe(conversationId);
      done();
    });

    clientSocket.emit('message:read', { conversationId });
  });

  it('should handle connection errors gracefully', (done) => {
    const invalidSocket = io('http://localhost:3001', {
      auth: {
        token: 'invalid-token'
      }
    });

    invalidSocket.on('connect_error', (error) => {
      expect(error.message).toContain('Authentication failed');
      invalidSocket.close();
      done();
    });
  });
});
```

## 5. 联调流程和最佳实践

### 5.1 标准联调流程

#### 5.1.1 开发阶段联调

```mermaid
flowchart TD
    A[后端API开发] --> B[API文档更新]
    B --> C[前端接口对接]
    C --> D[单元测试]
    D --> E[集成测试]
    E --> F{测试通过?}
    F -->|否| G[问题修复]
    G --> C
    F -->|是| H[功能验收]
    H --> I[代码合并]
```

#### 5.1.2 每日联调检查清单

```markdown
## 每日联调检查清单

### 环境检查

- [ ] 后端服务正常启动 (http://localhost:3001)
- [ ] 前端服务正常启动 (http://localhost:3000)
- [ ] 数据库连接正常
- [ ] Redis连接正常
- [ ] WebSocket连接正常

### API接口检查

- [ ] 认证接口正常工作
- [ ] 对话管理接口正常
- [ ] 消息发送接口正常
- [ ] 文件上传接口正常
- [ ] 错误处理机制正常

### WebSocket功能检查

- [ ] 连接建立正常
- [ ] 消息实时推送正常
- [ ] 输入状态同步正常
- [ ] 断线重连机制正常
- [ ] 多用户同时在线正常

### 前端功能检查

- [ ] 聊天窗口显示正常
- [ ] 消息发送和接收正常
- [ ] 历史消息加载正常
- [ ] 文件上传功能正常
- [ ] 响应式布局正常

### 性能检查

- [ ] API响应时间 < 500ms
- [ ] WebSocket延迟 < 100ms
- [ ] 内存使用正常
- [ ] 无内存泄漏
- [ ] 错误日志无异常
```

### 5.2 问题排查指南

#### 5.2.1 常见问题和解决方案

```typescript
// src/utils/debug-helper.ts
export class DebugHelper {
  // API请求问题排查
  static debugApiRequest(error: any, request: any) {
    console.group('🔍 API Request Debug');
    console.log('Request Details:', {
      method: request.method,
      url: request.url,
      headers: request.headers,
      data: request.data
    });

    if (error.response) {
      console.log('Response Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });

      // 常见错误分析
      switch (error.response.status) {
        case 400:
          console.warn('❌ Bad Request - 检查请求参数格式');
          break;
        case 401:
          console.warn('❌ Unauthorized - 检查认证token');
          break;
        case 403:
          console.warn('❌ Forbidden - 检查用户权限');
          break;
        case 404:
          console.warn('❌ Not Found - 检查API路径');
          break;
        case 429:
          console.warn('❌ Too Many Requests - 检查请求频率');
          break;
        case 500:
          console.warn('❌ Internal Server Error - 检查后端日志');
          break;
      }
    } else if (error.request) {
      console.log('Network Error:', {
        message: error.message,
        code: error.code
      });
      console.warn('❌ Network Error - 检查网络连接和服务器状态');
    } else {
      console.log('Request Setup Error:', error.message);
    }

    console.groupEnd();
  }

  // WebSocket连接问题排查
  static debugWebSocketConnection(socket: any, error?: any) {
    console.group('🔍 WebSocket Connection Debug');

    if (socket) {
      console.log('Socket Details:', {
        id: socket.id,
        connected: socket.connected,
        disconnected: socket.disconnected,
        transport: socket.io.engine.transport.name
      });
    }

    if (error) {
      console.log('Connection Error:', {
        message: error.message,
        description: error.description,
        context: error.context,
        type: error.type
      });

      // 常见WebSocket错误分析
      if (error.message.includes('Authentication')) {
        console.warn('❌ Authentication Error - 检查token有效性');
      } else if (error.message.includes('timeout')) {
        console.warn('❌ Connection Timeout - 检查网络延迟');
      } else if (error.message.includes('CORS')) {
        console.warn('❌ CORS Error - 检查跨域配置');
      }
    }

    // 连接建议
    console.log('🔧 Troubleshooting Tips:');
    console.log('1. 检查后端WebSocket服务是否启动');
    console.log('2. 验证认证token是否有效');
    console.log('3. 确认网络连接是否正常');
    console.log('4. 查看浏览器控制台是否有CORS错误');
    console.log('5. 检查防火墙是否阻止WebSocket连接');

    console.groupEnd();
  }

  // 性能问题排查
  static debugPerformance(operation: string, startTime: number) {
    const duration = performance.now() - startTime;

    console.group(`⏱️ Performance Debug: ${operation}`);
    console.log(`Duration: ${duration.toFixed(2)}ms`);

    if (duration > 1000) {
      console.warn('❌ Slow Operation - 操作耗时过长');
      console.log('建议检查:');
      console.log('1. 网络延迟');
      console.log('2. 服务器性能');
      console.log('3. 数据库查询效率');
      console.log('4. 前端渲染性能');
    } else if (duration > 500) {
      console.warn('⚠️ Moderate Delay - 操作稍慢');
    } else {
      console.log('✅ Good Performance - 操作正常');
    }

    console.groupEnd();

    return duration;
  }

  // 内存使用检查
  static debugMemoryUsage() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const memory = (performance as any).memory;

      if (memory) {
        console.group('💾 Memory Usage Debug');
        console.log(
          'Used JS Heap Size:',
          (memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB'
        );
        console.log(
          'Total JS Heap Size:',
          (memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + ' MB'
        );
        console.log(
          'JS Heap Size Limit:',
          (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + ' MB'
        );

        const usagePercentage =
          (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

        if (usagePercentage > 80) {
          console.warn('❌ High Memory Usage - 内存使用率过高');
        } else if (usagePercentage > 60) {
          console.warn('⚠️ Moderate Memory Usage - 内存使用率较高');
        } else {
          console.log('✅ Normal Memory Usage - 内存使用正常');
        }

        console.groupEnd();
      }
    }
  }

  // 生成调试报告
  static generateDebugReport() {
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: (navigator as any).connection
        ? {
            effectiveType: (navigator as any).connection.effectiveType,
            downlink: (navigator as any).connection.downlink,
            rtt: (navigator as any).connection.rtt
          }
        : null,
      localStorage: {
        authToken: !!localStorage.getItem('auth_token'),
        chatSettings: !!localStorage.getItem('chat_settings')
      }
    };

    console.log('📋 Debug Report:', report);

    return report;
  }
}
```

#### 5.2.2 错误监控和报告

```typescript
// src/utils/error-reporter.ts
interface ErrorReport {
  id: string;
  timestamp: Date;
  type: 'api' | 'websocket' | 'ui' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  context: {
    userId?: string;
    conversationId?: string;
    url: string;
    userAgent: string;
    [key: string]: any;
  };
}

export class ErrorReporter {
  private static reports: ErrorReport[] = [];
  private static maxReports = 100;

  static report(error: {
    type: ErrorReport['type'];
    severity: ErrorReport['severity'];
    message: string;
    stack?: string;
    context?: Partial<ErrorReport['context']>;
  }) {
    const report: ErrorReport = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: error.type,
      severity: error.severity,
      message: error.message,
      stack: error.stack,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...error.context
      }
    };

    // 添加到本地报告列表
    this.reports.unshift(report);
    if (this.reports.length > this.maxReports) {
      this.reports = this.reports.slice(0, this.maxReports);
    }

    // 控制台输出
    const logMethod = this.getLogMethod(error.severity);
    logMethod(`[${error.type.toUpperCase()}] ${error.message}`, report);

    // 发送到监控服务（生产环境）
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(report);
    }

    return report.id;
  }

  private static getLogMethod(severity: ErrorReport['severity']) {
    switch (severity) {
      case 'critical':
      case 'high':
        return console.error;
      case 'medium':
        return console.warn;
      case 'low':
      default:
        return console.log;
    }
  }

  private static async sendToMonitoring(report: ErrorReport) {
    try {
      // 这里可以集成第三方监控服务
      // 如 Sentry, LogRocket, Bugsnag 等
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(report)
      });
    } catch (error) {
      console.error('Failed to send error report:', error);
    }
  }

  static getReports(filter?: {
    type?: ErrorReport['type'];
    severity?: ErrorReport['severity'];
    since?: Date;
  }): ErrorReport[] {
    let filtered = this.reports;

    if (filter) {
      if (filter.type) {
        filtered = filtered.filter((r) => r.type === filter.type);
      }
      if (filter.severity) {
        filtered = filtered.filter((r) => r.severity === filter.severity);
      }
      if (filter.since) {
        filtered = filtered.filter((r) => r.timestamp >= filter.since!);
      }
    }

    return filtered;
  }

  static clearReports() {
    this.reports = [];
  }

  static exportReports(): string {
    return JSON.stringify(this.reports, null, 2);
  }
}

// 全局错误处理
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    ErrorReporter.report({
      type: 'ui',
      severity: 'high',
      message: event.message,
      stack: event.error?.stack,
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    ErrorReporter.report({
      type: 'ui',
      severity: 'high',
      message: `Unhandled Promise Rejection: ${event.reason}`,
      stack: event.reason?.stack,
      context: {
        reason: event.reason
      }
    });
  });
}
```

### 5.3 联调测试用例

#### 5.3.1 端到端测试场景

```typescript
// tests/e2e/chat-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('AI Chat E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 登录测试用户
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('should open chat window and send message', async ({ page }) => {
    // 打开聊天窗口
    await page.click('[data-testid="chat-trigger-button"]');
    await expect(page.locator('[data-testid="chat-window"]')).toBeVisible();

    // 发送消息
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Hello, AI assistant!');
    await page.click('[data-testid="send-button"]');

    // 验证消息显示
    await expect(
      page.locator('[data-testid="user-message"]').last()
    ).toContainText('Hello, AI assistant!');

    // 等待AI回复
    await expect(page.locator('[data-testid="ai-message"]').last()).toBeVisible(
      { timeout: 10000 }
    );
  });

  test('should handle file upload', async ({ page }) => {
    await page.click('[data-testid="chat-trigger-button"]');

    // 上传文件
    const fileInput = page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles('tests/fixtures/test-image.png');

    // 验证文件预览
    await expect(page.locator('[data-testid="file-preview"]')).toBeVisible();

    // 发送带文件的消息
    await page.click('[data-testid="send-button"]');

    // 验证文件消息显示
    await expect(
      page.locator('[data-testid="file-message"]').last()
    ).toBeVisible();
  });

  test('should maintain conversation history', async ({ page }) => {
    await page.click('[data-testid="chat-trigger-button"]');

    // 发送多条消息
    const messages = ['First message', 'Second message', 'Third message'];

    for (const message of messages) {
      await page.fill('[data-testid="message-input"]', message);
      await page.click('[data-testid="send-button"]');
      await page.waitForTimeout(1000);
    }

    // 验证所有消息都显示
    for (const message of messages) {
      await expect(page.locator(`text=${message}`)).toBeVisible();
    }

    // 刷新页面后验证历史记录
    await page.reload();
    await page.click('[data-testid="chat-trigger-button"]');

    for (const message of messages) {
      await expect(page.locator(`text=${message}`)).toBeVisible();
    }
  });
});
```

#### 5.3.2 性能测试

```typescript
// tests/performance/chat-performance.test.ts
import { performance } from 'perf_hooks';
import { io } from 'socket.io-client';
import { apiClient } from '../../src/lib/api-client';

describe('Chat Performance Tests', () => {
  test('API response time should be under 500ms', async () => {
    const startTime = performance.now();

    await apiClient.get('/conversations');

    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(500);
  });

  test('WebSocket connection should establish quickly', async () => {
    const startTime = performance.now();

    const socket = io('http://localhost:3001', {
      auth: { token: 'test-token' }
    });

    await new Promise((resolve) => {
      socket.on('connect', () => {
        const duration = performance.now() - startTime;
        expect(duration).toBeLessThan(1000);
        socket.close();
        resolve(undefined);
      });
    });
  });

  test('Message sending should be fast', async () => {
    const socket = io('http://localhost:3001', {
      auth: { token: 'test-token' }
    });

    await new Promise((resolve) => {
      socket.on('connect', () => {
        const startTime = performance.now();

        socket.emit('message:send', {
          conversationId: 'test-conversation',
          content: 'Performance test message',
          type: 'TEXT'
        });

        socket.on('message:received', () => {
          const duration = performance.now() - startTime;
          expect(duration).toBeLessThan(200);
          socket.close();
          resolve(undefined);
        });
      });
    });
  });
});
```

## 6. 部署和监控

### 6.1 部署配置

#### 6.1.1 Docker部署配置

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    environment:
      - NEXT_PUBLIC_API_URL=https://api.yourdomain.com
      - NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 6.2 监控和日志

#### 6.2.1 应用监控配置

```typescript
// src/middleware/monitoring.ts
import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
}

export class MonitoringService {
  private static metrics: RequestMetrics[] = [];
  private static maxMetrics = 1000;

  static requestLogger() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = performance.now();

      res.on('finish', () => {
        const duration = performance.now() - startTime;

        const metric: RequestMetrics = {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          timestamp: new Date(),
          userAgent: req.get('User-Agent'),
          ip: req.ip
        };

        this.addMetric(metric);

        // 记录慢请求
        if (duration > 1000) {
          console.warn(
            `Slow request: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`
          );
        }
      });

      next();
    };
  }

  private static addMetric(metric: RequestMetrics) {
    this.metrics.unshift(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(0, this.maxMetrics);
    }
  }

  static getMetrics(filter?: { method?: string; path?: string; since?: Date }) {
    let filtered = this.metrics;

    if (filter) {
      if (filter.method) {
        filtered = filtered.filter((m) => m.method === filter.method);
      }
      if (filter.path) {
        filtered = filtered.filter((m) => m.path.includes(filter.path));
      }
      if (filter.since) {
        filtered = filtered.filter((m) => m.timestamp >= filter.since!);
      }
    }

    return filtered;
  }

  static getStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentMetrics = this.getMetrics({ since: oneHourAgo });

    return {
      totalRequests: recentMetrics.length,
      averageResponseTime:
        recentMetrics.reduce((sum, m) => sum + m.duration, 0) /
        recentMetrics.length,
      errorRate:
        recentMetrics.filter((m) => m.statusCode >= 400).length /
        recentMetrics.length,
      slowRequests: recentMetrics.filter((m) => m.duration > 1000).length,
      statusCodes: recentMetrics.reduce(
        (acc, m) => {
          acc[m.statusCode] = (acc[m.statusCode] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>
      )
    };
  }
}
```

## 7. 总结

本联调指南提供了AI对话功能前后端开发的完整协作流程，包括：

### 7.1 核心要点

- 🔧 **环境搭建**: 统一的开发环境和配置
- 🔌 **接口对接**: 标准化的API设计和测试
- ⚡ **实时通信**: WebSocket连接和消息流测试
- 🐛 **问题排查**: 系统化的调试和错误处理
- 📊 **性能监控**: 全面的性能指标和优化

### 7.2 最佳实践

- 📝 **文档先行**: 接口文档和规范优先
- 🧪 **测试驱动**: 自动化测试覆盖核心功能
- 🔍 **持续监控**: 实时性能和错误监控
- 🤝 **团队协作**: 规范化的沟通和协作流程

### 7.3 后续优化

- 🚀 **性能优化**: 持续优化响应时间和用户体验
- 🔒 **安全加固**: 加强认证和数据保护
- 📈 **功能扩展**: 基于用户反馈持续迭代
- 🌐 **国际化**: 支持多语言和地区

通过遵循本指南，前后端团队可以高效协作，确保AI对话功能的稳定性和用户体验。
