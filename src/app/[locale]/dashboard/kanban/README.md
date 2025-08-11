# Kanban 模块

## 模块概述

看板项目管理模块，提供敏捷开发看板功能，支持任务拖拽、状态管理、团队协作等功能。

## 主要功能

- 📋 看板列表管理
- 🎯 任务卡片创建和编辑
- 🔄 拖拽排序和状态变更
- 👥 团队成员分配
- 🏷️ 标签和优先级设置
- 📅 截止日期管理
- 💬 任务评论和讨论
- 📊 进度统计和报表
- 🔔 任务提醒通知
- 📱 实时协作更新

## 技术栈

- **React DnD**: 拖拽功能实现
- **Zustand**: 状态管理
- **Prisma**: 数据持久化
- **WebSocket**: 实时协作
- **shadcn/ui**: UI 组件库
- **date-fns**: 日期处理

## 文件结构

```
kanban/
├── page.tsx                 # 看板主页面
├── components/
│   ├── Board.tsx           # 看板容器
│   ├── Column.tsx          # 看板列
│   ├── TaskCard.tsx        # 任务卡片
│   ├── TaskModal.tsx       # 任务详情弹窗
│   └── AddTaskForm.tsx     # 添加任务表单
├── hooks/
│   ├── useKanban.ts        # 看板逻辑 Hook
│   └── useDragDrop.ts      # 拖拽逻辑 Hook
└── types/
    └── kanban.ts           # 看板类型定义
```

## 核心组件

- **Board**: 看板主容器，管理所有列和任务
- **Column**: 看板列组件，代表任务状态
- **TaskCard**: 任务卡片，显示任务基本信息
- **TaskModal**: 任务详情弹窗，编辑任务详细信息
- **DragDropProvider**: 拖拽上下文提供者

## 数据模型

```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigneeId?: string;
  dueDate?: Date;
  labels: string[];
  position: number;
}

interface Column {
  id: string;
  title: string;
  status: string;
  tasks: Task[];
  position: number;
}
```

## 开发注意事项

- 拖拽性能优化
- 实时协作冲突处理
- 任务位置计算算法
- 权限控制和访问限制
- 数据同步和离线处理

## API 端点

- `/api/kanban/boards` - 看板管理
- `/api/kanban/tasks` - 任务 CRUD
- `/api/kanban/columns` - 列管理
- `/api/kanban/move` - 任务移动

## WebSocket 事件

```typescript
// 任务移动
socket.emit('taskMoved', { taskId, fromColumn, toColumn, position });

// 任务更新
socket.emit('taskUpdated', { taskId, updates });

// 实时同步
socket.on('boardUpdated', (boardData) => {});
```
