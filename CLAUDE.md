# CLAUDE.md

本文件为 Claude Code（claude.ai/code）在处理此代码仓库时提供指导。

## 命令

```bash
# 开发
# pnpm dev             # 不要运行dev 服务 会在localhost:3000端口存在此服务
pnpm build           # 构建生产版本
pnpm start           # 启动生产服务器

# 代码质量
pnpm lint           # 运行 ESLint
pnpm lint:fix       # 修复 linting 问题并格式化代码
pnpm lint:strict    # 运行 ESLint（不允许任何警告）
pnpm format         # 使用 Prettier 格式化代码
pnpm format:check   # 检查代码格式
pnpm db:seed        # 填充数据库测试数据

# 数据库管理
pnpm update:schema  # 更新数据库模式
pnpm db:migrate     # 运行数据库迁移

# 项目管理相关命令
pnpm init:project-management  # 初始化项目管理功能
pnpm sync:menus     # 同步菜单数据
pnpm fix:menus      # 修复菜单问题
pnpm debug:admin-permissions  # 调试管理员权限
```

## 架构概览

这是一个全栈企业级仪表盘应用程序，基于 Next.js 15 App Router 构建，包含完整的项目管理、用户管理、消息系统和文档管理功能。

### 核心技术栈

**前端框架:**
- Next.js 15 (App Router) - 现代化 React 框架
- TypeScript - 类型安全
- Tailwind CSS 4.0 - 样式框架
- Shadcn/ui + Radix UI - 组件库
- Motion (Framer Motion) - 动画库

**状态管理:**
- Zustand - 轻量级状态管理
- Nuqs - URL 搜索参数状态管理
- React Hook Form + Zod - 表单处理和验证

**数据层:**
- Prisma ORM - 数据库操作
- SQLite - 开发数据库（可配置其他数据库）
- bcryptjs - 密码哈希
- Jose/JWT - 身份验证令牌

**UI/UX 增强:**
- next-intl - 国际化支持（中英文）
- next-themes - 主题切换
- cmdk (kbar) - Command+K 快捷键界面
- react-dropzone - 文件上传
- recharts - 图表组件
- @tanstack/react-table - 高级表格

**开发工具:**
- ESLint + Prettier - 代码质量
- Husky + lint-staged - Git hooks
- Sentry - 错误监控（可选）

### 目录结构

代码库遵循基于特性的组织方式：

- `/app` - Next.js App Router 路由和 API 端点
- `/components` - 共享 UI 和布局组件
- `/features` - 功能模块，包含组件、操作、模式和工具
- `/lib` - 核心工具和配置
- `/hooks` - 自定义 React hooks
- `/stores` - Zustand 状态存储
- `/types` - TypeScript 类型定义
- `/prisma` - 数据库模式和种子脚本

### 核心功能模块

**用户管理和认证:**
- JWT 基础的身份验证系统（不依赖 Clerk）
- 基于角色的访问控制（RBAC）
- 用户在线状态管理
- 多语言界面（中文/英文）

**项目管理:**
- 项目创建、编辑、删除
- 团队成员管理和邀请系统
- 项目可见性控制（私有/团队/公开）
- 项目文档管理

**任务管理:**
- 任务创建、分配、状态跟踪
- 看板视图（拖拽排序）
- 任务历史记录和评论
- 文件附件管理

**需求管理:**
- 需求层级管理（父子关系）
- 需求状态跟踪（草稿→评审→开发→完成）
- 需求关联任务
- 版本控制和评论

**消息系统:**
- 系统通知
- 项目群聊
- 私聊功能
- 实时消息推送
- 消息已读状态

**文档管理:**
- 文档创建、编辑（Markdown 支持）
- 文档版本控制
- 文档模板系统
- 文档文件夹组织

**系统管理:**
- 用户角色权限管理
- 菜单权限控制
- 系统配置管理
- 数据种子和修复工具

### 数据模型架构

应用程序使用 Prisma ORM 管理复杂的关系型数据库结构：

**用户和权限模型:**
- `User` - 用户基础信息、认证和关联关系
- `Role` - 角色定义
- `Permission` - 权限定义
- `UserRole`, `RolePermission`, `MenuPermission` - 多对多关联表
- `Session` - 用户会话管理

**项目管理模型:**
- `Project` - 项目主体信息
- `ProjectMember` - 项目成员和角色
- `ProjectInvitation` - 项目邀请管理
- `Task` - 任务信息（支持父子任务）
- `Sprint` - 迭代周期管理
- `TaskAssignment` - 任务分配关系
- `TaskHistory` - 任务变更历史

**消息系统模型:**
- `Message`, `UserMessage` - 系统消息
- `ProjectChat`, `ProjectMessage` - 项目群聊
- `PrivateConversation`, `PrivateMessage` - 私聊
- `MessageRead`, `MessageNotification` - 消息状态管理
- `UserOnlineStatus`, `ProjectMemberOnline` - 在线状态

