# Profile Module - 个人资料模块

## 概述

个人资料模块是企业级项目管理系统的核心用户管理功能，提供完整的用户信息展示、编辑和管理功能。该模块采用现代化的设计理念，支持多标签页布局，涵盖用户概览、个人信息、安全设置、偏好配置和活动记录等功能。

## 核心功能

### 🎯 主要特性

- **用户信息展示**: 完整的用户基本信息展示，包括头像、姓名、邮箱、个人简介等
- **多标签页布局**: 5个功能标签页，清晰分类不同类型的用户信息
- **统计数据概览**: 用户活动统计，包括项目参与、任务完成、文档创建等
- **安全设置管理**: 密码修改、两步验证、设备管理等安全功能
- **偏好设置**: 主题、语言、通知等个性化配置
- **活动记录**: 详细的用户操作历史记录
- **响应式设计**: 完美适配桌面端和移动端

### 📊 功能模块

#### 1. 概览 (Overview)
- 用户活动统计卡片
- 最近活动时间线
- 快速数据洞察

#### 2. 个人信息 (Personal)
- 基本信息展示
- 联系方式管理
- 个人简介编辑

#### 3. 安全设置 (Security)
- 密码管理
- 两步验证设置
- 登录设备管理
- 安全日志查看

#### 4. 偏好设置 (Preferences)
- 界面主题选择
- 语言设置
- 通知偏好配置

#### 5. 活动记录 (Activity)
- 详细操作历史
- 按日期分组显示
- 操作类型图标标识

## 技术实现

### 🛠 技术栈

- **框架**: Next.js 15 + React 19
- **类型系统**: TypeScript
- **样式**: Tailwind CSS v4
- **组件库**: shadcn/ui + Radix UI
- **图标**: Lucide React
- **国际化**: next-intl
- **状态管理**: React Hooks (useState)
- **路由**: Next.js App Router

### 📁 文件结构

```
src/app/[locale]/dashboard/profile/
├── [[...profile]]/
│   └── page.tsx                 # 动态路由页面
├── README.md                    # 模块文档
src/features/profile/
├── components/
│   ├── profile-view-page.tsx    # 主要展示组件
│   ├── profile-create-form.tsx  # 创建表单组件
├── utils/
│   └── form-schema.ts           # 表单验证模式
```

### 🎨 设计系统

#### 组件使用
- `Card`: 信息卡片容器
- `Tabs`: 多标签页导航
- `Avatar`: 用户头像展示
- `Badge`: 状态标签
- `Button`: 交互按钮
- `Separator`: 内容分隔线
- `Heading`: 页面标题组件
- `PageContainer`: 页面布局容器

#### 图标系统
- `User`: 用户相关
- `Activity`: 活动记录
- `Shield`: 安全设置
- `Settings`: 系统设置
- `Bell`: 通知消息
- `Edit`: 编辑操作
- `Camera`: 头像上传

### 📱 响应式设计

```css
/* 移动端优先设计 */
.grid {
  @apply gap-6;
  @apply md:grid-cols-2;  /* 中等屏幕 2 列 */
  @apply lg:grid-cols-4;  /* 大屏幕 4 列 */
}

/* 弹性布局适配 */
.flex {
  @apply flex-col;        /* 移动端垂直布局 */
  @apply sm:flex-row;     /* 小屏幕水平布局 */
}
```

## 数据模型

### 用户信息模型

```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
  timezone: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  createdAt: Date;
  updatedAt: Date;
  stats: {
    projectsCount: number;
    tasksCompleted: number;
    documentsCreated: number;
    messagesCount: number;
  };
}
```

### 活动记录模型

