# SuperClaude 框架命令使用手册

## 核心开发命令

### `/build [目标] [标志]`

**功能**：项目构建器，自动检测框架

- **用途**：构建项目、UI组件、API服务
- **自动激活**：Frontend、Backend、Architect、Scribe角色
- **示例**：
  - `/build @src/components` - 构建指定目录的组件
  - `/build --framework react` - 使用React框架构建
  - `/build !npm run build` - 执行特定构建命令

### `/implement [功能描述] [标志]`

**功能**：智能功能实现和代码生成

- **用途**：实现新功能、组件、API端点、服务
- **参数**：
  - `--type component|api|service|feature` - 指定实现类型
  - `--framework <名称>` - 指定框架
- **示例**：
  - `/implement 用户认证系统 --type feature`
  - `/implement API接口 --type api --framework express`

## 分析和调试命令

### `/analyze [目标] [标志]`

**功能**：多维度代码和系统分析

- **自动激活**：Analyzer、Architect、Security角色
- **用途**：性能分析、安全审计、架构评估
- **示例**：
  - `/analyze @src/components --focus security`
  - `/analyze --scope project --think-hard`

### `/troubleshoot [症状] [标志]`

**功能**：问题调查和故障排除

- **自动激活**：Analyzer、QA角色
- **示例**：`/troubleshoot 页面加载缓慢 --focus performance`

### `/explain [主题] [标志]`

**功能**：教育性解释和知识传授

- **自动激活**：Mentor、Scribe角色
- **示例**：`/explain React Hooks --详细`

## 质量改进命令

### `/improve [目标] [标志]`

**功能**：基于证据的代码优化

- **自动激活**：Refactorer、Performance、Architect、QA角色
- **支持循环改进**：使用 `--loop` 标志
- **示例**：
  - `/improve @src/utils --focus performance --loop`
  - `/improve --scope project --质量`

### `/cleanup [目标] [标志]`

**功能**：项目清理和技术债务减少

- **自动激活**：Refactorer角色
- **示例**：`/cleanup @src --技术债务`

## 测试和文档命令

### `/test [类型] [标志]`

**功能**：测试工作流程

- **自动激活**：QA角色
- **MCP集成**：Playwright、Sequential
- **示例**：`/test e2e --浏览器 chrome`

### `/document [目标] [标志]`

**功能**：文档生成

- **自动激活**：Scribe、Mentor角色
- **支持多语言**：`--persona-scribe=zh`
- **示例**：`/document API接口 --语言 中文`

## 版本控制和部署

### `/git [操作] [标志]`

**功能**：Git工作流助手

- **自动激活**：DevOps、Scribe、QA角色
- **示例**：`/git commit --消息 "新增用户认证功能"`

## 设计和规划命令

### `/design [领域] [标志]`

**功能**：设计编排

- **自动激活**：Architect、Frontend角色
- **MCP集成**：Magic、Sequential、Context7
- **示例**：`/design 用户界面 --响应式`

### `/estimate [目标] [标志]`

**功能**：基于证据的评估

- **自动激活**：Analyzer、Architect角色
- **示例**：`/estimate 重构项目 --复杂度`

### `/task [操作] [标志]`

**功能**：长期项目管理

- **自动激活**：Architect、Analyzer角色
- **支持波浪模式**：复杂多阶段执行

## 元命令和编排

### `/index [查询] [标志]`

**功能**：命令目录浏览

- **示例**：`/index 性能优化相关命令`

### `/load [路径] [标志]`

**功能**：项目上下文加载

- **自动激活**：Analyzer、Architect、Scribe角色
- **示例**：`/load @项目根目录`

### `/spawn [模式] [标志]`

**功能**：任务编排

- **自动激活**：Analyzer、Architect、DevOps角色
- **示例**：`/spawn 并行分析模式`

## 重要标志参数

### 思考深度标志

- `--think` (4K tokens) - 多文件分析
- `--think-hard` (10K tokens) - 深度架构分析
- `--ultrathink` (32K tokens) - 关键系统重设计分析

### 效率标志

- `--uc` / `--ultracompressed` - 30-50%令牌压缩
- `--answer-only` - 直接回答，无任务创建
- `--validate` - 预操作验证和风险评估
- `--safe-mode` - 最大验证和保守执行

### MCP服务器控制

- `--c7` / `--context7` - 启用Context7文档查找
- `--seq` / `--sequential` - 启用Sequential复杂分析
- `--magic` - 启用Magic UI组件生成
- `--play` / `--playwright` - 启用Playwright测试
- `--all-mcp` - 启用所有MCP服务器
- `--no-mcp` - 禁用所有MCP服务器

### 代理委托标志

- `--delegate [files|folders|auto]` - 启用子代理并行处理
- `--concurrency [n]` - 控制最大并发代理数(1-15)

### 波浪编排标志

- `--wave-mode [auto|force|off]` - 控制波浪编排激活
- `--wave-strategy [progressive|systematic|adaptive|enterprise]` - 选择波浪策略

### 循环改进标志

- `--loop` - 启用迭代改进模式
- `--iterations [n]` - 控制改进循环次数(1-10)
- `--interactive` - 启用用户确认

### 角色激活标志

- `--persona-architect` - 系统架构专家
- `--persona-frontend` - 前端UX专家
- `--persona-backend` - 后端可靠性专家
- `--persona-security` - 安全威胁专家
- `--persona-analyzer` - 根因分析专家
- `--persona-scribe=lang` - 专业文档专家

