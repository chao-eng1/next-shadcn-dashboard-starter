# Tasks 模块

## 模块概述

任务管理模块，提供个人和团队任务的创建、分配、跟踪、协作等完整的任务管理功能。

## 主要功能

- ✅ 任务创建和编辑
- 👥 任务分配和协作
- 📅 任务计划和排期
- 🏷️ 任务分类和标签
- ⏰ 任务提醒和通知
- 📊 任务进度跟踪
- 🔄 任务状态管理
- 📈 任务统计分析
- 🔗 任务依赖关系
- 📝 任务评论和附件

## 技术栈

- **React**: 前端框架
- **Prisma**: 数据库 ORM
- **React Hook Form**: 表单管理
- **Zod**: 数据验证
- **shadcn/ui**: UI 组件库
- **React Query**: 数据获取
- **date-fns**: 日期处理
- **WebSocket**: 实时更新

## 文件结构

```
tasks/
├── page.tsx                    # 任务列表页面
├── [id]/
│   ├── page.tsx               # 任务详情页面
│   ├── edit/                  # 任务编辑
│   └── comments/              # 任务评论
├── components/
│   ├── TaskCard.tsx           # 任务卡片
│   ├── TaskForm.tsx           # 任务表单
│   ├── TaskList.tsx           # 任务列表
│   ├── TaskFilters.tsx        # 任务筛选
│   ├── TaskCalendar.tsx       # 任务日历
│   ├── TaskProgress.tsx       # 任务进度
│   ├── TaskComments.tsx       # 任务评论
│   └── TaskAssignee.tsx       # 任务分配
├── create/
│   └── page.tsx               # 创建任务页面
└── calendar/
    └── page.tsx               # 任务日历视图
```

## 数据模型

```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  assignee?: User;
  reporterId: string;
  reporter: User;
  projectId?: string;
  project?: Project;
  dueDate?: Date;
  startDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  dependencies: string[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  createdAt: Date;
  updatedAt: Date;
}

interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  user: User;
  content: string;
  createdAt: Date;
}

interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
}
```

## 核心功能

### 任务管理

- 任务 CRUD 操作
- 批量任务操作
- 任务模板功能
- 任务复制和克隆

### 任务分配

- 单人/多人分配
- 任务转移和重新分配
- 工作负载平衡
- 权限控制

### 进度跟踪

- 任务状态更新
- 进度百分比
- 时间记录
- 里程碑跟踪

### 协作功能

- 实时评论
- @提及功能
- 文件共享
- 活动时间线

### 视图模式

- 列表视图
- 看板视图
- 日历视图
- 甘特图视图

## 任务状态流转

```
Todo → In Progress → Review → Done
  ↓         ↓          ↓
Cancelled ← ← ← ← ← ← ←
```

## 开发注意事项

- 实时状态同步
- 权限验证
- 数据一致性
- 性能优化
- 移动端适配

## API 端点

- `/api/tasks` - 任务 CRUD 操作
- `/api/tasks/[id]/comments` - 任务评论
- `/api/tasks/[id]/attachments` - 任务附件
- `/api/tasks/stats` - 任务统计
- `/api/tasks/search` - 任务搜索

## WebSocket 事件

- `task:created` - 任务创建
- `task:updated` - 任务更新
- `task:assigned` - 任务分配
- `task:commented` - 新增评论
- `task:status_changed` - 状态变更
