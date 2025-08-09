# Modern IM 模块

## 模块概述
现代化即时通讯模块，提供企业级实时通信解决方案，支持多媒体消息、群组管理、音视频通话等高级功能。

## 主要功能
- 💬 现代化聊天界面
- 🎨 自定义主题和样式
- 📱 响应式设计适配
- 🎵 音频消息录制和播放
- 📹 视频消息和通话
- 🖼️ 图片和文件预览
- 😀 表情包和贴纸
- 🔗 链接预览和卡片
- 📍 位置分享
- 🤖 AI 助手集成
- 🔐 消息加密传输
- 📊 消息统计和分析

## 技术栈
- **React 19**: 最新 React 特性
- **WebSocket**: 实时通信
- **WebRTC**: 音视频通话
- **Canvas API**: 图片处理
- **Web Audio API**: 音频处理
- **IndexedDB**: 本地存储
- **Service Worker**: 离线支持
- **shadcn/ui**: 现代 UI 组件

## 文件结构
```
modern-im/
├── page.tsx                     # 主聊天界面
├── components/
│   ├── ChatInterface.tsx       # 聊天主界面
│   ├── MessageBubble.tsx       # 现代消息气泡
│   ├── MediaPlayer.tsx         # 多媒体播放器
│   ├── VoiceRecorder.tsx       # 语音录制器
│   ├── VideoCall.tsx           # 视频通话组件
│   ├── EmojiPicker.tsx         # 表情选择器
│   ├── FileUploader.tsx        # 文件上传器
│   └── LinkPreview.tsx         # 链接预览
├── hooks/
│   ├── useModernChat.ts        # 现代聊天逻辑
│   ├── useMediaRecorder.ts     # 媒体录制
│   ├── useWebRTC.ts            # 音视频通话
│   └── useOfflineSync.ts       # 离线同步
├── utils/
│   ├── encryption.ts          # 消息加密
│   ├── mediaProcessor.ts      # 媒体处理
│   └── linkParser.ts          # 链接解析
└── types/
    └── modern-im.ts            # 类型定义
```

## 核心特性

### 消息类型
```typescript
interface ModernMessage {
  id: string
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'link'
  content: string
  metadata?: {
    duration?: number        // 音视频时长
    size?: number           // 文件大小
    dimensions?: { width: number, height: number }
    thumbnail?: string      // 缩略图
    coordinates?: { lat: number, lng: number }
  }
  sender: User
  timestamp: Date
  isEncrypted: boolean
  reactions: Reaction[]
  replyTo?: string
  isEdited: boolean
}
```

### 实时功能
- **打字指示器**: 显示用户正在输入状态
- **在线状态**: 实时用户在线/离线状态
- **消息状态**: 发送中/已送达/已读状态
- **实时协作**: 多人同时编辑和讨论

### 多媒体支持
- **图片**: 自动压缩、缩略图生成
- **视频**: 视频压缩、预览播放
- **音频**: 语音消息录制和播放
- **文件**: 多格式文件预览和下载

## 开发注意事项
- WebRTC 兼容性处理
- 媒体文件大小和格式限制
- 加密算法选择和密钥管理
- 离线消息同步策略
- 性能优化和内存管理
- 跨浏览器兼容性测试

## API 端点
- `/api/modern-im/messages` - 消息管理
- `/api/modern-im/media` - 媒体文件处理
- `/api/modern-im/calls` - 音视频通话
- `/api/modern-im/encryption` - 加密密钥管理

## WebSocket 事件
```typescript
// 现代消息事件
socket.emit('sendModernMessage', {
  type: 'text',
  content: 'Hello!',
  encrypted: true
})

// 媒体消息
socket.emit('sendMediaMessage', {
  type: 'image',
  file: blob,
  thumbnail: thumbnailBlob
})

// 通话邀请
socket.emit('callInvite', {
  to: userId,
  type: 'video',
  offer: rtcOffer
})
```

## 性能优化
- 虚拟滚动处理大量消息
- 图片懒加载和渐进式加载
- 消息分页和无限滚动
- WebWorker 处理加密解密
- Service Worker 缓存策略