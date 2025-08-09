# System Messages Demo 模块

## 模块概述
系统消息演示模块，展示各种类型的系统通知、消息组件和交互效果的演示页面。

## 主要功能
- 🔔 通知组件演示
- 💬 消息类型展示
- 🎨 UI 组件预览
- ⚡ 交互效果演示
- 📱 响应式布局测试
- 🌈 主题切换演示
- 🔄 实时消息模拟
- 📊 消息统计展示
- 🎯 用户体验测试
- 🛠️ 开发调试工具

## 技术栈
- **React**: 前端框架
- **shadcn/ui**: UI 组件库
- **Framer Motion**: 动画效果
- **React Hot Toast**: 通知组件
- **Zustand**: 状态管理
- **WebSocket**: 实时通信

## 文件结构
```
system-messages-demo/
├── page.tsx                    # 演示主页面
├── components/
│   ├── NotificationDemo.tsx   # 通知演示
│   ├── MessageTypeDemo.tsx    # 消息类型演示
│   ├── ToastDemo.tsx          # Toast 演示
│   ├── AlertDemo.tsx          # 警告演示
│   ├── ModalDemo.tsx          # 模态框演示
│   ├── BadgeDemo.tsx          # 徽章演示
│   ├── ProgressDemo.tsx       # 进度条演示
│   └── ThemeDemo.tsx          # 主题演示
├── types/
│   └── demo.ts                # 演示类型定义
└── utils/
    ├── mockData.ts            # 模拟数据
    └── demoHelpers.ts         # 演示工具函数
```

## 演示内容

### 通知类型
```typescript
interface NotificationDemo {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}
```

### 消息组件
```typescript
interface MessageComponent {
  id: string
  name: string
  description: string
  component: React.ComponentType
  props: Record<string, any>
  code: string
}
```

## 演示功能

### 基础通知
- Success 成功通知
- Error 错误通知
- Warning 警告通知
- Info 信息通知

### 高级组件
- 可操作通知
- 持久化通知
- 分组通知
- 进度通知

### 交互演示
- 点击触发
- 自动触发
- 批量操作
- 实时更新

### 样式演示
- 不同位置
- 不同尺寸
- 不同主题
- 动画效果

## 模拟数据
```typescript
const mockNotifications = [
  {
    id: '1',
    type: 'success',
    title: '操作成功',
    message: '数据已成功保存到服务器',
    timestamp: new Date()
  },
  {
    id: '2',
    type: 'error',
    title: '操作失败',
    message: '网络连接异常，请稍后重试',
    timestamp: new Date()
  }
]
```

## 开发工具
- 组件属性调试
- 实时预览更新
- 代码示例展示
- 性能监控面板

## 使用场景
- 组件开发测试
- UI/UX 设计验证
- 用户体验评估
- 开发团队演示
- 客户需求确认

## 开发注意事项
- 保持演示数据的真实性
- 确保所有组件正常工作
- 提供清晰的使用说明
- 支持快速切换和测试
- 记录用户反馈和建议

## API 端点
- `/api/demo/notifications` - 获取演示通知
- `/api/demo/messages` - 获取演示消息
- `/api/demo/components` - 获取组件列表