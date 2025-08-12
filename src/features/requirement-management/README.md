# 需求管理模块 (Requirement Management)

## 模块概述

需求管理模块是一个功能完整的企业级需求管理系统，支持需求的全生命周期管理，包括创建、编辑、分配、跟踪、删除等操作，以及需求之间的关联关系管理。

## 主要功能

- ✅ **需求创建**: 完整的需求创建表单，支持项目关联和成员分配
- 📋 **需求列表**: 分页展示、筛选、搜索功能
- 🗑️ **需求删除**: 安全删除确认，级联删除相关数据
- 🏷️ **需求分类**: 支持类型、优先级、复杂度分类
- 👥 **成员分配**: 基于项目的动态成员分配
- 📊 **状态跟踪**: 需求状态流转管理
- 🔗 **关系管理**: 需求间的依赖关系
- 📈 **进度追踪**: 可视化进度展示
- 💬 **评论系统**: 需求讨论和协作
- 📁 **附件管理**: 文件上传和管理
- 📜 **版本控制**: 需求变更历史
- 🎯 **看板视图**: 拖拽式状态管理

## 技术栈

- **Next.js 15**: App Router + TypeScript
- **Prisma ORM**: 数据库操作
- **React Hook Form**: 表单处理
- **Zod**: 数据验证
- **Zustand**: 状态管理
- **shadcn/ui**: UI 组件库
- **Sonner**: Toast 通知
- **date-fns**: 日期处理
- **next-intl**: 国际化支持

## 文件结构

```
requirement-management/
├── components/
│   ├── delete-confirm-dialog.tsx    # 删除确认对话框
│   ├── requirement-actions.tsx      # 需求操作组件
│   ├── requirement-charts.tsx       # 需求统计图表
│   ├── requirement-comments.tsx     # 需求评论组件
│   ├── requirement-detail.tsx       # 需求详情页面
│   ├── requirement-filter.tsx       # 需求过滤器
│   ├── requirement-form.tsx         # 需求创建/编辑表单 ⭐
│   ├── requirement-history.tsx      # 需求历史记录
│   ├── requirement-kanban.tsx       # 看板视图
│   ├── requirement-list.tsx         # 需求列表 ⭐
│   ├── requirement-progress.tsx     # 进度展示
│   ├── requirement-stats.tsx        # 统计信息
│   └── requirement-tree.tsx         # 需求树状结构
├── hooks/
│   ├── use-global-requirements.ts   # 全局需求数据管理 ⭐
│   ├── use-requirement-detail.ts    # 需求详情数据
│   └── use-requirements.ts          # 项目需求数据
├── schemas/
│   └── requirement-schema.ts        # Zod 验证模式 ⭐
├── types/
│   └── requirement.ts               # TypeScript 类型定义
└── utils/
    ├── requirement-helpers.ts       # 工具函数
    └── requirement-permissions.ts   # 权限检查
```

⭐ 标记的文件是核心实现文件，已完成真实API对接

## 核心数据模型

### 需求实体

```typescript
interface Requirement {
  id: string;
  requirementId: string;           // 自动生成的需求ID (REQ-0001)
  title: string;
  description?: string;
  acceptanceCriteria?: string;     // 验收标准
  businessValue?: string;          // 业务价值
  userStory?: string;              // 用户故事
  priority: RequirementPriority;   // 优先级
  status: RequirementStatus;       // 状态
  type: RequirementType;           // 类型
  complexity: RequirementComplexity; // 复杂度
  estimatedEffort?: number;        // 预估工作量(天)
  actualEffort?: number;           // 实际工作量(天)
  dueDate?: Date;                  // 截止日期
  createdAt: Date;
  updatedAt: Date;
  
  // 关联关系
  project: Project;
  createdBy: User;
  assignedTo?: User;
  parent?: Requirement;            // 父需求
  children?: Requirement[];        // 子需求
  tags?: RequirementTag[];         // 标签
}
```

### 枚举类型