**文档管理模型:**
- `Document` - 文档内容和元数据
- `DocumentFolder` - 文档文件夹
- `DocumentVersion` - 版本控制
- `DocumentTemplate` - 文档模板
- `DocumentAttachment`, `DocumentComment` - 附件和评论

**需求管理模型:**
- `Requirement` - 需求主体（支持层级结构）
- `RequirementVersion` - 需求版本控制
- `RequirementTask` - 需求任务关联
- `RequirementComment`, `RequirementAttachment` - 评论和附件
- `RequirementTag` - 需求标签系统

### 环境配置

项目需要以下环境变量（参考 env.example.txt）：

**必需配置:**
- `DATABASE_URL` - 数据库连接字符串
- `JWT_SECRET` - JWT 令牌签名密钥

**可选配置:**
- Sentry 错误跟踪配置（生产环境推荐）
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `NEXT_PUBLIC_SENTRY_ORG`
  - `NEXT_PUBLIC_SENTRY_PROJECT`
  - `SENTRY_AUTH_TOKEN`
- `NEXT_PUBLIC_SENTRY_DISABLED` - 开发环境可设为 true

**注意:** 此项目不使用 Clerk 认证，而是基于 JWT 的自定义认证系统。

## 权限系统

### 管理员权限

管理员角色（admin）应当拥有系统中所有权限，包括但不限于：

- 用户管理相关权限（`user:list`, `user:create`, `user:update`, `user:delete`等）
- 角色管理相关权限（`role:list`, `role:create`, `role:update`, `role:delete`等）
- 权限管理相关权限（`permission:list`, `permission:create`, `permission:update`, `permission:delete`等）
- 消息管理相关权限（`message.manage`, `message.send`, `message.read`等）

### 权限修复工具

如遇到权限相关问题，可使用系统提供的权限修复工具：

- 访问路径：`/system-management/permissions/fix-permissions`
- 此工具将自动为管理员账号创建并分配所有必要的系统权限

### 权限命名约定

系统中使用两种权限命名格式，确保兼容性：

- 冒号格式：`resource:action`（如`user:list`）
- 点格式：`resource.action`（如`message.manage`）

## Next.js 15 注意事项

### 异步动态路由参数

在 Next.js 15 中，动态路由参数现在是异步的，需要使用 `await` 来访问。

例如，在 API 路由中：

```typescript
// 错误用法 - 会导致错误
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const messageId = params.id; // 错误: 'params' 应该在使用前被 await
  // ...
}

// 正确用法
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const messageId = (await params).id; // 正确: 使用 await 等待 params
  // ...
}
```

这个更改影响所有使用动态路由参数的路由处理函数，包括 GET、POST、PUT、PATCH、DELETE 等。

### cookies API

在 Next.js 15 中，`cookies()` 函数返回一个 Promise，需要使用 `await` 来获取 cookie 存储。

```typescript
// 错误用法
const cookieStore = cookies();
const token = cookieStore.get('token');

// 正确用法
const cookieStore = await cookies();
const token = cookieStore.get('token');
```

## 认证系统

### Token 命名与设置

本系统使用JWT令牌进行认证，保存在HTTP-only cookie中：

- **Cookie 名称**: `token`（不是 `auth-token`）
- **过期时间**: 7天
- **Cookie 设置**: HTTP-only, Secure (生产环境), SameSite

> **重要提示**: 系统中有些地方使用了 `auth-token` 作为cookie名，这已被统一为 `token`。如果遇到认证问题，请检查代码中是否正确使用了 `token` 作为cookie名。特别是 `/api/auth/me` 端点需要使用正确的cookie名来识别用户。

### 登录流程

1. 用户通过 `/api/auth/login` 提交凭据
2. 验证成功后设置 JWT token cookie
3. 用户会被重定向到 `/dashboard`

### 权限验证

1. 系统通过 `getCurrentUser()` 函数读取 `token` cookie
2. 验证 JWT 令牌并提取用户ID（`sub` 字段）
3. 通过 `hasPermission()` 函数检查用户是否拥有所需权限

### 调试工具

如遇到认证问题，可使用以下命令修复：

```bash
# 调试admin用户权限
pnpm debug:admin-permissions
```

### 注意事项

- 确保 `JWT_SECRET` 环境变量已正确设置
- 如用户无法访问页面，可能是cookie不正确或权限不足
- 可使用 `/api/auth/logout` 清除token
- 旧版本使用 `auth-token` 名称，现已统一为 `token`

## API 架构

### API 路由结构

应用程序遵循 Next.js App Router 的 API 路由约定，所有 API 端点位于 `/src/app/api/` 目录下：

**认证相关:**
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册  
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

**项目管理:**
- `/api/projects/[projectId]/*` - 项目 CRUD 操作
- `/api/projects/[projectId]/members/*` - 项目成员管理
- `/api/projects/[projectId]/tasks/*` - 任务管理
- `/api/projects/[projectId]/sprints/*` - 迭代管理

