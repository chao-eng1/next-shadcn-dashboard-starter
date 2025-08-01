# 需求管理模块设计文档

## 🎯 概述

需求管理是连接业务需求与技术实现的桥梁，它将帮助团队更好地理解、跟踪和管理项目需求。

### 核心价值
- **需求追溯性**：从业务需求到具体任务的完整追溯链
- **变更管理**：需求变更的版本控制和影响分析
- **优先级管理**：基于业务价值的需求优先级排序
- **进度可视化**：需求实现进度的实时跟踪

## 📊 数据模型设计

### 1. 需求实体 (Requirement)

```prisma
model Requirement {
  id              String              @id @default(cuid())
  title           String              // 需求标题
  description     String?             // 详细描述
  acceptanceCriteria String?          // 验收标准
  businessValue   String?             // 业务价值描述
  userStory       String?             // 用户故事
  priority        RequirementPriority @default(MEDIUM)
  status          RequirementStatus   @default(DRAFT)
  type            RequirementType     @default(FUNCTIONAL)
  complexity      RequirementComplexity @default(MEDIUM)
  estimatedEffort Float?              // 预估工作量(人天)
  actualEffort    Float?              // 实际工作量
  
  // 关联关系
  projectId       String
  project         Project             @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdById     String
  createdBy       User                @relation("CreatedRequirements", fields: [createdById], references: [id])
  assignedToId    String?
  assignedTo      User?               @relation("AssignedRequirements", fields: [assignedToId], references: [id])
  
  // 层级关系
  parentId        String?
  parent          Requirement?        @relation("RequirementHierarchy", fields: [parentId], references: [id])
  children        Requirement[]       @relation("RequirementHierarchy")
  
  // 关联的任务
  tasks           RequirementTask[]
  
  // 版本控制
  versions        RequirementVersion[]
  currentVersion  Int                 @default(1)
  
  // 评论和附件
  comments        RequirementComment[]
  attachments     RequirementAttachment[]
  
  // 标签
  tags            RequirementTag[]
  
  // 时间戳
  dueDate         DateTime?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  @@map("requirements")
  @@index([projectId])
  @@index([createdById])
  @@index([assignedToId])
  @@index([parentId])
}

// 需求优先级
enum RequirementPriority {
  CRITICAL    // 关键
  HIGH        // 高
  MEDIUM      // 中
  LOW         // 低
}

// 需求状态
enum RequirementStatus {
  DRAFT       // 草稿
  REVIEW      // 评审中
  APPROVED    // 已批准
  IN_PROGRESS // 开发中
  TESTING     // 测试中
  COMPLETED   // 已完成
  REJECTED    // 已拒绝
  CANCELLED   // 已取消
}

// 需求类型
enum RequirementType {
  FUNCTIONAL      // 功能性需求
  NON_FUNCTIONAL  // 非功能性需求
  TECHNICAL       // 技术需求
  BUSINESS        // 业务需求
  UI_UX          // 界面/用户体验需求
}

// 需求复杂度
enum RequirementComplexity {
  SIMPLE      // 简单
  MEDIUM      // 中等
  COMPLEX     // 复杂
  VERY_COMPLEX // 非常复杂
}
```

### 2. 需求版本控制

```prisma
model RequirementVersion {
  id              String      @id @default(cuid())
  requirementId   String
  requirement     Requirement @relation(fields: [requirementId], references: [id], onDelete: Cascade)
  versionNumber   Int
  title           String
  description     String?
  acceptanceCriteria String?
  businessValue   String?
  changeReason    String?     // 变更原因
  createdById     String
  createdBy       User        @relation(fields: [createdById], references: [id])
  createdAt       DateTime    @default(now())
  
  @@unique([requirementId, versionNumber])
  @@map("requirement_versions")
}
```

### 3. 需求与任务关联

```prisma
model RequirementTask {
  id              String      @id @default(cuid())
  requirementId   String
  requirement     Requirement @relation(fields: [requirementId], references: [id], onDelete: Cascade)
  taskId          String
  task            Task        @relation(fields: [taskId], references: [id], onDelete: Cascade)
  createdAt       DateTime    @default(now())
  
  @@unique([requirementId, taskId])
  @@map("requirement_tasks")
}
```

### 4. 需求评论

```prisma
model RequirementComment {
  id              String      @id @default(cuid())
  content         String
  requirementId   String
  requirement     Requirement @relation(fields: [requirementId], references: [id], onDelete: Cascade)
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@map("requirement_comments")
  @@index([requirementId])
  @@index([userId])
}
```

### 5. 需求附件

```prisma
model RequirementAttachment {
  id              String      @id @default(cuid())
  filename        String
  filepath        String
  mimetype        String
  size            Int
  requirementId   String
  requirement     Requirement @relation(fields: [requirementId], references: [id], onDelete: Cascade)
  uploaderId      String
  uploader        User        @relation(fields: [uploaderId], references: [id])
  createdAt       DateTime    @default(now())
  
  @@map("requirement_attachments")
  @@index([requirementId])
  @@index([uploaderId])
}
```

### 6. 需求标签

```prisma
model RequirementTag {
  id              String      @id @default(cuid())
  requirementId   String
  requirement     Requirement @relation(fields: [requirementId], references: [id], onDelete: Cascade)
  tagId           String
  tag             Tag         @relation(fields: [tagId], references: [id], onDelete: Cascade)
  createdAt       DateTime    @default(now())
  
  @@unique([requirementId, tagId])
  @@map("requirement_tags")
}
```

## 🎨 前端功能设计

### 1. 需求管理主页面
- **需求列表视图**：支持筛选、排序、搜索
- **需求看板视图**：按状态分列的拖拽式管理
- **需求层级视图**：树形结构展示需求层级关系
- **需求统计仪表盘**：进度、优先级、类型等统计图表