## 使用示例

```bash
# 构建React组件
/build @src/components/ui --framework react --magic

# 实现用户认证功能
/implement 用户登录和注册系统 --type feature --persona-security

# 分析项目性能问题
/analyze @整个项目 --focus performance --think-hard --seq

# 循环改进代码质量
/improve @src/utils --focus quality --loop --iterations 3

# 生成中文文档
/document API接口文档 --persona-scribe=zh --c7

# 系统性项目清理
/cleanup @项目根目录 --wave-mode auto --systematic

# 全面安全审计
/analyze --focus security --ultrathink --wave-mode force --persona-security

# 智能任务编排
/task 重构整个前端架构 --wave-strategy enterprise --delegate auto
```

## 自动激活机制

SuperClaude会根据以下因素自动激活相应功能：

- **关键词检测** - 根据命令内容自动选择角色和工具
- **复杂度评估** - 自动启用思考模式和波浪编排
- **项目规模** - 大型项目自动启用代理委托
- **质量要求** - 自动启用验证和安全模式

## 框架特性

### 波浪编排引擎

多阶段命令执行，具备复合智能能力。当复杂度≥0.7且文件>20且操作类型>2时自动激活。

**波浪启用命令**：

- **一级**：`/analyze`、`/build`、`/implement`、`/improve`
- **二级**：`/design`、`/task`

### MCP服务器集成

- **Context7**：官方库文档和最佳实践
- **Sequential**：复杂多步骤分析
- **Magic**：现代UI组件生成
- **Playwright**：跨浏览器自动化测试

### 智能角色系统

11个专业角色自动激活，提供领域专精的智能辅助：

- **技术专家**：architect、frontend、backend、security、performance
- **流程质量**：analyzer、qa、refactorer、devops
- **知识交流**：mentor、scribe

这个SuperClaude框架为Claude Code提供了强大的智能编排能力，支持从简单任务到企业级项目的全方位开发需求。

## MCP服务器详细说明

SuperClaude框架依赖以下四个核心MCP服务器，提供不同领域的专业能力：

### Context7 (官方文档服务器)

- **功能**：官方库文档查找、框架最佳实践、代码示例、本地化标准
- **适用场景**：外部库导入、框架相关问题、文档生成
- **主要命令**：`resolve-library-id`、`get-library-docs`
- **自动激活**：检测到外部库导入、框架关键词、Scribe角色激活时

### Sequential (复杂分析服务器)

- **功能**：多步骤问题解决、架构分析、系统化调试、结构化思考
- **适用场景**：复杂调试、系统设计、深度分析、迭代改进
- **主要能力**：问题分解、系统分析、假设生成、证据收集
- **自动激活**：复杂调试场景、系统设计问题、`--think`标志

### Magic (UI组件生成服务器)

- **功能**：现代UI组件生成、设计系统集成、响应式设计
- **适用场景**：UI组件请求、设计系统查询、前端开发
- **支持框架**：React、Vue、Angular、Web Components
- **组件类型**：交互式、布局、显示、反馈、输入、导航、数据组件
- **自动激活**：UI组件请求、设计系统查询、Frontend角色激活

### Playwright (浏览器自动化服务器)

- **功能**：跨浏览器E2E测试、性能监控、自动化测试、视觉测试
- **适用场景**：测试工作流程、性能监控、用户体验验证
- **浏览器支持**：Chrome、Firefox、Safari、Edge
- **测试能力**：视觉回归、性能指标、用户模拟、移动测试
- **自动激活**：测试工作流程、性能监控请求、QA角色激活

## MCP服务器安装命令

在Claude Code中安装SuperClaude所需的MCP服务器，请按顺序执行以下命令：

```bash
# 1. 安装Context7服务器 (官方文档查找)
claude mcp add context7

# 2. 安装Sequential思维服务器 (复杂分析)
claude mcp add sequential-thinking

# 3. 安装Playwright服务器 (浏览器自动化)
claude mcp add playwright npx '@playwright/mcp@latest'

# 验证安装状态
claude mcp list
```

### 其他可用的MCP服务器

```bash
# GitHub集成服务器
claude mcp add github --scope user

# Perplexity搜索服务器
claude mcp add perplexity
```

### 手动配置方法

对于更复杂的配置，可以直接编辑配置文件：

**配置文件位置**：

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**Context7配置示例**：

```json
{
  "mcpServers": {
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": {}
    }
  }
}
```

**Playwright配置示例**：

```json
{
  "mcpServers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

### 服务器配置验证

安装完成后，重启Claude Code并验证服务器功能：

```bash
# 查看已安装的MCP服务器
claude mcp list

# 在项目中使用MCP服务器（首次使用时需要明确指定）
# 例如：请使用playwright mcp打开浏览器访问example.com
# 例如：请使用context7查找React Hook文档
```

**注意事项**：

- 所有MCP服务器都支持并行操作和智能负载均衡
- 服务器会根据任务复杂度自动激活，也可以手动控制
- 使用`--no-mcp`可以禁用所有MCP服务器，提升40-60%执行速度
- 每个服务器都有完整的错误恢复和降级策略

这些MCP服务器共同构成了SuperClaude的智能基础设施，为不同领域提供专业级的AI辅助能力。
