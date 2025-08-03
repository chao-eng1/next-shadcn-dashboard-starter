# 🚀 WebSocket 消息中心设置指南

## 概述

本项目已成功集成 Socket.io 实时消息系统，支持项目群聊、私聊消息和项目通知的实时推送。

## 🏗️ 架构说明

### 后端架构
- **Socket.io 服务器**: 独立的 Node.js 服务器 (`server.js`)
- **消息广播服务**: 服务端广播客户端 (`src/lib/socket-broadcast.ts`)
- **API 集成**: 消息发送 API 自动触发实时广播

### 前端架构
- **WebSocket 服务**: Socket.io 客户端服务 (`src/lib/websocket-service.ts`)
- **消息中心 Hook**: React Hook 管理消息状态 (`src/hooks/use-message-center.ts`)
- **实时通知**: 浏览器通知和音效提示

## 🚀 快速启动

### 1. 安装依赖
```bash
pnpm install
```

### 2. 环境配置
确保 `.env.local` 文件包含以下配置：
```env
# WebSocket服务器配置
NEXT_PUBLIC_WS_URL=http://localhost:3001
WS_PORT=3001

# NextAuth配置
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

### 3. 启动服务

#### 方式一：分别启动（推荐用于开发调试）
```bash
# 终端1：启动 Socket.io 服务器
pnpm dev:ws

# 终端2：启动 Next.js 开发服务器
pnpm dev
```

#### 方式二：同时启动
```bash
# 同时启动两个服务
pnpm dev:all
```

### 4. 验证连接
访问测试页面验证 WebSocket 连接：
```
http://localhost:3000/test-websocket.html
```

## 📋 功能特性

### ✅ 已实现功能

#### 🔄 实时通信
- [x] Socket.io 服务器连接管理
- [x] 自动重连和心跳检测
- [x] 用户认证和会话管理
- [x] 多标签页同步支持

#### 💬 消息功能
- [x] 项目群聊实时消息
- [x] 私聊消息实时推送
- [x] 消息已读状态同步
- [x] 输入状态指示器
- [x] 消息回复功能

#### 🔔 通知系统
- [x] 浏览器桌面通知
- [x] 音效提示
- [x] 项目事件通知
- [x] 用户在线状态同步

#### 🏢 项目管理
- [x] 项目房间管理
- [x] 项目成员状态
- [x] 项目通知广播

### 🔧 技术实现

#### Socket.io 事件列表

**客户端发送事件：**
- `conversation:join` - 加入会话
- `conversation:leave` - 离开会话
- `message:send` - 发送消息
- `message:read` - 标记消息已读
- `typing:start/stop` - 输入状态
- `project:join` - 加入项目
- `project:notification` - 项目通知

**服务端广播事件：**
- `message:new` - 新消息通知
- `message:sent` - 消息发送确认
- `message:read` - 消息已读状态
- `typing:start/stop` - 输入状态变化
- `user:status` - 用户状态变化
- `project:notification` - 项目通知

#### API 集成
消息发送 API 自动触发 Socket.io 广播：
- `POST /api/conversations/[conversationId]/messages` - 项目群聊
- `POST /api/projects/[projectId]/private-conversations/[conversationId]/messages` - 私聊

## 🧪 测试指南

### 1. WebSocket 连接测试
1. 访问 `http://localhost:3000/test-websocket.html`
2. 输入用户ID，点击"连接"
3. 观察连接状态变化

### 2. 消息发送测试
1. 在测试页面加入会话
2. 发送测试消息
3. 观察消息广播和确认

### 3. 多用户测试
1. 打开多个浏览器标签页
2. 使用不同用户ID连接
3. 测试消息互发和实时接收

### 4. 项目功能测试
1. 加入项目房间
2. 发送项目通知
3. 验证通知广播

## 🔍 故障排除

### 常见问题

#### 1. WebSocket 连接失败
**症状**: 无法连接到 Socket.io 服务器
**解决方案**:
- 确认 Socket.io 服务器正在运行 (`pnpm dev:ws`)
- 检查端口 3001 是否被占用
- 验证环境变量 `NEXT_PUBLIC_WS_URL` 配置

#### 2. 消息不能实时接收
**症状**: 发送消息后其他用户收不到
**解决方案**:
- 检查用户是否已加入相应会话房间
- 确认消息 API 是否正确调用广播服务
- 查看服务器控制台日志

#### 3. 认证失败
**症状**: Socket.io 连接被拒绝
**解决方案**:
- 在开发环境下会自动使用匿名认证
- 生产环境需要实现 JWT token 获取
- 检查 `/api/ws/token` 端点

### 调试技巧

#### 1. 服务器日志
```bash
# Socket.io 服务器日志
tail -f server.log
```

#### 2. 浏览器控制台
```javascript
// 检查 WebSocket 连接状态
console.log(window.wsService?.isConnected);

// 监听所有 Socket.io 事件
socket.onAny((event, ...args) => {
  console.log('Socket event:', event, args);
});
```

#### 3. 网络检查
```bash
# 检查端口占用
lsof -i :3001

# 测试 Socket.io 连接
curl http://localhost:3001/health
```

## 📈 性能优化

### 1. 连接管理
- 实现连接池管理
- 优化重连策略
- 添加连接超时处理

### 2. 消息优化
- 消息队列管理
- 批量消息处理
- 消息压缩

### 3. 内存管理
- 定期清理断开的连接
- 限制消息历史记录
- 优化房间管理

## 🔒 安全考虑

### 1. 认证安全
- 实现 JWT token 验证
- 定期刷新认证令牌
- 防止 token 泄露

### 2. 消息安全
- 消息内容验证
- 防止消息洪水攻击
- 敏感信息过滤

### 3. 连接安全
- 限制连接频率
- IP 白名单机制
- CORS 配置

## 🚀 部署指南

### 生产环境部署

#### 1. 环境变量配置
```env
NEXT_PUBLIC_WS_URL=wss://your-domain.com
WS_PORT=3001
NODE_ENV=production
```

#### 2. Socket.io 服务器部署
```bash
# 使用 PM2 管理进程
pm2 start server.js --name "websocket-server"

# 或使用 Docker
docker run -d -p 3001:3001 --name ws-server your-app
```

#### 3. 负载均衡
- 使用 Redis 适配器支持多实例
- 配置 Nginx 反向代理
- 启用 WebSocket 粘性会话

## 📚 相关文档

- [Socket.io 官方文档](https://socket.io/docs/)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- [消息中心产品需求文档](./消息中心.md)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。