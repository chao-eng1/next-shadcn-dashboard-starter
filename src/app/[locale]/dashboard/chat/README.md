# Chat 模块

## 模块概述

聊天功能模块，提供实时消息通信、会话管理、用户状态显示等功能。

## 主要功能

- 📱 实时消息发送与接收
- 💬 多人群聊和私聊支持
- 👥 在线用户状态显示
- ⌨️ 输入状态提示（正在输入...）
- 📎 文件和媒体分享
- 🔔 消息通知管理
- 📝 消息历史记录
- 🔍 消息搜索功能

## 技术栈

- **WebSocket**: 实时通信基础
- **Socket.io**: WebSocket 客户端/服务端
- **Zustand**: 消息状态管理
- **shadcn/ui**: UI 组件库
- **next-intl**: 国际化支持

## 相关文件

- `WebSocketService`: 客户端 WebSocket 连接管理
- `MessageStore`: 消息状态存储
- `socket-broadcast.ts`: 服务端消息广播

## 开发注意事项

- 确保 WebSocket 服务运行在 3001 端口
- 使用 `useMessageStore` 管理消息状态
- 实现消息持久化和离线消息处理
- 注意消息安全和用户隐私保护

## API 端点

- `/api/messages` - 消息 CRUD 操作
- `/api/conversations` - 会话管理
- `/api/users/status` - 用户状态更新

## 环境变量

```env
NEXT_PUBLIC_WS_URL=http://localhost:3001
```
