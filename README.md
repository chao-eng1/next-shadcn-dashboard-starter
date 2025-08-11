# 企业级项目管理系统

**[开发须知：项目系统提示词与团队协作规则](.trae/rules/project_rules.md)**

<div align="center">
  <h2>🚀 Next.js 15 企业级实时协作项目管理平台</h2>
  <p>基于 Next.js 15 App Router 构建的现代化企业级项目管理系统</p>
  <p>支持实时协作、多语言、权限管理的一站式解决方案</p>
</div>

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS v4" />
</div>

---

## 📋 项目简介

本项目是一个功能完整的企业级项目管理系统，集成了15个核心业务模块，支持实时协作、多语言切换、权限管理等企业级功能。系统采用现代化的技术栈，提供优秀的用户体验和开发体验。

### 🎯 核心特性

- ✅ **15个核心业务模块** - 覆盖项目管理全流程
- ✅ **实时协作** - WebSocket 支持的即时通讯和状态同步
- ✅ **多语言支持** - 中英文国际化
- ✅ **权限管理** - 基于角色的访问控制 (RBAC)
- ✅ **响应式设计** - 完美适配桌面端和移动端
- ✅ **主题切换** - 支持亮色/暗色主题
- ✅ **性能优化** - 代码分割、懒加载、缓存策略
- ✅ **错误监控** - Sentry 集成的错误追踪和性能监控

## 🛠️ 技术栈

