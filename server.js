const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// 加载环境变量
require('dotenv').config({ path: '.env.local' });

const app = express();
const httpServer = createServer(app);

// 配置CORS
app.use(
  cors({
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    credentials: true
  })
);

// Socket.io服务器配置
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// 设置服务端客户端处理器
function setupServerClientHandlers(socket) {
  // 处理服务端广播消息
  socket.on('server:broadcast:message', (data) => {
    const { room, event, data: messageData, excludeUserId } = data;

    if (excludeUserId) {
      // 排除特定用户
      const excludeSocketId = userConnections.get(excludeUserId);
      if (excludeSocketId) {
        socket.to(room).except(excludeSocketId).emit(event, messageData);
      } else {
        socket.to(room).emit(event, messageData);
      }
    } else {
      socket.to(room).emit(event, messageData);
    }

    console.log(`服务端广播消息到房间 ${room}:`, event);
  });

  // 处理项目通知广播
  socket.on('server:broadcast:notification', (data) => {
    const { projectId, notification, targetUsers } = data;

    if (targetUsers && targetUsers.length > 0) {
      // 发送给指定用户
      targetUsers.forEach((userId) => {
        const targetSocketId = userConnections.get(userId);
        if (targetSocketId) {
          io.to(targetSocketId).emit('project:notification', {
            projectId,
            notification,
            timestamp: new Date().toISOString()
          });
        }
      });
    } else {
      // 广播给项目房间内的所有用户
      socket.to(`project:${projectId}`).emit('project:notification', {
        projectId,
        notification,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`服务端广播项目通知: ${projectId}`);
  });

  // 处理用户状态广播
  socket.on('server:broadcast:user-status', (data) => {
    const { userId, status, projectIds, timestamp } = data;

    if (projectIds && projectIds.length > 0) {
      // 广播到指定项目房间
      projectIds.forEach((projectId) => {
        socket.to(`project:${projectId}`).emit('user:status', {
          userId,
          status,
          timestamp
        });
      });
    } else {
      // 全局广播
      socket.broadcast.emit('user:status', {
        userId,
        status,
        timestamp
      });
    }

    console.log(`服务端广播用户状态: ${userId} - ${status}`);
  });
}

// 存储用户连接信息
const userConnections = new Map();
const userRooms = new Map();

// JWT验证中间件
const authenticateSocket = (socket, next) => {
  const token =
    socket.handshake.auth.token ||
    socket.handshake.headers.authorization?.replace('Bearer ', '');
  const isServerClient = socket.handshake.auth.serverClient;

  // 服务端客户端使用特殊token
  if (isServerClient && token === 'server-broadcast-token') {
    socket.isServerClient = true;
    socket.userId = 'server';
    return next();
  }

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    );

    socket.userId = decoded.sub || decoded.id;
    socket.userEmail = decoded.email;
    socket.isServerClient = false;
    next();
  } catch (err) {
    // 如果token验证失败，但是在开发环境，允许匿名连接
    if (process.env.NODE_ENV === 'development') {
      socket.userId = 'anonymous-' + Date.now();
      socket.userEmail = 'anonymous@example.com';
      socket.isServerClient = false;
      next();
    } else {
      next(new Error('Authentication error: Invalid token'));
    }
  }
};

// 应用认证中间件
io.use(authenticateSocket);