```typescript
interface ActivityRecord {
  id: string;
  userId: string;
  action: string;
  target: string;
  type: 'task' | 'document' | 'project' | 'message';
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

## 组件 API

### ProfileViewPage

主要的个人资料展示组件，包含完整的用户信息管理界面。

```typescript
interface ProfileViewPageProps {
  // 当前为自包含组件，无需外部 props
  // 未来可扩展支持用户 ID 参数
}
```

#### 状态管理

```typescript
const [activeTab, setActiveTab] = useState<string>('overview');
```

#### 主要方法

- `handleTabChange`: 标签页切换处理
- `handleEditProfile`: 编辑资料处理
- `handleAvatarUpload`: 头像上传处理

## 国际化支持

### 文本键值

```json
{
  "profile": {
    "title": "个人资料",
    "description": "管理您的个人信息和账户设置",
    "tabs": {
      "overview": "概览",
      "personal": "个人信息",
      "security": "安全设置",
      "preferences": "偏好设置",
      "activity": "活动记录"
    },
    "stats": {
      "projects": "参与项目",
      "tasks": "完成任务",
      "documents": "创建文档",
      "messages": "消息数量"
    }
  }
}
```

## 开发指南

### 🚀 快速开始

1. **安装依赖**
   ```bash
   pnpm install
   ```

2. **启动开发服务器**
   ```bash
   pnpm run dev:all
   ```

3. **访问页面**
   ```
   http://localhost:3000/dashboard/profile
   ```

### 🔧 开发规范

#### 代码风格
- 使用 TypeScript 严格模式
- 遵循 ESLint 和 Prettier 配置
- 组件使用 PascalCase 命名
- 文件使用 kebab-case 命名

#### 组件开发
```typescript
// 组件模板
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function ProfileComponent() {
  const t = useTranslations('profile');
  
  return (
    <div className='space-y-4'>
      {/* 组件内容 */}
    </div>
  );
}
```

#### 样式规范
```typescript
// 使用 Tailwind CSS 类名
className='flex items-center space-x-4 rounded-lg border p-4'

// 响应式设计
className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'

// 主题适配
className='bg-background text-foreground'
```

### 🧪 测试

#### 组件测试
```typescript
import { render, screen } from '@testing-library/react';
import ProfileViewPage from './profile-view-page';

describe('ProfileViewPage', () => {
  it('renders user information correctly', () => {
    render(<ProfileViewPage />);
    expect(screen.getByText('个人资料')).toBeInTheDocument();
  });
});
```

## 性能优化

### 🚀 优化策略

1. **代码分割**
   ```typescript
   const ProfileEditForm = lazy(() => import('./profile-edit-form'));
   ```

2. **图片优化**
   ```typescript
   import Image from 'next/image';
   
   <Image
     src={user.image}
     alt={user.name}
     width={96}
     height={96}
     className='rounded-full'
   />
   ```

3. **状态优化**
   ```typescript
   const memoizedStats = useMemo(() => {
     return calculateUserStats(user);
   }, [user]);
   ```

## 安全考虑

### 🔒 安全措施

- **数据验证**: 使用 Zod 进行输入验证
- **权限控制**: 基于用户角色的访问控制
- **敏感信息**: 避免在客户端暴露敏感数据
- **XSS 防护**: 使用 React 的内置 XSS 防护

## 未来规划

### 🎯 功能扩展

- [ ] 实时数据同步
- [ ] 头像上传功能
- [ ] 社交媒体链接
- [ ] 技能标签管理
- [ ] 工作经历时间线
- [ ] 成就徽章系统
- [ ] 数据导出功能
- [ ] 隐私设置管理

### 🔧 技术改进

- [ ] 集成 Clerk 用户管理
- [ ] 添加表单验证
- [ ] 实现数据持久化
- [ ] 添加加载状态
- [ ] 错误边界处理
- [ ] 无障碍访问优化

## 贡献指南

### 📝 提交规范

```bash
# 功能开发
git commit -m "feat(profile): add user avatar upload"

# 问题修复
git commit -m "fix(profile): resolve tab switching issue"

# 样式调整
git commit -m "style(profile): improve mobile responsive layout"
```

### 🔍 代码审查

- 确保代码符合项目规范
- 验证响应式设计效果
- 检查国际化文本完整性
- 测试各种用户场景

---

## 联系信息

如有问题或建议，请通过以下方式联系：

- 项目仓库: [GitHub Repository]
- 问题反馈: [Issues]
- 文档更新: [Documentation]

---

*最后更新: 2024年1月*