### 核心框架
- **前端框架**: [Next.js 15](https://nextjs.org) - 基于 App Router 的全栈 React 框架
- **UI 框架**: [React 19](https://react.dev) - 最新的 React 版本，支持并发特性
- **开发语言**: [TypeScript](https://www.typescriptlang.org) - 类型安全的 JavaScript 超集

### 样式与组件
- **样式系统**: [Tailwind CSS v4](https://tailwindcss.com) - 原子化 CSS 框架
- **组件库**: [shadcn/ui](https://ui.shadcn.com) - 基于 Radix UI 的现代组件库
- **图标库**: [Lucide React](https://lucide.dev) - 美观的 SVG 图标集
- **动画**: [Framer Motion](https://www.framer.com/motion/) - 强大的动画库

### 状态管理与数据
- **状态管理**: [Zustand](https://zustand-demo.pmnd.rs) - 轻量级状态管理库
- **数据库**: [Prisma ORM](https://prisma.io) + SQLite/PostgreSQL
- **表单处理**: [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) 验证
- **数据表格**: [Tanstack Table](https://tanstack.com/table) - 强大的表格组件

### 实时通信与认证
- **实时通信**: [Socket.io](https://socket.io) - WebSocket 实时通信
- **用户认证**: [Clerk](https://clerk.com) - 现代化用户管理和认证
- **权限管理**: 基于角色的访问控制 (RBAC)

### 国际化与监控
- **国际化**: [next-intl](https://next-intl-docs.vercel.app) - Next.js 国际化解决方案
- **错误监控**: [Sentry](https://sentry.io) - 错误追踪和性能监控
- **代码质量**: [ESLint](https://eslint.org) + [Prettier](https://prettier.io) + [Husky](https://typicode.github.io/husky/)

### 开发工具
- **包管理**: [pnpm](https://pnpm.io) - 快速、节省磁盘空间的包管理器
- **命令面板**: [kbar](https://kbar.vercel.app) - 快捷命令界面
- **拖拽交互**: [React DnD](https://react-dnd.github.io/react-dnd/) - 拖拽功能实现

## 📱 核心业务模块

本系统包含15个核心业务模块，覆盖企业项目管理的全流程：

### 🏠 核心功能模块

| 模块 | 功能描述 | 技术特性 |
|------|----------|----------|
| **Overview** | 数据概览仪表盘 | Recharts 图表、实时数据更新、并行路由 |
| **Projects** | 项目管理系统 | 项目创建、进度跟踪、团队协作、甘特图 |
| **Tasks** | 任务管理系统 | 任务分配、状态跟踪、优先级管理、时间线 |
| **Kanban** | 看板任务管理 | 拖拽操作、状态流转、实时同步、本地持久化 |
| **Requirements** | 需求管理工程 | 需求收集、分析、跟踪、变更管理 |

### 💬 通讯协作模块

| 模块 | 功能描述 | 技术特性 |
|------|----------|----------|
| **Chat** | 实时聊天系统 | WebSocket 通信、消息历史、文件分享 |
| **IM** | 即时通讯模块 | 在线状态、群组聊天、消息推送 |
| **Modern IM** | 现代化即时通讯 | 富文本编辑、表情包、语音消息 |
| **Messages** | 系统消息中心 | 通知管理、消息分类、已读状态 |

### 📄 文档与产品模块

| 模块 | 功能描述 | 技术特性 |
|------|----------|----------|
| **Documents** | 文档管理系统 | 在线编辑、版本控制、协作编辑、权限管理 |
| **Product** | 产品信息管理 | 产品目录、规格管理、库存跟踪 |

### ⚙️ 系统管理模块

| 模块 | 功能描述 | 技术特性 |
|------|----------|----------|
| **System Management** | 系统管理 | 用户管理、角色权限、系统配置、日志监控 |
| **Profile** | 用户个人资料 | Clerk 集成、个人设置、安全管理 |

### 🧪 开发与测试模块

| 模块 | 功能描述 | 技术特性 |
|------|----------|----------|
| **System Messages Demo** | 消息组件演示 | 组件展示、交互演示、开发调试 |
| **Test Notifications** | 通知测试工具 | 推送测试、通知调试、性能监控 |

## 📁 项目架构

### 目录结构

```plaintext
📦 next-shadcn-dashboard-starter/
├── 📁 src/
│   ├── 📁 app/                    # Next.js App Router
│   │   ├── 📁 [locale]/           # 国际化路由
│   │   │   └── 📁 dashboard/       # 15个核心业务模块
│   │   │       ├── 📄 chat/
│   │   │       ├── 📄 documents/
│   │   │       ├── 📄 im/
│   │   │       ├── 📄 kanban/
│   │   │       ├── 📄 messages/
│   │   │       ├── 📄 modern-im/
│   │   │       ├── 📄 overview/
│   │   │       ├── 📄 product/
│   │   │       ├── 📄 profile/
│   │   │       ├── 📄 projects/
│   │   │       ├── 📄 requirements/
│   │   │       ├── 📄 system-management/
│   │   │       ├── 📄 system-messages-demo/
│   │   │       ├── 📄 tasks/
│   │   │       └── 📄 test-notifications/
│   │   └── 📁 api/                # API 路由
│   ├── 📁 components/             # 共享组件
│   │   ├── 📁 ui/                 # shadcn/ui 组件
│   │   ├── 📁 layout/             # 布局组件
│   │   ├── 📁 chat/               # 聊天组件
│   │   ├── 📁 im/                 # 即时通讯组件
│   │   └── 📁 messages/           # 消息组件
│   ├── 📁 features/               # 功能模块
│   │   ├── 📁 auth/               # 认证模块
│   │   ├── 📁 kanban/             # 看板模块
│   │   ├── 📁 overview/           # 概览模块
│   │   ├── 📁 products/           # 产品模块
│   │   ├── 📁 profile/            # 个人资料模块
│   │   ├── 📁 system-management/  # 系统管理模块
│   │   ├── 📁 task-management/    # 任务管理模块
│   │   └── 📁 user-messages/      # 用户消息模块
│   ├── 📁 hooks/                  # 自定义 Hooks
│   │   ├── 📄 use-auth.ts
│   │   ├── 📄 use-message-cache.ts
│   │   └── 📄 useWebSocket.ts
│   ├── 📁 lib/                    # 工具库
│   │   ├── 📁 api/                # API 工具
│   │   ├── 📄 auth.ts             # 认证配置
│   │   ├── 📄 prisma.ts           # 数据库配置
│   │   ├── 📄 websocket-service.ts # WebSocket 服务
│   │   └── 📄 utils.ts            # 通用工具
│   ├── 📁 store/                  # Zustand 状态管理
│   │   ├── 📄 chat-store.ts       # 聊天状态
│   │   └── 📄 message-store.ts    # 消息状态
│   └── 📁 types/                  # TypeScript 类型
├── 📁 prisma/                     # 数据库
│   ├── 📄 schema.prisma           # 数据模型
│   └── 📁 migrations/             # 数据库迁移
├── 📁 public/                     # 静态资源
├── 📁 messages/                   # 国际化文件
│   ├── 📄 en.json                # 英文
│   └── 📄 zh.json                # 中文
├── 📁 .trae/                      # 项目文档
│   ├── 📁 documents/              # 技术文档
│   └── 📁 rules/                  # 开发规则
├── 📄 server.js                   # WebSocket 服务器
└── 📄 package.json                # 项目配置
```

### 架构特点

- **🏗️ 模块化设计**: 基于功能的目录结构，便于维护和扩展
- **🌐 国际化支持**: 完整的中英文国际化方案
- **⚡ 实时通信**: WebSocket 服务独立部署，支持高并发
- **🔐 权限管理**: 基于 Clerk 的用户认证和 RBAC 权限控制
- **📊 状态管理**: Zustand 轻量级状态管理，按模块拆分
- **🎨 组件复用**: shadcn/ui 组件库，统一设计语言

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0 (推荐使用 pnpm 作为包管理器)
- **数据库**: SQLite (开发) / PostgreSQL (生产)

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <your-repo-url>
   cd next-shadcn-dashboard-starter
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **环境配置**
   ```bash
   # 复制环境变量模板
   cp env.example.txt .env.local
   
   # 编辑环境变量文件，配置以下必要信息：
   # - Clerk 认证密钥
   # - Sentry 监控配置
   # - WebSocket 服务 URL
   # - 数据库连接字符串
   ```

4. **数据库初始化**
   ```bash
   # 生成 Prisma 客户端
   pnpm prisma generate
   
   # 运行数据库迁移
   pnpm prisma migrate dev
   
   # 填充种子数据（可选）
   pnpm prisma db seed
   ```

5. **启动开发服务**
   ```bash
   # 启动完整开发环境（Next.js + WebSocket）
   pnpm run dev:all
   
   # 或者分别启动
   pnpm run dev        # Next.js 应用 (端口 3000)
   pnpm run dev:ws     # WebSocket 服务 (端口 3001)
   ```

### 访问应用

- **主应用**: http://localhost:3000
- **WebSocket 服务**: ws://localhost:3001
- **数据库管理**: `pnpm prisma studio` (http://localhost:5555)

### 开发命令

```bash
# 开发相关
pnpm run dev:all      # 启动完整开发环境
pnpm run build        # 构建生产版本
pnpm run start        # 启动生产服务

# 代码质量
pnpm run lint         # ESLint 检查
pnpm run lint:fix     # 自动修复 lint 问题
pnpm run format       # Prettier 格式化

# 数据库相关
pnpm prisma studio    # 数据库可视化管理
pnpm prisma migrate   # 数据库迁移
pnpm prisma generate  # 生成 Prisma 客户端

# 类型检查
pnpm run type-check   # TypeScript 类型检查
```

### 环境变量配置

参考 `env.example.txt` 文件配置以下环境变量：

```env
# Clerk 认证
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret

# Sentry 监控
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_public_sentry_dsn

# WebSocket 配置
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001

# 数据库
DATABASE_URL="file:./dev.db"
```

> [!IMPORTANT]
 > 确保 3000 和 3001 端口未被占用。如需重启服务，请先杀死相关进程：
 > ```bash
 > lsof -ti:3000 | xargs kill -9
 > lsof -ti:3001 | xargs kill -9
 > ```

## 🔧 开发指南

### WebSocket 实时通信

本项目集成了完整的 WebSocket 实时通信系统：

- **客户端服务**: `src/lib/websocket-service.ts` - 处理连接管理和消息同步
- **服务端**: `server.js` - Socket.io 服务器，支持 JWT 认证
- **状态管理**: Zustand store 与 WebSocket 事件同步
- **常用事件**: `message`, `conversation`, `userStatus`, `typing`, `notification`

### 国际化开发

```typescript
// 在组件中使用国际化
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('dashboard');
  return <h1>{t('title')}</h1>;
}
```

### 状态管理

```typescript
// 使用 Zustand store
import { useMessageStore } from '@/store/message-store';

function ChatComponent() {
  const { messages, addMessage } = useMessageStore();
  // 组件逻辑
}
```

### 权限控制

```typescript
// 基于角色的权限检查
import { checkPermission } from '@/lib/permissions';

function AdminPanel() {
  const hasAccess = checkPermission('admin', 'system:manage');
  if (!hasAccess) return <AccessDenied />;
  // 管理面板内容
}
```

## 📚 技术文档

详细的技术文档位于 `.trae/documents/` 目录：

- [AI对话前端技术文档](.trae/documents/AI对话前端技术文档.md)
- [AI对话后端技术文档](.trae/documents/AI对话后端技术文档.md)
- [消息中心模块产品需求文档](.trae/documents/消息中心模块产品需求文档.md)
- [项目开发规则](.trae/rules/project_rules.md)

## 🤝 贡献指南

我们欢迎所有形式的贡献！请遵循以下步骤：

1. **Fork 项目**
2. **创建功能分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **创建 Pull Request**

### 代码规范

- 遵循 ESLint 和 Prettier 配置
- 使用 TypeScript 严格模式
- 编写有意义的提交信息
- 添加必要的测试和文档

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

本项目基于 [next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) 进行开发，感谢原作者 [@Kiranism](https://github.com/Kiranism) 提供的优秀基础模板。

### 原项目信息

- **原项目**: Next.js Admin Dashboard Starter Template With Shadcn-ui
- **作者**: Kiranism
- **许可证**: MIT License
- **GitHub**: https://github.com/Kiranism/next-shadcn-dashboard-starter

我们在原项目基础上进行了以下主要改进：

- ✨ 扩展为15个核心业务模块的企业级项目管理系统
- 🔄 集成 WebSocket 实时通信功能
- 🌍 添加完整的中英文国际化支持
- 🔐 实现基于角色的权限管理系统
- 📊 优化状态管理和数据流
- 📱 增强移动端响应式体验

## 📞 联系我们

如果您有任何问题或建议，请通过以下方式联系我们：

- **Issues**: [GitHub Issues](https://github.com/your-username/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/your-repo/discussions)
- **Email**: your-email@example.com

---

<div align="center">
  <p>⭐ 如果这个项目对您有帮助，请给我们一个 Star！</p>
  <p>🚀 让我们一起构建更好的企业级项目管理系统！</p>
</div>
