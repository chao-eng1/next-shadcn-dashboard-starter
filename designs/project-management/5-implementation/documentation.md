# 项目管理模块 - 文档功能实现指南

本文档提供项目管理模块中文档功能的详细实现指南，包括设计、开发和集成策略。

## 目录

1. [功能概述](#功能概述)
2. [数据模型](#数据模型)
3. [API设计](#api设计)
4. [前端实现](#前端实现)
5. [权限控制](#权限控制)
6. [集成策略](#集成策略)
7. [测试策略](#测试策略)

## 功能概述

文档功能允许用户为项目和任务创建、管理和共享文档，支持以下核心能力：

1. **项目文档管理**

   - 创建和组织项目文档
   - 建立文档目录结构
   - 支持多种文档格式

2. **知识库与Wiki**

   - 创建项目知识库
   - 维护常见问题和解决方案
   - 构建项目术语表

3. **模板管理**

   - 预定义文档模板
   - 标准化文档格式
   - 快速创建常用文档

4. **版本控制**

   - 追踪文档修改历史
   - 比较文档版本差异
   - 恢复之前的版本

5. **协作编辑**
   - 多用户同时编辑
   - 评论和反馈机制
   - 变更通知和审阅工作流

## 数据模型

### 文档模型扩展

在Prisma模型中添加以下实体：

```prisma
// 文档实体
model Document {
  id             String           @id @default(cuid())
  title          String
  content        String           @db.Text
  format         DocumentFormat   @default(MARKDOWN)
  status         DocumentStatus   @default(DRAFT)
  projectId      String?
  project        Project?         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  parentId       String?
  parent         Document?        @relation("DocumentHierarchy", fields: [parentId], references: [id])
  children       Document[]       @relation("DocumentHierarchy")
  taskId         String?
  task           Task?            @relation(fields: [taskId], references: [id], onDelete: Cascade)
  createdById    String
  createdBy      User             @relation("CreatedDocuments", fields: [createdById], references: [id])
  updatedById    String
  updatedBy      User             @relation("UpdatedDocuments", fields: [updatedById], references: [id])
  versions       DocumentVersion[]
  templateId     String?
  template       DocumentTemplate? @relation(fields: [templateId], references: [id])
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@map("documents")
}

// 文档版本实体
model DocumentVersion {
  id             String           @id @default(cuid())
  versionNumber  Int
  content        String           @db.Text
  documentId     String
  document       Document         @relation(fields: [documentId], references: [id], onDelete: Cascade)
  createdById    String
  createdBy      User             @relation(fields: [createdById], references: [id])
  createdAt      DateTime         @default(now())

  @@unique([documentId, versionNumber])
  @@map("document_versions")
}

// 文档模板实体
model DocumentTemplate {
  id             String           @id @default(cuid())
  title          String
  description    String?
  content        String           @db.Text
  format         DocumentFormat   @default(MARKDOWN)
  category       String?
  isGlobal       Boolean          @default(false)
  projectId      String?
  project        Project?         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  documents      Document[]
  createdById    String
  createdBy      User             @relation(fields: [createdById], references: [id])
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@map("document_templates")
}

// 文档格式枚举
enum DocumentFormat {
  MARKDOWN
  RICH_TEXT
  PLAIN_TEXT
}

// 文档状态枚举
enum DocumentStatus {
  DRAFT
  REVIEW
  PUBLISHED
  ARCHIVED
}

// 用户关系扩展
model User {
  // 现有字段...
  createdDocuments    Document[]      @relation("CreatedDocuments")
  updatedDocuments    Document[]      @relation("UpdatedDocuments")
  documentVersions    DocumentVersion[]
}

// 项目关系扩展
model Project {
  // 现有字段...
  documents          Document[]
  documentTemplates  DocumentTemplate[]
}

// 任务关系扩展
model Task {
  // 现有字段...
  documents          Document[]
}
```

### 关系和索引

为提高查询性能，添加以下索引：

```prisma
// 项目文档索引
@@index([projectId])

// 任务文档索引
@@index([taskId])

// 文档层级索引
@@index([parentId])

// 文档模板索引
@@index([templateId])

// 文档创建者索引
@@index([createdById])
```

## API设计

### 文档API端点

1. **项目文档API**

```
/api/projects/:projectId/documents
  GET    - 获取项目文档列表
  POST   - 创建新文档

/api/projects/:projectId/documents/:documentId
  GET    - 获取文档详情
  PATCH  - 更新文档
  DELETE - 删除文档

/api/projects/:projectId/documents/:documentId/versions
  GET    - 获取文档版本历史
  POST   - 创建新版本

/api/projects/:projectId/documents/:documentId/versions/:versionId
  GET    - 获取特定版本
  POST   - 恢复到此版本
```

2. **任务文档API**

```
/api/projects/:projectId/tasks/:taskId/documents
  GET    - 获取任务文档列表
  POST   - 创建任务文档

/api/projects/:projectId/tasks/:taskId/documents/:documentId
  GET    - 获取任务文档详情
  PATCH  - 更新任务文档
  DELETE - 删除任务文档
```

3. **文档模板API**

```
/api/document-templates
  GET    - 获取全局模板列表
  POST   - 创建全局模板

/api/projects/:projectId/document-templates
  GET    - 获取项目模板列表
  POST   - 创建项目模板

/api/projects/:projectId/document-templates/:templateId
  GET    - 获取模板详情
  PATCH  - 更新模板
  DELETE - 删除模板
```

### API实现示例

**获取项目文档列表**

```typescript
// /app/api/projects/[projectId]/documents/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  apiResponse,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiForbidden
} from '@/lib/api-response';
import { hasProjectPermission } from '@/features/project-management/utils/project-permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const projectId = params.projectId;

  // 检查用户是否有查看项目的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'project.view',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden('您没有权限查看此项目');
  }

  // 解析查询参数
  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get('parentId');
  const search = searchParams.get('search');
  const status = searchParams.get('status');

  // 构建查询条件
  const where: any = { projectId };

  // 文件夹过滤
  if (parentId) {
    where.parentId = parentId;
  } else {
    // 根级文档（无父文档）
    where.parentId = null;
  }

  // 状态过滤
  if (status) {
    where.status = status;
  }

  // 搜索过滤
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } }
    ];
  }

  try {
    // 获取文档列表
    const documents = await prisma.document.findMany({
      where,
      select: {
        id: true,
        title: true,
        format: true,
        status: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        _count: {
          select: {
            children: true,
            versions: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return apiResponse(documents);
  } catch (error) {
    console.error('获取项目文档失败:', error);
    return apiError(
      'SERVER_ERROR',
      '获取项目文档失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const projectId = params.projectId;

  // 检查用户是否有创建文档的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'document.create',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden('您没有权限在此项目中创建文档');
  }

  try {
    const body = await request.json();

    // 验证请求数据
    // ...验证逻辑...

    // 创建文档
    const document = await prisma.document.create({
      data: {
        title: body.title,
        content: body.content || '',
        format: body.format || 'MARKDOWN',
        status: body.status || 'DRAFT',
        projectId,
        parentId: body.parentId,
        templateId: body.templateId,
        createdById: user.id,
        updatedById: user.id
      }
    });

    // 创建初始版本
    await prisma.documentVersion.create({
      data: {
        versionNumber: 1,
        content: body.content || '',
        documentId: document.id,
        createdById: user.id
      }
    });

    return apiResponse(document, null, 201);
  } catch (error) {
    console.error('创建文档失败:', error);
    return apiError(
      'SERVER_ERROR',
      '创建文档失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}
```

**文档详情API**

```typescript
// /app/api/projects/[projectId]/documents/[documentId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  apiResponse,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiForbidden
} from '@/lib/api-response';
import { hasProjectPermission } from '@/features/project-management/utils/project-permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; documentId: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return apiUnauthorized();
  }

  const { projectId, documentId } = params;

  // 检查用户是否有查看项目的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'project.view',
    user.id
  );

  if (!hasPermission) {
    return apiForbidden('您没有权限查看此项目');
  }

  try {
    // 获取文档详情
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        projectId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        versions: {
          select: {
            id: true,
            versionNumber: true,
            createdAt: true,
            createdBy: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            versionNumber: 'desc'
          },
          take: 1
        },
        children: {
          select: {
            id: true,
            title: true
          },
          orderBy: {
            title: 'asc'
          }
        },
        parent: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!document) {
      return apiNotFound('文档不存在');
    }

    return apiResponse(document);
  } catch (error) {
    console.error('获取文档详情失败:', error);
    return apiError(
      'SERVER_ERROR',
      '获取文档详情失败',
      process.env.NODE_ENV === 'development' ? error : undefined,
      500
    );
  }
}

// 实现PATCH和DELETE方法...
```

## 前端实现

### 页面实现

**文档列表页面**

```tsx
// /app/dashboard/projects/[projectId]/documents/page.tsx

import { Metadata } from 'next';
import { DocumentList } from '@/features/project-management/components/document/document-list';
import { DocumentFilter } from '@/features/project-management/components/document/document-filter';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { getProjectById } from '@/features/project-management/actions/project-actions';
import { hasProjectPermission } from '@/features/project-management/utils/project-permissions';
import { getCurrentUser } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';

export async function generateMetadata({
  params
}: {
  params: { projectId: string };
}): Promise<Metadata> {
  const project = await getProjectById(params.projectId);

  if (!project) {
    return {
      title: '项目不存在'
    };
  }

  return {
    title: `${project.name} - 文档`,
    description: `${project.name} 项目的文档库`
  };
}

export default async function ProjectDocumentsPage({
  params,
  searchParams
}: {
  params: { projectId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  const projectId = params.projectId;

  // 检查用户是否有查看项目的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'project.view',
    user.id
  );

  if (!hasPermission) {
    redirect('/dashboard/projects');
  }

  const project = await getProjectById(projectId);

  if (!project) {
    notFound();
  }

  // 检查创建文档权限
  const canCreateDocument = await hasProjectPermission(
    projectId,
    'document.create',
    user.id
  );

  // 获取当前文件夹ID
  const parentId = searchParams.parentId as string | undefined;

  return (
    <div className='container space-y-6 py-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold tracking-tight'>项目文档</h1>
        {canCreateDocument && (
          <Button asChild>
            <Link
              href={`/dashboard/projects/${projectId}/documents/new${parentId ? `?parentId=${parentId}` : ''}`}
            >
              <PlusIcon className='mr-2 h-4 w-4' />
              新建文档
            </Link>
          </Button>
        )}
      </div>

      <DocumentFilter projectId={projectId} />

      <DocumentList projectId={projectId} parentId={parentId} />
    </div>
  );
}
```

**文档编辑页面**

```tsx
// /app/dashboard/projects/[projectId]/documents/[documentId]/edit/page.tsx

import { Metadata } from 'next';
import { DocumentEditor } from '@/features/project-management/components/document/document-editor';
import { getDocumentById } from '@/features/project-management/actions/document-actions';
import { hasProjectPermission } from '@/features/project-management/utils/project-permissions';
import { getCurrentUser } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';

export async function generateMetadata({
  params
}: {
  params: { projectId: string; documentId: string };
}): Promise<Metadata> {
  const document = await getDocumentById(params.projectId, params.documentId);

  if (!document) {
    return {
      title: '文档不存在'
    };
  }

  return {
    title: `编辑 - ${document.title}`,
    description: `编辑文档 ${document.title}`
  };
}

export default async function EditDocumentPage({
  params
}: {
  params: { projectId: string; documentId: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  const { projectId, documentId } = params;

  // 检查用户是否有编辑文档的权限
  const hasPermission = await hasProjectPermission(
    projectId,
    'document.update',
    user.id
  );

  if (!hasPermission) {
    redirect(`/dashboard/projects/${projectId}/documents/${documentId}`);
  }

  const document = await getDocumentById(projectId, documentId);

  if (!document) {
    notFound();
  }

  return (
    <div className='container space-y-6 py-6'>
      <h1 className='text-3xl font-bold tracking-tight'>编辑文档</h1>

      <DocumentEditor
        projectId={projectId}
        documentId={documentId}
        initialDocument={document}
      />
    </div>
  );
}
```

### 组件实现

**文档列表组件**

```tsx
// /features/project-management/components/document/document-list.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentCard } from './document-card';
import { DocumentFolderCard } from './document-folder-card';
import { DocumentBreadcrumb } from './document-breadcrumb';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowUpIcon, FolderIcon, FileTextIcon } from 'lucide-react';

interface DocumentListProps {
  projectId: string;
  parentId?: string;
}

export function DocumentList({ projectId, parentId }: DocumentListProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [parentDocument, setParentDocument] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取文档列表
  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      // 构建查询字符串
      const queryParams = new URLSearchParams();
      if (parentId) queryParams.set('parentId', parentId);

      const response = await fetch(
        `/api/projects/${projectId}/documents?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error('获取文档列表失败');
      }

      const data = await response.json();

      if (data.success) {
        setDocuments(data.data);

        // 如果有父文档ID，获取父文档信息
        if (parentId) {
          fetchParentDocument(parentId);
        } else {
          setParentDocument(null);
        }
      } else {
        setError(data.error?.message || '获取文档列表失败');
      }
    } catch (error) {
      setError('获取文档列表失败');
      console.error('获取文档列表错误:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取父文档信息
  const fetchParentDocument = async (docId: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/documents/${docId}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setParentDocument(data.data);
        }
      }
    } catch (error) {
      console.error('获取父文档错误:', error);
    }
  };

  // 初始加载数据
  useEffect(() => {
    fetchDocuments();
  }, [projectId, parentId]);

  // 处理返回上级目录
  const handleGoUp = () => {
    if (parentDocument?.parentId) {
      router.push(
        `/dashboard/projects/${projectId}/documents?parentId=${parentDocument.parentId}`
      );
    } else {
      router.push(`/dashboard/projects/${projectId}/documents`);
    }
  };

  // 处理打开文档
  const handleOpenDocument = (document: any) => {
    if (document._count.children > 0) {
      // 如果是文件夹，导航到该文件夹
      router.push(
        `/dashboard/projects/${projectId}/documents?parentId=${document.id}`
      );
    } else {
      // 如果是文档，打开文档详情
      router.push(`/dashboard/projects/${projectId}/documents/${document.id}`);
    }
  };

  // 加载中状态
  if (loading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-12 w-full' />
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className='h-[150px] rounded-lg' />
          ))}
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <Alert variant='destructive'>
        <AlertDescription>错误: {error}</AlertDescription>
      </Alert>
    );
  }

  // 过滤文件夹和文档
  const folders = documents.filter((doc) => doc._count.children > 0);
  const files = documents.filter((doc) => doc._count.children === 0);

  return (
    <div className='space-y-6'>
      {/* 面包屑导航 */}
      <DocumentBreadcrumb
        projectId={projectId}
        currentDocument={parentDocument}
      />

      {/* 返回上级按钮 */}
      {parentId && (
        <Button variant='outline' onClick={handleGoUp} className='mb-4'>
          <ArrowUpIcon className='mr-2 h-4 w-4' />
          返回上级
        </Button>
      )}

      {/* 空状态 */}
      {folders.length === 0 && files.length === 0 && (
        <div className='bg-muted/50 rounded-lg p-8 text-center'>
          <p className='text-muted-foreground mb-4'>当前文件夹为空</p>
          <div className='flex justify-center gap-4'>
            <Button
              variant='outline'
              onClick={() =>
                router.push(
                  `/dashboard/projects/${projectId}/documents/new-folder${parentId ? `?parentId=${parentId}` : ''}`
                )
              }
            >
              <FolderIcon className='mr-2 h-4 w-4' />
              新建文件夹
            </Button>
            <Button
              onClick={() =>
                router.push(
                  `/dashboard/projects/${projectId}/documents/new${parentId ? `?parentId=${parentId}` : ''}`
                )
              }
            >
              <FileTextIcon className='mr-2 h-4 w-4' />
              新建文档
            </Button>
          </div>
        </div>
      )}

      {/* 文件夹列表 */}
      {folders.length > 0 && (
        <div className='space-y-4'>
          <h2 className='text-xl font-semibold'>文件夹</h2>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {folders.map((folder) => (
              <DocumentFolderCard
                key={folder.id}
                folder={folder}
                onClick={() => handleOpenDocument(folder)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 文档列表 */}
      {files.length > 0 && (
        <div className='space-y-4'>
          <h2 className='text-xl font-semibold'>文档</h2>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {files.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                onClick={() => handleOpenDocument(document)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**文档编辑器组件**

```tsx
// /features/project-management/components/document/document-editor.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownEditor } from './markdown-editor';
import { DocumentPreview } from './document-preview';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/components/ui/use-toast';
import { AlertCircleIcon, SaveIcon } from 'lucide-react';

// 文档表单验证模式
const documentSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100, '标题不能超过100个字符'),
  content: z.string(),
  format: z.enum(['MARKDOWN', 'RICH_TEXT', 'PLAIN_TEXT']),
  status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'])
});

type DocumentFormValues = z.infer<typeof documentSchema>;

interface DocumentEditorProps {
  projectId: string;
  documentId?: string;
  initialDocument?: any;
  parentId?: string;
}

export function DocumentEditor({
  projectId,
  documentId,
  initialDocument,
  parentId
}: DocumentEditorProps) {
  const router = useRouter();
  const [tab, setTab] = useState('edit');
  const [isSaving, setIsSaving] = useState(false);

  // 初始化表单
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: initialDocument?.title || '',
      content: initialDocument?.content || '',
      format: initialDocument?.format || 'MARKDOWN',
      status: initialDocument?.status || 'DRAFT'
    }
  });

  // 表单提交处理
  const onSubmit = async (values: DocumentFormValues) => {
    setIsSaving(true);

    try {
      const url = documentId
        ? `/api/projects/${projectId}/documents/${documentId}`
        : `/api/projects/${projectId}/documents`;

      const method = documentId ? 'PATCH' : 'POST';

      // 如果是新建文档，添加parentId
      const body = documentId ? values : { ...values, parentId };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`保存文档失败: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || '保存文档失败');
      }

      // 保存成功
      toast({
        title: documentId ? '文档已更新' : '文档已创建',
        description: `文档「${values.title}」已成功${documentId ? '更新' : '创建'}`
      });

      // 如果是新建文档，跳转到文档详情页
      if (!documentId) {
        router.push(
          `/dashboard/projects/${projectId}/documents/${data.data.id}`
        );
      }
    } catch (error) {
      console.error('保存文档失败:', error);
      toast({
        variant: 'destructive',
        title: '保存失败',
        description:
          error instanceof Error ? error.message : '保存文档时发生错误'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 内容变化时更新预览
  const content = form.watch('content');

  return (
    <div className='space-y-6'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            {/* 标题 */}
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>标题</FormLabel>
                  <FormControl>
                    <Input placeholder='文档标题' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4'>
              {/* 格式 */}
              <FormField
                control={form.control}
                name='format'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>格式</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='选择格式' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='MARKDOWN'>Markdown</SelectItem>
                        <SelectItem value='RICH_TEXT'>富文本</SelectItem>
                        <SelectItem value='PLAIN_TEXT'>纯文本</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 状态 */}
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>状态</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='选择状态' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='DRAFT'>草稿</SelectItem>
                        <SelectItem value='REVIEW'>审核中</SelectItem>
                        <SelectItem value='PUBLISHED'>已发布</SelectItem>
                        <SelectItem value='ARCHIVED'>已归档</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* 编辑器和预览 */}
          <Tabs
            defaultValue='edit'
            value={tab}
            onValueChange={setTab}
            className='w-full'
          >
            <TabsList className='mb-4'>
              <TabsTrigger value='edit'>编辑</TabsTrigger>
              <TabsTrigger value='preview'>预览</TabsTrigger>
            </TabsList>

            <TabsContent value='edit' className='rounded-md border p-4'>
              <FormField
                control={form.control}
                name='content'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <MarkdownEditor
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            <TabsContent
              value='preview'
              className='min-h-[400px] rounded-md border p-4'
            >
              <DocumentPreview content={content} />
            </TabsContent>
          </Tabs>

          {/* 操作按钮 */}
          <div className='flex justify-end gap-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() =>
                documentId
                  ? router.push(
                      `/dashboard/projects/${projectId}/documents/${documentId}`
                    )
                  : router.back()
              }
            >
              取消
            </Button>
            <Button type='submit' disabled={isSaving}>
              {isSaving ? (
                <>保存中...</>
              ) : (
                <>
                  <SaveIcon className='mr-2 h-4 w-4' />
                  保存文档
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
```

## 权限控制

在项目管理模块的权限控制中添加文档相关权限：

```typescript
// /features/project-management/config/role-permissions.ts

// 添加文档相关权限
export type ProjectPermission =
  // 现有权限...
  | 'document.view'
  | 'document.create'
  | 'document.update'
  | 'document.delete'
  | 'document.manage'
  | 'document.template.create'
  | 'document.template.use';

// 角色权限映射表
export const ROLE_PERMISSIONS: Record<ProjectRole, ProjectPermission[]> = {
  OWNER: [
    // 现有权限...
    'document.view',
    'document.create',
    'document.update',
    'document.delete',
    'document.manage',
    'document.template.create',
    'document.template.use'
  ],
  ADMIN: [
    // 现有权限...
    'document.view',
    'document.create',
    'document.update',
    'document.delete',
    'document.manage',
    'document.template.create',
    'document.template.use'
  ],
  MEMBER: [
    // 现有权限...
    'document.view',
    'document.create',
    'document.update',
    'document.template.use'
  ],
  VIEWER: [
    // 现有权限...
    'document.view'
  ]
};
```

## 集成策略

### 导航集成

在项目详情页添加文档导航项：

```tsx
// /app/dashboard/projects/[projectId]/layout.tsx

// 项目导航项
const projectTabs = [
  {
    label: '概览',
    href: `/dashboard/projects/${projectId}`,
    icon: <DashboardIcon className='h-4 w-4' />
  },
  {
    label: '任务',
    href: `/dashboard/projects/${projectId}/tasks`,
    icon: <CheckSquareIcon className='h-4 w-4' />
  },
  {
    label: '看板',
    href: `/dashboard/projects/${projectId}/kanban`,
    icon: <LayoutIcon className='h-4 w-4' />
  },
  {
    label: '迭代',
    href: `/dashboard/projects/${projectId}/sprints`,
    icon: <SparklesIcon className='h-4 w-4' />
  },
  {
    label: '文档',
    href: `/dashboard/projects/${projectId}/documents`,
    icon: <FileTextIcon className='h-4 w-4' />
  },
  {
    label: '团队',
    href: `/dashboard/projects/${projectId}/team`,
    icon: <UsersIcon className='h-4 w-4' />
  },
  {
    label: '设置',
    href: `/dashboard/projects/${projectId}/settings`,
    icon: <SettingsIcon className='h-4 w-4' />
  }
];
```

### 任务详情集成

在任务详情页添加相关文档部分：

```tsx
// /features/project-management/components/task/task-detail.tsx

// 添加相关文档部分
<div className='space-y-4'>
  <div className='flex items-center justify-between'>
    <h3 className='text-lg font-semibold'>相关文档</h3>
    {canCreateDocument && (
      <Button
        variant='outline'
        size='sm'
        onClick={() =>
          router.push(
            `/dashboard/projects/${projectId}/tasks/${taskId}/documents/new`
          )
        }
      >
        <PlusIcon className='mr-2 h-4 w-4' />
        添加文档
      </Button>
    )}
  </div>

  <TaskDocumentList projectId={projectId} taskId={taskId} />
</div>
```

## 测试策略

### 单元测试

对文档功能的关键组件和工具函数进行单元测试：

```typescript
// /tests/unit/document-utils.test.ts

import { describe, it, expect } from 'vitest';
import {
  formatDocumentDate,
  getDocumentStatusText
} from '@/features/project-management/utils/document-utils';

describe('Document Utils', () => {
  describe('formatDocumentDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2023-01-15T10:30:00Z');
      expect(formatDocumentDate(date)).toBe('2023年1月15日 10:30');
    });

    it('should handle null date', () => {
      expect(formatDocumentDate(null)).toBe('N/A');
    });
  });

  describe('getDocumentStatusText', () => {
    it('should return correct text for DRAFT status', () => {
      expect(getDocumentStatusText('DRAFT')).toBe('草稿');
    });

    it('should return correct text for PUBLISHED status', () => {
      expect(getDocumentStatusText('PUBLISHED')).toBe('已发布');
    });

    it('should return correct text for REVIEW status', () => {
      expect(getDocumentStatusText('REVIEW')).toBe('审核中');
    });

    it('should return correct text for ARCHIVED status', () => {
      expect(getDocumentStatusText('ARCHIVED')).toBe('已归档');
    });

    it('should handle unknown status', () => {
      expect(getDocumentStatusText('UNKNOWN' as any)).toBe('未知状态');
    });
  });
});
```

### 集成测试

测试文档API端点：

```typescript
// /tests/integration/document-api.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/projects/[projectId]/documents/route';
import { prisma } from '@/lib/prisma';
import { mockCurrentUser } from '../mocks/auth';
import {
  createTestProject,
  createTestDocument,
  cleanupTestDocuments
} from '../utils/test-helpers';

describe('Documents API', () => {
  let projectId: string;

  beforeAll(async () => {
    // 创建测试数据
    const project = await createTestProject();
    projectId = project.id;
  });

  afterAll(async () => {
    // 清理测试数据
    await cleanupTestDocuments();
  });

  describe('GET /api/projects/:projectId/documents', () => {
    it('should return project documents for authenticated user', async () => {
      // 模拟认证用户
      mockCurrentUser({
        id: 'test-user',
        name: 'Test User'
      });

      const { req, res } = createMocks({
        method: 'GET',
        url: `/api/projects/${projectId}/documents`,
        params: {
          projectId
        }
      });

      await GET(req, { params: { projectId } });

      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    // 更多测试...
  });

  describe('POST /api/projects/:projectId/documents', () => {
    it('should create a new document', async () => {
      // 模拟认证用户
      mockCurrentUser({
        id: 'test-user',
        name: 'Test User'
      });

      const documentData = {
        title: 'Test Document',
        content: 'This is a test document',
        format: 'MARKDOWN',
        status: 'DRAFT'
      };

      const { req, res } = createMocks({
        method: 'POST',
        url: `/api/projects/${projectId}/documents`,
        params: {
          projectId
        },
        body: documentData
      });

      await POST(req, { params: { projectId } });

      expect(res._getStatusCode()).toBe(201);

      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('Test Document');

      // 验证文档是否创建成功
      const document = await prisma.document.findFirst({
        where: { title: 'Test Document' }
      });
      expect(document).not.toBeNull();
    });

    // 更多测试...
  });
});
```

### 端到端测试

使用Playwright测试文档功能：

```typescript
// /tests/e2e/document-management.spec.ts

import { test, expect } from '@playwright/test';
import { login, createTestProject } from './utils';

test.describe('Document Management', () => {
  let projectId: string;

  test.beforeAll(async ({ browser }) => {
    // 创建测试项目
    const project = await createTestProject();
    projectId = project.id;
  });

  test.beforeEach(async ({ page }) => {
    // 登录测试用户
    await login(page, 'test@example.com', 'password');
  });

  test('should create and view a document', async ({ page }) => {
    // 导航到项目文档页面
    await page.goto(`/dashboard/projects/${projectId}/documents`);

    // 点击创建新文档按钮
    await page.click('text=新建文档');

    // 填写文档表单
    await page.fill('input[name="title"]', '测试文档');
    await page.fill(
      '.monaco-editor textarea',
      '# 测试标题\n\n这是一个测试文档的内容。'
    );

    // 提交表单
    await page.click('button:has-text("保存文档")');

    // 验证跳转到文档详情页面
    await expect(page).toHaveURL(
      /\/dashboard\/projects\/[\w-]+\/documents\/[\w-]+/
    );

    // 验证文档信息显示正确
    await expect(page.locator('h1')).toContainText('测试文档');
    await expect(page.locator('h1.markdown-heading')).toContainText('测试标题');
    await expect(page.locator('p')).toContainText('这是一个测试文档的内容');
  });

  // 更多测试...
});
```

通过实施这些文档功能，项目管理模块将提供全面的文档管理能力，支持项目团队有效地创建、组织和共享知识。