### 2. 需求详情页面
- **基本信息**：标题、描述、优先级、状态等
- **验收标准**：明确的验收条件
- **关联任务**：显示实现该需求的所有任务
- **版本历史**：需求变更记录
- **评论讨论**：团队协作交流
- **附件管理**：相关文档和资料

### 3. 需求创建/编辑表单
- **智能表单**：根据需求类型动态调整字段
- **模板支持**：预定义的需求模板
- **关联建议**：智能推荐相关需求和任务
- **实时预览**：Markdown格式的实时预览

## 🔧 API接口设计

### 需求管理API端点

```typescript
// 需求CRUD操作
GET    /api/projects/[projectId]/requirements        // 获取需求列表
POST   /api/projects/[projectId]/requirements        // 创建需求
GET    /api/projects/[projectId]/requirements/[id]   // 获取需求详情
PATCH  /api/projects/[projectId]/requirements/[id]   // 更新需求
DELETE /api/projects/[projectId]/requirements/[id]   // 删除需求

// 需求版本管理
GET    /api/requirements/[id]/versions               // 获取版本历史
POST   /api/requirements/[id]/versions               // 创建新版本

// 需求与任务关联
GET    /api/requirements/[id]/tasks                  // 获取关联任务
POST   /api/requirements/[id]/tasks                  // 关联任务
DELETE /api/requirements/[id]/tasks/[taskId]       // 取消关联

// 需求统计
GET    /api/projects/[projectId]/requirements/stats // 获取需求统计
```

## 📱 用户界面组件

### 1. 需求卡片组件 (RequirementCard)

```typescript
interface RequirementCardProps {
  requirement: Requirement;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: RequirementStatus) => void;
  showActions?: boolean;
  compact?: boolean;
}
```

### 2. 需求看板组件 (RequirementKanban)

```typescript
interface RequirementKanbanProps {
  projectId: string;
  requirements: Requirement[];
  onRequirementMove: (id: string, newStatus: RequirementStatus) => void;
  onRequirementCreate: (status: RequirementStatus) => void;
}
```

### 3. 需求层级树组件 (RequirementTree)

```typescript
interface RequirementTreeProps {
  requirements: Requirement[];
  onSelect?: (requirement: Requirement) => void;
  onExpand?: (id: string) => void;
  expandedIds?: string[];
}
```

## 🔄 业务流程设计

### 1. 需求生命周期

```
草稿 → 评审中 → 已批准 → 开发中 → 测试中 → 已完成
  ↓       ↓        ↓
已拒绝  已取消   已取消
```

### 2. 需求变更流程

1. **变更申请**：提交变更请求和原因
2. **影响分析**：分析对关联任务的影响
3. **评审批准**：团队评审变更请求
4. **版本更新**：创建新版本记录变更
5. **任务调整**：更新相关任务

### 3. 需求追溯流程

- **向上追溯**：从任务追溯到需求
- **向下追溯**：从需求追溯到具体实现
- **横向追溯**：相关需求之间的依赖关系

## 🎯 与现有功能的集成

### 1. 与项目管理集成
- 需求作为项目的重要组成部分
- 项目概览页面显示需求统计
- 项目权限控制应用到需求管理

### 2. 与任务管理集成
- 任务可以关联一个或多个需求
- 从需求直接创建实现任务
- 任务完成自动更新需求进度

### 3. 与迭代管理集成
- 迭代规划时可以选择需求
- 需求可以分配到不同迭代
- 迭代燃尽图包含需求维度

## 📊 报表和分析

### 1. 需求统计报表
- **需求分布**：按类型、优先级、状态分布
- **完成率分析**：需求完成趋势
- **工作量分析**：预估vs实际工作量对比

### 2. 需求追溯报表
- **需求覆盖率**：任务对需求的覆盖情况
- **需求变更统计**：变更频率和原因分析
- **需求价值分析**：业务价值实现情况

## 🚀 实施计划

### 阶段1：基础功能（2-3周）
1. 数据模型实现和迁移
2. 基础CRUD API
3. 需求列表和详情页面
4. 基本的创建/编辑功能

### 阶段2：高级功能（2-3周）
1. 需求看板视图
2. 版本控制功能
3. 需求与任务关联
4. 评论和协作功能

### 阶段3：分析和优化（1-2周）
1. 统计报表功能
2. 需求追溯功能
3. 性能优化
4. 用户体验改进

## 📁 文件结构

```
src/
  features/
    requirement-management/
      components/
        requirement-card.tsx
        requirement-form.tsx
        requirement-kanban.tsx
        requirement-list.tsx
        requirement-tree.tsx
        requirement-detail.tsx
        requirement-stats.tsx
      hooks/
        use-requirements.ts
        use-requirement-detail.ts
        use-requirement-stats.ts
      types/
        requirement.ts
      utils/
        requirement-helpers.ts
      schemas/
        requirement-schema.ts

  app/
    [locale]/
      dashboard/
        projects/
          [projectId]/
            requirements/
              page.tsx              // 需求列表页面
              new/
                page.tsx            // 创建需求页面
              [requirementId]/
                page.tsx            // 需求详情页面
                edit/
                  page.tsx          // 编辑需求页面

  app/
    api/
      projects/
        [projectId]/
          requirements/
            route.ts              // 需求列表API
            [requirementId]/
              route.ts            // 需求详情API
              tasks/
                route.ts          // 需求任务关联API
              versions/
                route.ts          // 需求版本API
              comments/
                route.ts          // 需求评论API
```

这个需求管理功能将大大增强项目管理能力，帮助团队更好地理解和跟踪业务需求的实现过程。