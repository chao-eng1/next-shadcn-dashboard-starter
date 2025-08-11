# Overview 模块

## 模块概述

仪表盘概览模块，提供项目整体数据展示、关键指标监控、快速操作入口等功能。

## 主要功能

- 📊 数据可视化图表
- 📈 关键指标统计
- 🎯 项目进度概览
- 👥 团队活动动态
- 📅 日程和任务提醒
- 🔔 重要通知展示
- ⚡ 快速操作面板
- 📱 响应式卡片布局
- 🎨 自定义仪表盘
- 📋 最近访问记录

## 技术栈

- **Chart.js**: 图表可视化
- **React**: 前端框架
- **Zustand**: 状态管理
- **React Query**: 数据获取
- **shadcn/ui**: UI 组件库
- **date-fns**: 日期处理
- **Framer Motion**: 动画效果

## 文件结构

```
overview/
├── page.tsx                    # 概览主页面
├── components/
│   ├── DashboardGrid.tsx      # 仪表盘网格布局
│   ├── StatCard.tsx           # 统计卡片
│   ├── ChartWidget.tsx        # 图表组件
│   ├── ActivityFeed.tsx       # 活动动态
│   ├── QuickActions.tsx       # 快速操作
│   ├── ProjectProgress.tsx    # 项目进度
│   ├── TeamOverview.tsx       # 团队概览
│   └── NotificationPanel.tsx  # 通知面板
├── hooks/
│   ├── useDashboard.ts        # 仪表盘数据
│   ├── useStats.ts            # 统计数据
│   └── useCharts.ts           # 图表数据
└── types/
    └── dashboard.ts           # 仪表盘类型
```

## 核心组件

### 统计卡片

```typescript
interface StatCard {
  id: string;
  title: string;
  value: number | string;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
  trend?: number[];
}
```

### 图表配置

```typescript
interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  data: ChartData;
  options: ChartOptions;
  responsive: boolean;
  maintainAspectRatio: boolean;
}
```

### 活动动态

```typescript
interface Activity {
  id: string;
  type: 'task' | 'message' | 'project' | 'user';
  title: string;
  description: string;
  user: User;
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

## 数据指标

- **项目统计**: 总项目数、进行中项目、已完成项目
- **任务指标**: 待办任务、进行中任务、已完成任务
- **团队数据**: 团队成员数、在线用户数、活跃度
- **消息统计**: 未读消息、今日消息、消息趋势
- **性能指标**: 系统响应时间、错误率、用户满意度

## 图表类型

- **折线图**: 趋势分析和时间序列数据
- **柱状图**: 分类数据对比
- **饼图**: 占比和分布展示
- **面积图**: 累积数据展示
- **仪表盘**: 进度和完成度展示

## 开发注意事项

- 数据更新频率控制
- 图表性能优化
- 响应式布局适配
- 数据缓存策略
- 错误状态处理
- 加载状态优化

## API 端点

- `/api/dashboard/stats` - 统计数据
- `/api/dashboard/charts` - 图表数据
- `/api/dashboard/activities` - 活动动态
- `/api/dashboard/notifications` - 通知数据

## 实时更新

```typescript
// WebSocket 实时数据更新
socket.on('statsUpdate', (stats) => {
  updateDashboardStats(stats);
});

socket.on('activityUpdate', (activity) => {
  addNewActivity(activity);
});

// 定时数据刷新
setInterval(() => {
  refreshDashboardData();
}, 30000); // 30秒刷新一次
```

## 自定义配置

```typescript
interface DashboardConfig {
  layout: 'grid' | 'masonry' | 'flex';
  widgets: Widget[];
  refreshInterval: number;
  theme: 'light' | 'dark' | 'auto';
  animations: boolean;
}
```
