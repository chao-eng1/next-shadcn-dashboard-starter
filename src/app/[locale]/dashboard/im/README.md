# IM 模块

## 模块概述

即时通讯模块，提供企业级即时消息服务，支持个人聊天、群组聊天、文件传输等功能。

## 主要功能

- 💬 一对一私聊
- 👥 群组聊天管理
- 📱 消息推送通知
- 📎 文件和图片传输
- 🎤 语音消息支持
- 📹 视频通话集成
- 🔒 端到端加密
- 📋 消息撤回和编辑
- 🔍 聊天记录搜索
- 👤 用户在线状态

## 技术栈

- **WebSocket**: 实时通信协议
- **Socket.io**: 实时通信库
- **WebRTC**: 音视频通话
- **Zustand**: 状态管理
- **React**: 前端框架
- **shadcn/ui**: UI 组件

## 文件结构

```
im/
├── page.tsx              # IM 主界面
├── components/
│   ├── ChatWindow.tsx    # 聊天窗口
│   ├── ContactList.tsx   # 联系人列表
│   ├── MessageInput.tsx  # 消息输入框
│   └── FileUpload.tsx    # 文件上传组件
└── hooks/
    ├── useChat.ts        # 聊天逻辑 Hook
    └── useWebRTC.ts      # 音视频通话 Hook
```

## 核心组件

- **ChatWindow**: 聊天窗口主组件
- **MessageBubble**: 消息气泡组件
- **ContactList**: 联系人和群组列表
- **FilePreview**: 文件预览组件
- **VoiceRecorder**: 语音录制组件

## 开发注意事项

- WebSocket 连接状态管理
- 消息加密和安全传输
- 文件上传大小和格式限制
- 音视频权限申请处理
- 离线消息同步机制

## API 端点

- `/api/im/messages` - 消息管理
- `/api/im/contacts` - 联系人管理
- `/api/im/groups` - 群组管理
- `/api/im/files` - 文件传输

## WebSocket 事件

```typescript
// 发送消息
socket.emit('sendMessage', { to, content, type });

// 接收消息
socket.on('messageReceived', (message) => {});

// 用户状态变化
socket.on('userStatusChanged', (status) => {});
```
