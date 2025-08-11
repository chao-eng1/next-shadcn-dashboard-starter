# Messages 模块

## 模块概述

消息中心模块，统一管理系统通知、用户消息、邮件提醒等各类消息功能。

## 主要功能

- 📬 系统通知管理
- 📧 邮件消息集成
- 🔔 实时推送通知
- 📱 移动端推送
- 📋 消息分类和筛选
- ✅ 消息已读/未读状态
- 🗑️ 消息删除和归档
- 🔍 消息搜索功能
- ⚙️ 通知偏好设置
- 📊 消息统计分析

## 技术栈

- **WebSocket**: 实时消息推送
- **Zustand**: 消息状态管理
- **React Query**: 数据获取和缓存
- **Prisma**: 数据持久化
- **shadcn/ui**: UI 组件库
- **React Hook Form**: 表单管理

## 文件结构

```
messages/
├── page.tsx                    # 消息列表主页
├── components/
│   ├── MessageList.tsx        # 消息列表组件
│   ├── MessageItem.tsx        # 单条消息组件
│   ├── MessageFilter.tsx      # 消息筛选器
│   ├── NotificationBell.tsx    # 通知铃铛图标
│   └── MessageSettings.tsx    # 消息设置面板
├── hooks/
│   ├── useMessages.ts         # 消息管理 Hook
│   └── useNotifications.ts    # 通知管理 Hook
└── types/
    └── message.ts             # 消息类型定义
```

## 消息类型

```typescript
interface Message {
  id: string;
  type: 'system' | 'user' | 'email' | 'notification';
  title: string;
  content: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  recipient: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
  createdAt: Date;
  readAt?: Date;
  metadata?: Record<string, any>;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  desktop: boolean;
  sound: boolean;
  categories: string[];
}
```

## 核心功能

- **MessageCenter**: 消息中心主组件
- **NotificationProvider**: 通知上下文提供者
- **MessageQueue**: 消息队列管理
- **PushNotification**: 推送通知服务
- **EmailIntegration**: 邮件集成服务

## 开发注意事项

- 消息推送频率控制
- 用户隐私和权限管理
- 消息存储和清理策略
- 跨设备消息同步
- 推送服务可用性检查

## API 端点

- `/api/messages` - 消息 CRUD 操作
- `/api/messages/mark-read` - 标记已读
- `/api/messages/settings` - 通知设置
- `/api/messages/push` - 推送消息
- `/api/messages/stats` - 消息统计

## WebSocket 事件

```typescript
// 新消息通知
socket.on('newMessage', (message) => {
  // 处理新消息
});

// 消息状态更新
socket.emit('markAsRead', { messageIds });

// 实时通知
socket.on('notification', (notification) => {
  // 显示通知
});
```

## 推送集成

```typescript
// Web Push API
if ('serviceWorker' in navigator && 'PushManager' in window) {
  // 注册 Service Worker
  // 订阅推送服务
}

// 移动端推送 (FCM)
// Firebase Cloud Messaging 集成
```
