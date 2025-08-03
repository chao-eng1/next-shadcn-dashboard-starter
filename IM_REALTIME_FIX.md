# 即时通讯实时消息接收修复

## 问题描述
即时通讯系统中，一个账号发送消息后，另一个用户没有实时接收更新页面，需要刷新一下才能收到消息。

## 修复内容

### 1. 修复了无限循环依赖问题
**位置**: `/src/hooks/useIM.ts` 和 `/src/app/[locale]/dashboard/im/page.tsx`

**问题**: useEffect依赖导致的无限重渲染
**解决方案**: 使用useRef存储函数引用，避免闭包依赖

```typescript
// 使用refs来存储函数引用，避免useEffect依赖问题
const startPollingRef = useRef<() => void>(() => {});
const stopPollingRef = useRef<() => void>(() => {});
const loadOnlineUsersRef = useRef<() => Promise<void>>(async () => {});

// WebSocket回调中使用refs
onConnect: () => {
  setIsConnected(true);
  setConnectionStatus('connected');
  stopPollingRef.current();
  loadOnlineUsersRef.current();
}
```

### 2. 增强WebSocket消息处理
**位置**: `/src/store/im-store.ts`

**改进**:
- 避免重复添加发送者自己的消息
- 改进消息去重逻辑
- 添加桌面通知功能
- 优化消息状态更新

```typescript
// 检查消息是否来自当前用户，避免重复添加自己发送的消息
const isOwnMessage = message.data.senderId === state.currentUser?.id;

// 如果不是自己发送的消息，或者当前会话就是消息所在的会话，则添加消息
if (!isOwnMessage || state.currentConversation?.id === message.data.conversationId) {
  get().addMessage(newMessage);
  
  // 桌面通知
  if (!isOwnMessage && state.currentConversation?.id !== message.data.conversationId) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${newMessage.senderName}发来新消息`, {
        body: newMessage.content,
        icon: newMessage.senderImage || '/default-avatar.png'
      });
    }
  }
}
```

### 3. 实现轮询备选机制
**位置**: `/src/hooks/useIM.ts`

**功能**: 当WebSocket断开时自动启动轮询模式，确保消息能够及时接收

```typescript
// 轮询获取新消息的函数
const pollForNewMessages = useCallback(async () => {
  const state = getStoreState();
  if (!state.currentUser || !state.currentConversation) return;
  
  try {
    const result = await imAPI.message.getMessages(state.currentConversation.id, 1, 10);
    const newMessages = result.messages.filter(msg => 
      new Date(msg.createdAt) > new Date(lastMessageTimestampRef.current) &&
      !state.messages.some(existingMsg => existingMsg.id === msg.id)
    );
    
    if (newMessages.length > 0) {
      lastMessageTimestampRef.current = newMessages[newMessages.length - 1].createdAt;
      newMessages.forEach(msg => {
        if (msg.senderId !== state.currentUser?.id) {
          addMessage(msg);
        }
      });
    }
  } catch (error) {
    console.error('轮询消息失败:', error);
  }
}, [getStoreState, addMessage]);
```

### 4. 改进WebSocket连接管理
**位置**: `/src/hooks/useWebSocket.ts`

**改进**:
- 启用自动重连功能
- 增加重连次数限制
- 改进连接状态管理
- 优化token更新处理

### 5. 创建WebSocket API端点
**位置**: `/src/app/api/ws/token/route.ts`

生成WebSocket认证令牌，支持安全的WebSocket连接。

### 6. 完善UI反馈
**位置**: `/src/app/[locale]/dashboard/im/page.tsx`

- 显示"轮询模式"而非"离线模式"
- 添加轮询控制逻辑
- 实现组件清理函数

## 关键特性

### 双重保障机制
1. **WebSocket优先**: 实时推送消息
2. **轮询备选**: WebSocket失败时自动启动轮询（每3秒）

### 智能切换
- WebSocket连接成功时停止轮询
- WebSocket断开时自动启动轮询
- 用户界面显示当前连接状态

### 消息防重复
- 时间戳跟踪确保只获取新消息
- 消息ID去重避免重复显示
- 发送者消息本地优先显示

### 用户体验
- 支持桌面通知提醒新消息
- 连接状态实时显示
- 无缝切换不影响用户使用

## 使用效果

现在当用户A发送消息后，用户B会立即看到新消息，无需手动刷新页面。系统会：

1. 优先使用WebSocket实时推送
2. WebSocket失败时自动切换到轮询模式
3. 显示当前连接状态（实时/轮询模式）
4. 支持桌面通知提醒

这个解决方案确保了即时通讯的可靠性和实时性，即使在WebSocket服务器不可用的情况下，用户仍能及时收到消息更新。

## 测试建议

1. 打开两个浏览器窗口登录不同账号
2. 在一个窗口发送消息
3. 观察另一个窗口是否立即收到消息
4. 测试WebSocket断开时的轮询模式
5. 验证桌面通知是否正常工作