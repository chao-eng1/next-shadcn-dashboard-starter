# Documents 模块

## 模块概述

文档管理模块，提供文档上传、存储、预览、分享和协作编辑功能。

## 主要功能

- 📄 文档上传与存储
- 👀 多格式文档预览（PDF、Word、Excel、PPT等）
- 📁 文件夹分类管理
- 🔗 文档分享与权限控制
- 📝 在线协作编辑
- 🔍 全文搜索功能
- 📊 文档版本管理
- 💾 自动保存与备份
- 📈 文档访问统计

## 技术栈

- **Next.js**: 服务端渲染
- **Prisma**: 数据库 ORM
- **shadcn/ui**: UI 组件库
- **React**: 前端框架
- **TypeScript**: 类型安全

## 文件结构

```
documents/
├── page.tsx          # 文档列表页面
├── [id]/            # 文档详情页面
├── upload/          # 文档上传页面
└── components/      # 文档相关组件
```

## 开发注意事项

- 文件上传大小限制配置
- 支持的文件格式白名单
- 文档预览安全性检查
- 权限控制和访问日志
- 存储空间管理

## API 端点

- `/api/documents` - 文档 CRUD 操作
- `/api/documents/upload` - 文件上传
- `/api/documents/[id]/share` - 文档分享
- `/api/documents/search` - 文档搜索

## 数据库模型

```prisma
model Document {
  id          String   @id @default(cuid())
  title       String
  content     String?
  fileUrl     String?
  fileType    String
  size        Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  authorId    String
  folderId    String?
}
```
