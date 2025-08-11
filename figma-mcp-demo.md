# Framelink Figma MCP 工具演示

## 工具概述

Framelink Figma MCP 是一个强大的工具，可以：

1. **获取 Figma 文件数据** - 提取设计文件的布局、内容、视觉元素和组件信息
2. **下载设计资源** - 批量下载 SVG 和 PNG 图像资源
3. **桥接设计与开发** - 将设计稿转换为可用的开发资源

## 主要功能

### 1. get_figma_data

- 获取 Figma 文件的完整数据
- 支持指定节点 ID 获取特定组件
- 可控制遍历深度

### 2. download_figma_images

- 批量下载图像资源
- 支持 SVG 和 PNG 格式
- 自动处理图像裁剪和尺寸

## 使用示例

### 获取设计文件数据

```javascript
// 示例：获取项目管理系统的设计文件
const figmaData = await getFigmaData({
  fileKey: 'your-figma-file-key',
  nodeId: 'specific-component-id', // 可选
  depth: 2 // 可选，控制遍历深度
});
```

### 下载设计资源

```javascript
// 示例：下载图标和图片资源
const downloadResult = await downloadFigmaImages({
  fileKey: 'your-figma-file-key',
  nodes: [
    {
      nodeId: '1234:5678',
      fileName: 'dashboard-icon.svg',
      needsCropping: false
    },
    {
      nodeId: '2345:6789',
      fileName: 'user-avatar.png',
      needsCropping: true,
      cropTransform: [
        [1, 0, 0],
        [0, 1, 0]
      ]
    }
  ],
  localPath:
    '/Users/chao/Documents/llmProject/next-shadcn-dashboard-starter/public/assets',
  pngScale: 2
});
```

## 实际应用场景

### 1. 组件库同步

- 从 Figma 设计系统中提取组件规范
- 自动生成对应的 React 组件代码
- 保持设计与代码的一致性

### 2. 资源管理

- 批量导出设计中的图标、插图
- 自动优化图像尺寸和格式
- 集成到构建流程中

### 3. 设计审查

- 提取设计文件的结构信息
- 生成设计规范文档
- 验证设计一致性

## 集成到项目中

### 1. 创建设计资源同步脚本

```bash
# 创建脚本目录
mkdir scripts/figma-sync

# 添加同步脚本
touch scripts/figma-sync/sync-assets.js
touch scripts/figma-sync/sync-components.js
```

### 2. 配置环境变量

```bash
# .env.local
FIGMA_ACCESS_TOKEN=your_figma_token
FIGMA_FILE_KEY=your_file_key
```

### 3. 自动化工作流

- 设置 GitHub Actions 定期同步
- 在设计更新时自动触发构建
- 生成变更报告

## 最佳实践

1. **文件组织**

   - 在 Figma 中使用清晰的命名规范
   - 组织好图层和组件结构
   - 使用组件库和设计系统

2. **版本控制**

   - 跟踪设计文件版本
   - 记录重要变更
   - 与代码版本保持同步

3. **性能优化**
   - 合理设置图像尺寸和格式
   - 使用 SVG 优先策略
   - 实施缓存机制

## 演示项目集成

在我们的项目管理系统中，可以使用 Framelink Figma MCP 来：

1. **同步 UI 组件**

   - 从设计稿中提取按钮、表单等组件样式
   - 生成对应的 Tailwind CSS 类
   - 更新 shadcn/ui 组件库

2. **管理图标资源**

   - 批量导出项目中使用的图标
   - 生成图标组件库
   - 保持图标的一致性

3. **主题同步**
   - 提取设计系统中的颜色、字体等
   - 更新 CSS 变量和主题配置
   - 确保视觉一致性

## 总结

Framelink Figma MCP 工具为设计师和开发者之间搭建了一座桥梁，让设计到开发的流程更加顺畅和自动化。通过合理使用这个工具，可以显著提高团队的协作效率和产品质量。