**消息系统:**
- `/api/messages/*` - 系统消息
- `/api/user-messages/*` - 用户消息
- `/api/conversations/*` - 会话管理

**系统管理:**
- `/api/system-management/users/*` - 用户管理
- `/api/system-management/roles/*` - 角色管理
- `/api/system-management/permissions/*` - 权限管理

### 中间件和权限控制

1. **认证中间件** (`middleware.ts`):
   - 自动检查受保护路由的JWT令牌
   - 处理国际化路由重定向
   - 支持API路由和页面路由的权限验证

2. **权限验证函数** (`lib/permissions.ts`):
   - `hasPermission(userId, permission)` - 检查全局权限
   - `hasProjectPermission(projectId, permission, userId)` - 检查项目权限
   - `isSystemAdmin(userId)` - 检查管理员权限

### API 响应格式

标准的API响应格式：

```typescript
// 成功响应
{
  data: T,
  message?: string
}

// 错误响应  
{
  error: string,
  details?: any
}
```

## 前端架构

### 组件组织

**基于功能的模块化结构:**

- `/src/components/ui/` - 基础UI组件（Shadcn/ui）
- `/src/components/layout/` - 布局相关组件
- `/src/features/` - 功能模块（每个模块包含组件、hooks、schemas等）
- `/src/hooks/` - 共享的React hooks
- `/src/lib/` - 工具函数和配置

**特性模块结构示例:**
```
/src/features/project-management/
├── components/          # 组件
├── hooks/              # 钩子
├── schemas/            # Zod验证模式
├── types/              # TypeScript类型
└── utils/              # 工具函数
```

### 状态管理策略

1. **服务器状态**: 通过 API 调用直接管理，无需客户端缓存
2. **表单状态**: React Hook Form + Zod 验证
3. **URL状态**: Nuqs 管理搜索参数和分页
4. **全局状态**: Zustand（仅用于跨组件状态，如用户认证）

### 国际化

- 使用 `next-intl` 提供中英文支持
- 消息文件位于 `/messages/` 目录
- 支持动态语言切换
- 所有用户界面文本都应通过 `useTranslations()` hook 提供

## 开发指南

### 文件路由规范

**页面组件:**
- 所有页面组件都必须是异步函数
- 动态路由参数需要使用 `await params` 获取
- 布局组件位于对应的 `layout.tsx` 文件中

**API 路由:**
- 使用命名导出（GET, POST, PUT, DELETE等）
- 参数获取：`const { id } = await params`
- Cookie 操作：`const cookieStore = await cookies()`

### 数据库操作

**Prisma 使用规范:**
1. 所有数据库操作都通过 Prisma Client 执行
2. 使用 `/src/lib/prisma.ts` 中的单例实例
3. 复杂查询应包含适当的 `include` 和 `select` 子句
4. 数据变更操作需要考虑关联数据的完整性

**迁移管理:**
```bash
npx prisma migrate dev  # 开发环境迁移
npx prisma db push     # 同步schema到数据库
npx prisma generate    # 生成客户端代码
```

### 权限集成

在组件中使用权限控制：

```typescript
import { PermissionGate } from '@/components/permission-gate';

// 权限门禁组件
<PermissionGate permission="user:create">
  <CreateButton />
</PermissionGate>

// 项目权限检查
import { ProjectPermissionGate } from '@/components/project-permission-gate';

<ProjectPermissionGate projectId={projectId} permission="task.create">
  <CreateTaskButton />
</ProjectPermissionGate>
```

### 错误处理

1. **API路由错误处理**: 统一返回错误格式，包含适当的HTTP状态码
2. **前端错误边界**: 使用 React Error Boundaries 捕获组件错误
3. **表单验证**: Zod schema 验证，显示友好的错误消息
4. **Sentry集成**: 生产环境自动错误上报和性能监控

### 开发最佳实践

1. **代码组织**: 遵循功能模块化原则，每个功能独立组织
2. **类型安全**: 充分利用TypeScript，避免any类型
3. **性能优化**: 使用React.memo、useMemo、useCallback优化渲染
4. **可访问性**: 遵循WCAG标准，使用语义化HTML
5. **测试**: 为关键业务逻辑编写单元测试
6. **文档**: 复杂组件和函数应包含JSDoc注释

# important-instruction-reminders

在处理此代码库时请注意：

1. **认证系统**: 使用JWT而非Clerk，cookie名称为`token`
2. **Next.js 15**: 动态参数和cookies都是异步的，需要await
3. **权限检查**: 所有受保护的功能都应进行权限验证
4. **数据库**: 使用Prisma ORM，注意关联关系的处理
5. **国际化**: 所有用户可见文本都应支持多语言
6. **类型安全**: 充分利用TypeScript和Zod进行类型验证
7. **组件复用**: 优先使用Shadcn/ui组件，保持设计一致性