// Socket.io连接处理
io.on('connection', (socket) => {
  if (socket.isServerClient) {
    console.log('服务端广播客户端已连接');
    setupServerClientHandlers(socket);
    return;
  }

  console.log(`用户 ${socket.userId} 已连接，Socket ID: ${socket.id}`);

  // 存储用户连接
  userConnections.set(socket.userId, socket.id);

  // 用户上线状态
  socket.broadcast.emit('user:status', {
    userId: socket.userId,
    status: 'online',
    timestamp: new Date().toISOString()
  });

  // 加入对话房间
  socket.on('conversation:join', (data) => {
    const { conversationId, type } = data;
    const roomName = `${type}:${conversationId}`;

    socket.join(roomName);

    // 记录用户所在房间
    if (!userRooms.has(socket.userId)) {
      userRooms.set(socket.userId, new Set());
    }
    userRooms.get(socket.userId).add(roomName);

    console.log(`用户 ${socket.userId} 加入房间: ${roomName}`);

    socket.emit('conversation:joined', {
      conversationId,
      type,
      success: true
    });
  });

  // 离开对话房间
  socket.on('conversation:leave', (data) => {
    const { conversationId, type } = data;
    const roomName = `${type}:${conversationId}`;

    socket.leave(roomName);

    if (userRooms.has(socket.userId)) {
      userRooms.get(socket.userId).delete(roomName);
    }

    console.log(`用户 ${socket.userId} 离开房间: ${roomName}`);
  });

  // 发送消息
  socket.on('message:send', (data) => {
    const { conversationId, type, content, messageId, timestamp } = data;
    const roomName = `${type}:${conversationId}`;

    // 广播消息到房间内的其他用户
    socket.to(roomName).emit('message:new', {
      id: messageId,
      conversationId,
      type,
      content,
      senderId: socket.userId,
      senderEmail: socket.userEmail,
      timestamp,
      status: 'sent'
    });

    // 确认消息已发送
    socket.emit('message:sent', {
      messageId,
      conversationId,
      timestamp,
      status: 'delivered'
    });

    console.log(`消息已发送到房间 ${roomName}:`, content.substring(0, 50));
  });

  // 消息已读状态
  socket.on('message:read', (data) => {
    const { messageId, conversationId, type } = data;
    const roomName = `${type}:${conversationId}`;

    socket.to(roomName).emit('message:read', {
      messageId,
      conversationId,
      readBy: socket.userId,
      timestamp: new Date().toISOString()
    });
  });

  // 正在输入状态
  socket.on('typing:start', (data) => {
    const { conversationId, type } = data;
    const roomName = `${type}:${conversationId}`;

    socket.to(roomName).emit('typing:start', {
      conversationId,
      userId: socket.userId,
      userEmail: socket.userEmail
    });
  });

  socket.on('typing:stop', (data) => {
    const { conversationId, type } = data;
    const roomName = `${type}:${conversationId}`;

    socket.to(roomName).emit('typing:stop', {
      conversationId,
      userId: socket.userId
    });
  });

  // 项目通知
  socket.on('project:notification', (data) => {
    const { projectId, notification, targetUsers } = data;

    // 发送给指定用户
    if (targetUsers && targetUsers.length > 0) {
      targetUsers.forEach((userId) => {
        const targetSocketId = userConnections.get(userId);
        if (targetSocketId) {
          io.to(targetSocketId).emit('project:notification', {
            projectId,
            notification,
            timestamp: new Date().toISOString()
          });
        }
      });
    } else {
      // 广播给项目房间内的所有用户
      socket.to(`project:${projectId}`).emit('project:notification', {
        projectId,
        notification,
        timestamp: new Date().toISOString()
      });
    }
  });

  // 加入项目房间
  socket.on('project:join', (data) => {
    const { projectId } = data;
    const roomName = `project:${projectId}`;

    socket.join(roomName);
    console.log(`用户 ${socket.userId} 加入项目房间: ${roomName}`);
  });

  // 心跳检测
  socket.on('ping', () => {
    socket.emit('pong', {
      timestamp: new Date().toISOString()
    });
  });

  // 断开连接处理
  socket.on('disconnect', (reason) => {
    if (socket.isServerClient) {
      console.log('服务端广播客户端断开连接');
      return;
    }

    console.log(`用户 ${socket.userId} 断开连接，原因: ${reason}`);

    // 清理用户连接信息
    userConnections.delete(socket.userId);
    userRooms.delete(socket.userId);

    // 广播用户下线状态
    socket.broadcast.emit('user:status', {
      userId: socket.userId,
      status: 'offline',
      timestamp: new Date().toISOString()
    });
  });

  // 错误处理
  socket.on('error', (error) => {
    console.error(`Socket错误 (用户 ${socket.userId}):`, error);
    socket.emit('error', {
      message: '连接错误',
      timestamp: new Date().toISOString()
    });
  });
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    connections: userConnections.size
  });
});

// 获取在线用户
app.get('/online-users', (req, res) => {
  res.json({
    count: userConnections.size,
    users: Array.from(userConnections.keys())
  });
});

const PORT = process.env.WS_PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.io服务器运行在端口 ${PORT}`);
  console.log(`📡 WebSocket连接地址: ws://localhost:${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('正在关闭Socket.io服务器...');
  httpServer.close(() => {
    console.log('Socket.io服务器已关闭');
    process.exit(0);
  });
});

module.exports = { app, io, httpServer };