```typescript
enum RequirementPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

enum RequirementStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  APPROVED = 'APPROVED', 
  IN_DEVELOPMENT = 'IN_DEVELOPMENT',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

enum RequirementType {
  FUNCTIONAL = 'FUNCTIONAL',
  NON_FUNCTIONAL = 'NON_FUNCTIONAL',
  BUSINESS = 'BUSINESS',
  TECHNICAL = 'TECHNICAL'
}

enum RequirementComplexity {
  SIMPLE = 'SIMPLE',
  MEDIUM = 'MEDIUM',
  COMPLEX = 'COMPLEX',
  VERY_COMPLEX = 'VERY_COMPLEX'
}
```

## API 端点

### 全局需求管理

- **GET** `/api/requirements` - 获取需求列表 ✅
- **POST** `/api/requirements` - 创建需求 ✅
- **GET** `/api/requirements/[id]` - 获取单个需求 ✅
- **DELETE** `/api/requirements/[id]` - 删除需求 ✅
- **PATCH** `/api/requirements/[id]` - 更新需求 (待实现)

### 项目需求管理

- **GET** `/api/projects/[id]/requirements` - 获取项目需求列表
- **POST** `/api/projects/[id]/requirements` - 在项目中创建需求

### 需求统计和分析

- **GET** `/api/requirements/stats` - 需求统计数据
- **GET** `/api/requirements/relations` - 需求关系数据

## 已实现功能详解

### 1. 需求创建表单 (`requirement-form.tsx`)

**功能特点:**
- ✅ 项目选择 → 成员加载 → 分配人选择的完整流程
- ✅ 实时表单验证 (Zod + React Hook Form)
- ✅ 验收标准动态添加/删除
- ✅ 标签选择和管理
- ✅ 日期选择器 (限制过去日期)
- ✅ 复杂度和工作量估算
- ✅ 完整的错误处理

**关键代码逻辑:**
```typescript
// 项目选择触发成员加载
const handleProjectChange = useCallback((projectId: string) => {
  setSelectedProjectId(projectId);
  form.setValue('assignedToId', ''); // 重置分配人
  fetchProjectMembers(projectId);    // 获取项目成员
}, [form, fetchProjectMembers]);
```

### 2. 需求列表组件 (`requirement-list.tsx`)

**功能特点:**
- ✅ 真实API数据展示
- ✅ 分页功能 (每页20条)
- ✅ 需求卡片展示 (显示完整信息)
- ✅ 删除功能 (带确认对话框)
- ✅ 加载状态和错误处理
- ✅ 响应式布局

**卡片信息展示:**
- 需求ID (REQ-0001) 和标题
- 状态、优先级、类型标签
- 项目名称、分配人信息
- 截止日期、工作量估算
- 进度条显示
- 操作菜单 (删除等)

### 3. 删除确认对话框 (`delete-confirm-dialog.tsx`)

**安全特性:**
- ✅ 二次确认防误删
- ✅ 显示需求详细信息
- ✅ 警告文字提醒
- ✅ 加载状态保护
- ✅ 级联删除相关数据

### 4. 数据验证模式 (`requirement-schema.ts`)

**验证规则:**
- ✅ 字段长度限制
- ✅ CUID格式验证 (支持空值)
- ✅ 日期时间格式验证
- ✅ 枚举值验证
- ✅ 可选字段处理

**关键修复:**
```typescript
// 修复CUID验证问题，允许空值
assignedToId: z.string().optional().refine(
  (val) => !val || z.string().cuid().safeParse(val).success,
  '分配人ID格式不正确'
),
```

### 5. 全局需求Hook (`use-global-requirements.ts`)

**数据管理:**
- ✅ 需求列表获取
- ✅ 过滤和排序支持
- ✅ 分页状态管理
- ✅ 删除功能集成
- ✅ 错误处理和Toast通知

## 数据流程

### 需求创建流程

1. **用户访问** → `/dashboard/requirements/new`
2. **表单初始化** → 加载项目列表
3. **选择项目** → 触发成员API调用
4. **填写信息** → 实时验证
5. **提交表单** → API创建需求
6. **成功反馈** → 跳转到需求列表

### 需求删除流程

1. **点击删除** → 显示确认对话框
2. **用户确认** → 调用删除API
3. **权限检查** → 验证用户权限
4. **级联删除** → 清理相关数据
5. **状态更新** → 从列表移除
6. **用户反馈** → 显示成功消息

## 权限控制

