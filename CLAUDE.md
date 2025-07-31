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
```

## 架构

这是一个基于 Next.js 15 的仪表盘应用程序，具有以下关键架构元素：

### 核心技术

- Next.js 15 (App Router)
- TypeScript
- Clerk 身份验证
- Sentry 错误跟踪
- Shadcn UI 组件
- Zustand 状态管理
- Nuqs 搜索参数状态管理
- React Hook Form + Zod 表单处理
- Prisma ORM 数据库交互

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

### 关键功能

- 使用 Clerk 进行身份验证（登录/注册）
- 使用 Recharts 图表的仪表盘
- 使用 Tanstack 表格的产品管理
- 带有拖放功能的看板（dnd-kit）
- 使用 React Hook Form 和 Zod 验证的表单处理
- 使用 kbar 的 Command+k 界面
- 使用 Sentry 的错误跟踪和回放功能
- 基于角色的访问控制系统（RBAC）

### 数据模型

应用程序使用 Prisma ORM 与数据库交互，主要数据模型包括：

- User - 用户信息和认证
- Role - 用户角色定义
- Permission - 权限控制
- Menu - 应用导航结构
- Session - 用户会话管理
- Message - 系统消息
- UserMessage - 用户消息关联

### 环境配置

项目需要以下环境变量（参考 env.example.txt）：

- Clerk 身份验证配置（可选，支持无密钥模式）
- Sentry 错误跟踪配置（可选）
- 数据库连接 URL

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