### 创建权限
- 用户必须是项目成员
- 需要 `requirement:create` 权限

### 查看权限
- 需求创建者
- 需求分配人
- 拥有 `requirement:view` 权限的用户

### 删除权限
- 需求创建者
- 拥有 `requirement:delete` 权限的用户

## 数据库关系

### 核心表结构

```sql
-- 需求主表
Requirement {
  id                String      @id @default(cuid())
  requirementId     String      @unique  // REQ-0001
  title            String
  description      String?
  status           String      @default("DRAFT")
  priority         String      @default("MEDIUM")
  type             String      @default("FUNCTIONAL")
  complexity       String      @default("MEDIUM")
  estimatedEffort  Float?
  actualEffort     Float?
  dueDate          DateTime?
  projectId        String
  assignedToId     String?
  parentId         String?
  createdById      String
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  
  // 关联关系
  project          Project     @relation(fields: [projectId], references: [id])
  assignedTo       User?       @relation(fields: [assignedToId], references: [id])
  createdBy        User        @relation(fields: [createdById], references: [id])
  parent           Requirement? @relation(fields: [parentId], references: [id])
  children         Requirement[]
  
  // 相关数据
  tags             RequirementTag[]
  comments         RequirementComment[]
  attachments      RequirementAttachment[]
  versions         RequirementVersion[]
  tasks            RequirementTask[]
}
```

## 国际化支持

支持中英文切换，相关翻译文件：
- `/messages/zh.json` - 中文翻译
- `/messages/en.json` - 英文翻译

关键翻译命名空间：
```json
{
  "requirements": {
    "title": "需求管理",
    "form": {
      "titleLabel": "需求标题",
      "createRequirement": "创建需求"
    },
    "statuses": {
      "draft": "草稿",
      "review": "评审中"
    }
  }
}
```

## 性能优化

### 数据加载优化
- 分页加载，避免一次性加载大量数据
- API响应缓存，减少重复请求
- 骨架屏加载状态，提升用户体验

### 组件优化
- React.memo 包装列表项
- useCallback 优化事件处理函数
- 延迟加载非关键组件

### 数据库优化
- 包含 include 查询优化关联数据
- 索引优化查询性能
- 分页查询避免大数据集

## 待实现功能

### 近期计划
- [ ] 需求编辑功能
- [ ] 需求状态流转
- [ ] 看板视图实现
- [ ] 需求关系管理
- [ ] 批量操作功能

### 长期规划
- [ ] 需求模板系统
- [ ] 自动化工作流
- [ ] 需求分析报表
- [ ] 移动端适配
- [ ] 离线功能支持

## 开发指南

### 添加新功能
1. 在 `types/requirement.ts` 定义数据类型
2. 更新 `schemas/requirement-schema.ts` 验证规则
3. 在 `components/` 创建UI组件
4. 在 `hooks/` 添加数据管理逻辑
5. 创建对应的API端点

### 调试技巧
- 使用浏览器开发者工具查看网络请求
- 查看 Toast 通知获取错误信息
- 检查浏览器控制台的错误日志
- 使用 React DevTools 调试组件状态

### 常见问题

**Q: CUID验证错误？**
A: 确保可选字段使用 `.refine()` 方法允许空值

**Q: 项目成员加载不出来？**
A: 检查API返回数据结构是否匹配期望格式

**Q: 删除功能权限不足？**
A: 确认用户具有相应权限或是需求创建者

## 更新日志

### v1.2.0 (2025-08-12)
- ✅ 实现需求删除功能
- ✅ 添加删除确认对话框
- ✅ 优化列表UI交互
- ✅ 修复CUID验证问题

### v1.1.0 (2025-08-12) 
- ✅ 需求列表对接真实API
- ✅ 实现分页功能
- ✅ 添加全局需求数据管理Hook
- ✅ 优化错误处理和加载状态

### v1.0.0 (2025-08-12)
- ✅ 需求创建表单完整实现
- ✅ 项目-成员分配流程
- ✅ 表单验证和错误处理
- ✅ API端点集成

## 贡献指南

1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/new-feature`)
3. 提交更改 (`git commit -m 'Add new feature'`)
4. 推送分支 (`git push origin feature/new-feature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。